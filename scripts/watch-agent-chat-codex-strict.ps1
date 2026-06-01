# Strict one-shot sensor for Codex chat monitoring.
# This script only reads state/messages and prints one raw JSON event, then exits.
param(
    [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
    [int]$IntervalSec = 3,
    [int]$TimeoutSec = 7200
)

$ErrorActionPreference = "SilentlyContinue"

$messagesPath = Join-Path $Root "agent_chat/messages.jsonl"
$statePath = Join-Path $Root "agent_chat/state_codex.json"
$deadline = (Get-Date).AddSeconds($TimeoutSec)

function Get-Cursor {
    if (-not (Test-Path -LiteralPath $statePath)) {
        return [pscustomobject]@{ last_read_id = $null; last_read_at = $null }
    }

    try {
        return Get-Content -Raw -LiteralPath $statePath | ConvertFrom-Json
    } catch {
        return [pscustomobject]@{ last_read_id = $null; last_read_at = $null }
    }
}

function Get-Messages {
    if (-not (Test-Path -LiteralPath $messagesPath)) {
        return @()
    }

    $items = @()
    foreach ($line in @(Get-Content -LiteralPath $messagesPath)) {
        if ([string]::IsNullOrWhiteSpace($line)) {
            continue
        }

        try {
            $items += ($line | ConvertFrom-Json)
        } catch {
            continue
        }
    }
    return $items
}

function Test-NewerThanCursor {
    param(
        [object]$Message,
        [object]$Cursor,
        [object[]]$AllMessages
    )

    if ($null -ne $Cursor.last_read_id -and $Cursor.last_read_id -ne "") {
        $cursorIndex = -1
        $messageIndex = -1

        for ($i = 0; $i -lt $AllMessages.Count; $i++) {
            if ($AllMessages[$i].id -eq $Cursor.last_read_id) {
                $cursorIndex = $i
            }
            if ($AllMessages[$i].id -eq $Message.id) {
                $messageIndex = $i
            }
        }

        return ($messageIndex -gt $cursorIndex)
    }

    if ($null -ne $Cursor.last_read_at -and $Cursor.last_read_at -ne "") {
        try {
            return ([datetime]$Message.created_at -gt [datetime]$Cursor.last_read_at)
        } catch {
            return $true
        }
    }

    return $true
}

while ((Get-Date) -lt $deadline) {
    $cursor = Get-Cursor
    $messages = @(Get-Messages)

    foreach ($message in $messages) {
        $isRelevant = (
            $message.to -eq "codex" -or
            $message.to -eq "all" -or
            $message.from -eq "user"
        )

        if (-not $isRelevant) {
            continue
        }

        if (-not (Test-NewerThanCursor -Message $message -Cursor $cursor -AllMessages $messages)) {
            continue
        }

        [pscustomobject]@{
            id = $message.id
            from = $message.from
            to = $message.to
            type = $message.type
            task_id = $message.task_id
            created_at = $message.created_at
            text = $message.text
        } | ConvertTo-Json -Compress
        exit 0
    }

    Start-Sleep -Seconds $IntervalSec
}

Write-Output "no message detected"
exit 0
