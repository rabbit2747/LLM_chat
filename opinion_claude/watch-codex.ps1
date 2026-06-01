# watch-codex.ps1
# Role: when a new .md appears in opinion_codex/, print a flag and exit
# immediately. It does not judge or write (dumb sentinel). Exit = trigger for
# the harness to re-invoke Claude.
param(
  [string]$Watch = (Join-Path $PSScriptRoot "..\opinion_codex"),
  [int]$IntervalSec = 5
)
$ErrorActionPreference = 'SilentlyContinue'

function Snapshot($d) {
  $h = @{}
  Get-ChildItem -Recurse -File -Filter *.md -Path $d | ForEach-Object {
    $h[$_.FullName] = $_.LastWriteTimeUtc.Ticks
  }
  return $h
}

# Baseline: files that exist now are treated as "already seen" (avoids
# re-flagging old files on restart).
$base = Snapshot $Watch
Write-Output "WATCHER_READY :: baseline=$($base.Count) files :: watching $Watch"

while ($true) {
  Start-Sleep -Seconds $IntervalSec
  $cur = Snapshot $Watch
  foreach ($k in $cur.Keys) {
    if (-not $base.ContainsKey($k) -or $base[$k] -ne $cur[$k]) {
      Write-Output "FLAG :: NEW_OR_CHANGED :: $k"
      exit 0
    }
  }
}
