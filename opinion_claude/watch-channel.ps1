# watch-channel.ps1
# Role: when a new message addressed to Claude appears in
#       agent_chat/messages.jsonl, print a flag and exit immediately
#       (exit = trigger for the harness to re-invoke Claude).
# Dumb sentinel: it does not judge/answer/force-pause. The awakened Claude
# decides pause by reading state.json itself.
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
    # Only 'to == me' or 'to == all' wakes me. A message the user sent to
    # codex (To:codex) is ignored (previously a from=='user' catch-all woke
    # me even on codex-only messages).
    $forMe = ($m.to -eq $Me -or $m.to -eq "all")
    if ($m.from -ne $Me -and $forMe) {
      Write-Output ("FLAG :: MSG_FOR_{0} :: from={1} type={2} task={3} id={4}" -f $Me.ToUpper(), $m.from, $m.type, $m.task_id, $m.id)
      exit 0
    }
  }
}
