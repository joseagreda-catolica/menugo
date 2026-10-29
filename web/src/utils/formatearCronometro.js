// Cronometro: "5:07" (min:seg) y, pasada la hora, "1:05:07" (h:min:seg).
export function formatearCronometro(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const horas = Math.floor(total / 3600)
  const minutos = Math.floor((total % 3600) / 60)
  const segundos = String(total % 60).padStart(2, '0')
  return horas > 0 ? `${horas}:${String(minutos).padStart(2, '0')}:${segundos}` : `${minutos}:${segundos}`
}
