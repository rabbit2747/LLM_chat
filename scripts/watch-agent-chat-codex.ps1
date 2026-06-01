# watch-agent-chat-codex.ps1
# Lightweight channel watcher for Codex.
# It does not invoke Codex directly. It writes a flag when a new message is for codex or user.
param(
    [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
    [string]$Me = "codex",
    [int]$IntervalSec = 5
)

$channelPath = Join-Path $Root "agent_chat/messages.jsonl"
$flagPath = Join-Path $Root "agent_chat/CODEX_CHAT.flag"
$logPath = Join-Path $Root "agent_chat/codex_chat_watch.log"

$ErrorActionPreference = "SilentlyContinue"

function Get-LineCount {
    param([string]$Path)
    if (Test-Path -LiteralPath $Path) {
        return @(Get-Content -LiteralPath $Path).Count
    }
    return 0
}

function Write-Flag {
    param([object]$Message)

    $timestamp = (Get-Date).ToUniversalTime().ToString("o")
    $lines = @(
        "changed=true",
        "source=agent_chat/messages.jsonl",
        "for=$Me",
        "from=$($Message.from)",
        "to=$($Message.to)",
        "type=$($Message.type)",
        "task_id=$($Message.task_id)",
        "id=$($Message.id)",
        "time=$timestamp"
    )

    Set-Content -LiteralPath $flagPath -Value $lines -Encoding UTF8
    Add-Content -LiteralPath $logPath -Value "[$timestamp] MSG_FOR_$($Me.ToUpper()) from=$($Message.from) type=$($Message.type) task=$($Message.task_id) id=$($Message.id)" -Encoding UTF8
    Write-Output "FLAG :: MSG_FOR_$($Me.ToUpper()) :: from=$($Message.from) type=$($Message.type) task=$($Message.task_id) id=$($Message.id)"
}

$baseline = Get-LineCount $channelPath
Write-Output "WATCHER_READY :: me=$Me :: baseline_lines=$baseline :: $channelPath"

while ($true) {
    Start-Sleep -Seconds $IntervalSec
    $lines = @(Get-Content -LiteralPath $channelPath)
    if ($lines.Count -le $baseline) {
        continue
    }

    $newLines = $lines[$baseline..($lines.Count - 1)]
    $baseline = $lines.Count

    foreach ($line in $newLines) {
        if ([string]::IsNullOrWhiteSpace($line)) {
            continue
        }

        try {
            $message = $line | ConvertFrom-Json
        } catch {
            continue
        }

        $forMe = ($message.to -eq $Me -or $message.to -eq "all" -or $message.from -eq "user")
        if ($message.from -ne $Me -and $forMe) {
            Write-Flag $message
        }
    }
}
