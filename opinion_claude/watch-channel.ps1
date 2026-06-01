# watch-channel.ps1
# 역할: agent_chat/messages.jsonl 에 'claude 앞으로 온 새 메시지'가 생기면
#       플래그를 출력하고 즉시 종료한다 (종료 = Claude 재호출 트리거).
# 멍청한 보초: 판단/응답/pause강제 안 함. pause 판단은 깨어난 Claude가 state.json 보고 직접.
param(
  [string]$Me = "claude",
  [string]$Channel = (Join-Path $PSScriptRoot "..\agent_chat\messages.jsonl"),
  [int]$IntervalSec = 5
)
$ErrorActionPreference = "SilentlyContinue"

function LineCount($p) { if (Test-Path -LiteralPath $p) { @(Get-Content -LiteralPath $p).Count } else { 0 } }

$baseline = LineCount $Channel
Write-Output "WATCHER_READY :: me=$Me :: baseline_lines=$baseline :: $Channel"

while ($true) {
  Start-Sleep -Seconds $IntervalSec
  $lines = @(Get-Content -LiteralPath $Channel)
  if ($lines.Count -le $baseline) { continue }
  $new = $lines[$baseline..($lines.Count - 1)]
  $baseline = $lines.Count
  foreach ($ln in $new) {
    if ([string]::IsNullOrWhiteSpace($ln)) { continue }
    try { $m = $ln | ConvertFrom-Json } catch { continue }
    # 'to == me' 또는 'to == all'만 나를 깨운다. 사용자가 To:codex 로 보낸 건 무시
    # (이전엔 from=='user' catch-all 때문에 codex 전용 메시지에도 깨어났음).
    $forMe = ($m.to -eq $Me -or $m.to -eq "all")
    if ($m.from -ne $Me -and $forMe) {
      Write-Output ("FLAG :: MSG_FOR_{0} :: from={1} type={2} task={3} id={4}" -f $Me.ToUpper(), $m.from, $m.type, $m.task_id, $m.id)
      exit 0
    }
  }
}
