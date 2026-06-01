# watch-channel.ps1
# Role: wake Claude when there is an UNPROCESSED message addressed to it.
# Cursor-based (backlog-safe): the caller passes -Baseline = the line count
# Claude has already processed. On arm, if the channel already has lines beyond
# that baseline (messages that arrived while Claude was busy / the watcher was
# down), the watcher scans that backlog and flags IMMEDIATELY. Otherwise it
# watches for new lines. Exit = trigger for the harness to re-invoke Claude.
# Dumb sentinel: it does not judge/answer/pause; the awakened Claude decides.
param(
  [string]$Me = "claude",
  [string]$Channel = (Join-Path $PSScriptRoot "..\agent_chat\messages.jsonl"),
  [int]$IntervalSec = 5,
  [int]$Baseline = -1   # lines already processed by Claude; -1 = use current count (back-compat)
)
$ErrorActionPreference = "SilentlyContinue"

function LineCount($p) { if (Test-Path -LiteralPath $p) { @(Get-Content -LiteralPath $p).Count } else { 0 } }

# Scan 1-based line indices $from..$to for a message addressed to me. Returns the
# FLAG string for the first match, or $null. (Must NOT Write-Output here: in
# PowerShell that would be swallowed into the function's return value.)
function ScanForMe($lines, $from, $to, $me) {
  for ($i = $from; $i -le $to; $i++) {
    $ln = $lines[$i - 1]
    if ([string]::IsNullOrWhiteSpace($ln)) { continue }
    try { $m = $ln | ConvertFrom-Json } catch { continue }
    # Only 'to == me' or 'to == all' wakes me; a message sent to codex is ignored.
    $forMe = ($m.to -eq $me -or $m.to -eq "all")
    if ($m.from -ne $me -and $forMe) {
      return ("FLAG :: MSG_FOR_{0} :: from={1} type={2} task={3} id={4}" -f $me.ToUpper(), $m.from, $m.type, $m.task_id, $m.id)
    }
  }
  return $null
}

$count = LineCount $Channel
if ($Baseline -lt 0) { $Baseline = $count }
Write-Output "WATCHER_READY :: me=$Me :: baseline=$Baseline :: current=$count :: $Channel"

# Catch-up: backlog that arrived while Claude was busy (already past baseline).
if ($count -gt $Baseline) {
  $lines = @(Get-Content -LiteralPath $Channel)
  $flag = ScanForMe $lines ($Baseline + 1) $count $Me
  if ($flag) { Write-Output $flag; exit 0 }
  $Baseline = $count   # backlog had nothing for me; do not rescan it
}

while ($true) {
  Start-Sleep -Seconds $IntervalSec
  $lines = @(Get-Content -LiteralPath $Channel)
  if ($lines.Count -le $Baseline) { continue }
  $flag = ScanForMe $lines ($Baseline + 1) $lines.Count $Me
  if ($flag) { Write-Output $flag; exit 0 }
  $Baseline = $lines.Count
}
