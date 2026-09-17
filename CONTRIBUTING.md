# Guía de contribución

## Ramas

- `main`: rama estable. Nadie hace push directo aquí — todo entra por pull request.
- `develop`: rama de integración del trabajo en curso.
- Ramas de característica, una por módulo o tarea: `feat/M3-mapa-mesas`, `fix/M5-estado-comanda`, etc.

## Commits

Formato: `tipo(módulo): descripción corta`

Ejemplos:
- `feat(M3): agregar generación de QR por mesa`
- `fix(M5): corregir transición de estado de comanda`
- `docs(readme): actualizar stack técnico`

Tipos usados: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`.

## Pull requests

Todo PR lo revisa el otro integrante antes de fusionar a `develop` o `main`. Un PR se considera terminado cuando el revisor lo aprueba explícitamente.
