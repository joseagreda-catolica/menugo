#Requires -Version 5.1
<#
===============================================================================
 MenuGo - carga del plan de trabajo en GitHub Issues
 UNICAES . Tecnicas de Produccion de Sistemas

 Lee menugo-tareas.csv y crea en el repositorio:
   . 9 milestones (uno por semana, con fecha limite)
   . 14 etiquetas (responsable, modulo, hito, documentacion)
   . 134 issues asignados a quien corresponde

 SE PUEDE VOLVER A EJECUTAR: antes de crear cada issue revisa si ya existe uno
 con el mismo codigo (B0-01, S3-14, ...) y lo salta. Si se corta a medio camino,
 vuelvan a correrlo y continua donde quedo.

 COMO USARLO
   1. Poner este archivo y menugo-tareas.csv en la misma carpeta.
   2. Editar las tres variables de CONFIGURACION de abajo.
   3. Abrir PowerShell en esa carpeta y ejecutar:
        .\crear-tablero-github.ps1

      Si Windows bloquea el script, ejecutar antes:
        Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
===============================================================================
#>

# ============================== CONFIGURACION ================================
# Lo unico que conviene llenar es UsuarioAlex. El resto se detecta solo.
$Repo        = ""                     # vacio = <tu-usuario>/menugo
$UsuarioJose = ""                     # vacio = el usuario con el que iniciaste sesion
$UsuarioAlex = "atorrento09"                     # usuario de GitHub de Alex (podes dejarlo vacio)
$Csv         = ".\menugo-tareas.csv"  # ruta del CSV
$Pausa       = 3                      # segundos entre issues; no bajar de 2
# =============================================================================

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Salir($msg) { Write-Host ""; Write-Host "ERROR: $msg" -ForegroundColor Red; exit 1 }
function Paso($msg)  { Write-Host ""; Write-Host "==> $msg" -ForegroundColor Cyan }

# --------------------------- Verificaciones previas --------------------------
Paso "Verificando requisitos"

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Salir "No se encontro GitHub CLI. Instalalo con:  winget install --id GitHub.cli   Luego cerra y volve a abrir PowerShell."
}

gh auth status 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) { Salir "No hay sesion de GitHub. Ejecuta:  gh auth login" }

if (-not (Test-Path $Csv)) { Salir "No se encontro el archivo $Csv en esta carpeta." }

# --- Usuario autenticado ---
$login = gh api user --jq .login 2>$null
if ($LASTEXITCODE -ne 0 -or -not $login) { Salir "No se pudo leer tu usuario de GitHub. Ejecuta:  gh auth login" }
$login = "$login".Trim()

if (-not $Repo)        { $Repo = "$login/menugo" }
if (-not $UsuarioJose) { $UsuarioJose = $login }

Write-Host "    GitHub CLI: OK"
Write-Host "    Sesion iniciada como: $login"
Write-Host "    Repositorio: $Repo"

# --- El repositorio existe? Si no, se ofrece crearlo ---
gh repo view $Repo 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "El repositorio $Repo todavia no existe." -ForegroundColor Yellow
  $r = Read-Host "Lo creo ahora como repositorio privado? (s/n)"
  if ($r -match '^[sSyY]') {
    gh repo create $Repo --private --description "MenuGo - Sistema de pedidos y comandas para restaurantes (UNICAES)" 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { Salir "No se pudo crear el repositorio $Repo." }
    Write-Host "    Creado: https://github.com/$Repo" -ForegroundColor Green
  } else {
    Salir "Crea el repositorio en GitHub y volve a ejecutar el script."
  }
}

if (-not $UsuarioAlex) {
  Write-Host "    AVISO: no pusiste el usuario de Alex." -ForegroundColor Yellow
  Write-Host "           Sus tareas se crean con la etiqueta resp:alex pero sin asignar."
  Write-Host "           Podes asignarlas despues filtrando por esa etiqueta en GitHub."
}

$tareas = Import-Csv -Path $Csv -Encoding UTF8
Write-Host "    Tareas en el CSV: $($tareas.Count)"

# -------------------------------- Etiquetas ----------------------------------
Paso "Creando etiquetas"

$etiquetas = @(
  @("resp:jose",      "1F5F8B", "Responsable principal: Jose"),
  @("resp:alex",      "A65E1E", "Responsable principal: Alex"),
  @("resp:ambos",     "4B5F55", "Trabajo conjunto de los dos"),
  @("M1-carta",       "0D6E58", "Administracion de la carta"),
  @("M2-publica",     "0D6E58", "Carta publica por QR"),
  @("M3-mesas",       "0D6E58", "Gestion de mesas"),
  @("M4-pedidos",     "0D6E58", "Toma de pedidos"),
  @("M5-cocina",      "0D6E58", "Pantalla de cocina"),
  @("M6-cuenta",      "0D6E58", "Cierre de cuenta y caja"),
  @("M7-reportes",    "0D6E58", "Reportes de venta"),
  @("M8-seguridad",   "0D6E58", "Usuarios, roles y bitacora"),
  @("hito",           "A8322A", "Punto de control que no se puede mover"),
  @("documentacion",  "6E635D", "Documentacion y entregables escritos"),
  @("version-futura", "C3CEC7", "Fuera del alcance de este ciclo - riesgo R-01")
)

foreach ($e in $etiquetas) {
  gh label create $e[0] --repo $Repo --color $e[1] --description $e[2] --force 2>&1 | Out-Null
  Write-Host "    $($e[0])"
}

# ------------------------------- Milestones ----------------------------------
Paso "Creando milestones con fecha limite"

# Las fechas se identifican por el prefijo del codigo de tarea (B0, S1 ... S8),
# y el titulo se toma del propio CSV. Asi no dependemos de tildes en el script.
$vencimientos = @{
  "B0" = "2026-09-13"; "S1" = "2026-09-20"; "S2" = "2026-09-27"
  "S3" = "2026-10-04"; "S4" = "2026-10-11"; "S5" = "2026-10-18"
  "S6" = "2026-10-25"; "S7" = "2026-11-01"; "S8" = "2026-11-08"
}

$semanas = $tareas | Group-Object Semana | ForEach-Object {
  $pref = ($_.Group[0].ID -split '-')[0]
  [pscustomobject]@{ Titulo = $_.Name; Prefijo = $pref; Due = $vencimientos[$pref] }
} | Sort-Object Prefijo

$existentes = @{}
$json = gh api "repos/$Repo/milestones?state=all&per_page=100" 2>&1
if ($LASTEXITCODE -eq 0) {
  foreach ($m in ($json | ConvertFrom-Json)) { $existentes[$m.title] = $true }
}

foreach ($s in $semanas) {
  if ($existentes.ContainsKey($s.Titulo)) {
    Write-Host "    ya existia: $($s.Titulo)"
    continue
  }
  $due = $s.Due + "T23:59:59Z"
  gh api "repos/$Repo/milestones" -X POST -f "title=$($s.Titulo)" -f "due_on=$due" 2>&1 | Out-Null
  if ($LASTEXITCODE -eq 0) { Write-Host "    creado: $($s.Titulo)  (vence $($s.Due))" }
  else { Write-Host "    no se pudo crear: $($s.Titulo)" -ForegroundColor Yellow }
}

# --------------------------------- Issues ------------------------------------
Paso "Revisando que issues ya existen"

$yaCreados = @{}
$listado = gh issue list --repo $Repo --state all --limit 500 --json title 2>&1
if ($LASTEXITCODE -eq 0) {
  foreach ($i in ($listado | ConvertFrom-Json)) {
    if ($i.title -match '^([A-Z]\d-\d{2})') { $yaCreados[$Matches[1]] = $true }
  }
}
Write-Host "    Issues del plan ya presentes: $($yaCreados.Count)"

$labelModulo = @{
  "M1" = "M1-carta";    "M2" = "M2-publica"; "M3" = "M3-mesas"
  "M4" = "M4-pedidos";  "M5" = "M5-cocina";  "M6" = "M6-cuenta"
  "M7" = "M7-reportes"; "M8" = "M8-seguridad"
}

$pendientes = @($tareas | Where-Object { -not $yaCreados.ContainsKey($_.ID) })

Paso "Creando $($pendientes.Count) issues"
if ($pendientes.Count -eq 0) { Write-Host "    No hay nada que crear. Todo listo."; exit 0 }

$minutos = [math]::Ceiling($pendientes.Count * ($Pausa + 1) / 60)
Write-Host "    Esto tarda alrededor de $minutos minutos. Dejalo correr sin interrumpir."
Write-Host ""

$n = 0
$fallidos = @()
$tmp = [System.IO.Path]::GetTempFileName()
$utf8 = New-Object System.Text.UTF8Encoding($false)

foreach ($t in $pendientes) {
  $n++

  # --- responsable (sin depender de tildes: Jose / Alex / Ambos) ---
  $resp = "resp:ambos"; $quien = ""
  switch -Wildcard ($t.Responsable) {
    "J*"  { $resp = "resp:jose";  $quien = $UsuarioJose }
    "Al*" { $resp = "resp:alex";  $quien = $UsuarioAlex }
    "Am*" { $resp = "resp:ambos"; $quien = "" }
  }

  # --- etiquetas ---
  $labels = New-Object System.Collections.Generic.List[string]
  $labels.Add($resp)
  if ($t.Modulo -and $labelModulo.ContainsKey($t.Modulo)) { $labels.Add($labelModulo[$t.Modulo]) }
  if ($t.Hito) { $labels.Add("hito") }
  if ($t.Titulo -match "(?i)document|manual|guion|diccionario|redactar|presentaci") { $labels.Add("documentacion") }

  # --- cuerpo ---
  $lineas = New-Object System.Collections.Generic.List[string]
  if ($t.Detalle) { $lineas.Add($t.Detalle) } else { $lineas.Add("_Sin detalle adicional._") }
  $lineas.Add(""); $lineas.Add("---"); $lineas.Add("")
  $lineas.Add("**Responsable:** $($t.Responsable)")
  $lineas.Add("**Semana:** $($t.Semana) - $($t.Fechas)")
  $lineas.Add("**Estimacion:** $($t.Horas) h")
  if ($t.Requerimientos) { $lineas.Add("**Verifica:** $($t.Requerimientos)") }
  $lineas.Add("")
  $lineas.Add("**Terminado cuando:** el otro integrante lo reviso en un pull request y lo aprobo.")

  [System.IO.File]::WriteAllText($tmp, ($lineas -join "`n"), $utf8)

  $titulo = "$($t.ID) - $($t.Titulo)"
  Write-Host ("    [{0,3}/{1}] {2}" -f $n, $pendientes.Count, $titulo)

  $ghArgs = @(
    "issue", "create",
    "--repo", $Repo,
    "--title", $titulo,
    "--body-file", $tmp,
    "--label", ($labels -join ","),
    "--milestone", $t.Semana
  )
  if ($quien) { $ghArgs += @("--assignee", $quien) }

  gh @ghArgs 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) {
    Write-Host "        no se pudo crear" -ForegroundColor Yellow
    $fallidos += $t.ID
  }

  Start-Sleep -Seconds $Pausa
}

Remove-Item $tmp -ErrorAction SilentlyContinue

# --------------------------------- Cierre ------------------------------------
Paso "Listo"
Write-Host "    Issues creados: $($n - $fallidos.Count) de $($pendientes.Count)"
if ($fallidos.Count -gt 0) {
  Write-Host "    Fallaron: $($fallidos -join ', ')" -ForegroundColor Yellow
  Write-Host "    Volve a ejecutar el script: solo intentara los que faltan."
}

Write-Host ""
Write-Host "SIGUIENTE PASO - agregar los issues al Project:" -ForegroundColor Green
Write-Host "  1. En GitHub, entra a la pestana Issues del repositorio."
Write-Host "  2. Marca la casilla del encabezado para seleccionar los 134."
Write-Host "  3. En la barra de la derecha abri 'Projects' y elegi tu tablero."
Write-Host "     Se agregan todos de una sola vez."
Write-Host "  4. Dentro del Project, agrupa por 'Milestone' para ver las 8 semanas."
Write-Host ""
