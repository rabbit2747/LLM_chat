# watch-codex.ps1
# 역할: opinion_codex/ 에 새 .md 가 올라오면 "플래그"를 출력하고 즉시 종료한다.
# 판단/작성은 하지 않는다 (멍청한 보초). 종료 = Claude 재호출 트리거.
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

# 기준선: 지금 존재하는 파일은 "이미 본 것"으로 간주 (재시작 시 옛 파일 재플래그 방지)
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
