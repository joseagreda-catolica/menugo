import { describe, it, expect, vi, beforeEach } from 'vitest';
import { crearPrecioService } from '../precio.service';

function crearRepositorioFalso() {
  return {
    findVigente: vi.fn(),
    cerrarVigente: vi.fn(),
    crear: vi.fn(),
  };
}

describe('precio.service', () => {
  let repo;
  let precioService;

  beforeEach(() => {
    repo = crearRepositorioFalso();
    precioService = crearPrecioService(repo);
  });

  it('crea el primer precio vigente cuando el platillo no tiene ninguno', async () => {
    repo.findVigente.mockResolvedValue(null);
    repo.crear.mockResolvedValue({ id: 1, platilloId: 10, precio: 6.5 });

    const resultado = await precioService.actualizarPrecio(10, 6.5);

    expect(repo.cerrarVigente).not.toHaveBeenCalled();
    expect(repo.crear).toHaveBeenCalledWith(10, 6.5);
    expect(resultado.precio).toBe(6.5);
  });

  it('cierra el precio anterior antes de crear uno nuevo cuando el precio cambia', async () => {
    repo.findVigente.mockResolvedValue({ id: 1, platilloId: 10, precio: 6.5, vigenteHasta: null });
    repo.crear.mockResolvedValue({ id: 2, platilloId: 10, precio: 7.0 });

    await precioService.actualizarPrecio(10, 7.0);

    expect(repo.cerrarVigente).toHaveBeenCalledWith(10);
    expect(repo.crear).toHaveBeenCalledWith(10, 7.0);

    const ordenCierre = repo.cerrarVigente.mock.invocationCallOrder[0];
    const ordenCreacion = repo.crear.mock.invocationCallOrder[0];
    expect(ordenCierre).toBeLessThan(ordenCreacion);
  });

  it('no crea un registro nuevo si el precio enviado es igual al vigente', async () => {
    const vigente = { id: 1, platilloId: 10, precio: 6.5, vigenteHasta: null };
    repo.findVigente.mockResolvedValue(vigente);

    const resultado = await precioService.actualizarPrecio(10, 6.5);

    expect(repo.cerrarVigente).not.toHaveBeenCalled();
    expect(repo.crear).not.toHaveBeenCalled();
    expect(resultado).toBe(vigente);
  });

  it('un pedido ya tomado no se ve afectado por un cambio de precio posterior', async () => {
    // Esto es lo que realmente protege RF-04: pedido_linea.precioUnitario es
    // una copia hecha en el momento de agregar la linea (ver
    // docs/diccionario-datos.md), no una referencia al precio vigente.
    // precio.service solo gestiona el historial; aqui se simula el snapshot
    // que haria pedido.service al agregar una linea al pedido.
    repo.findVigente.mockResolvedValueOnce({ id: 1, platilloId: 10, precio: 6.5, vigenteHasta: null });
    const precioAlMomentoDelPedido = (await precioService.obtenerVigente(10)).precio;

    repo.findVigente.mockResolvedValueOnce({ id: 1, platilloId: 10, precio: 6.5, vigenteHasta: null });
    repo.crear.mockResolvedValueOnce({ id: 2, platilloId: 10, precio: 8.0 });
    await precioService.actualizarPrecio(10, 8.0);

    expect(precioAlMomentoDelPedido).toBe(6.5);
  });
});
