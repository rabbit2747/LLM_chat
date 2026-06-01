param(
    [Parameter(Position = 0)]
    [ValidateSet("help", "send", "unread", "read", "list", "state", "resume", "set-task", "tasks")]
    [string]$Command = "help",

    [string]$From = "",
    [string]$To = "all",
    [string]$Type = "status",
    [string]$Text = "",
    [string]$For = "",
    [string]$TaskId = "",
    [string]$TaskTitle = "",
    [string]$TaskState = "",
    [int]$Limit = 20,
    [switch]$All,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$ChatDir = Join-Path $Root "agent_chat"
$MessagesPath = Join-Path $ChatDir "messages.jsonl"
$TasksPath = Join-Path $ChatDir "tasks.json"
$StatePath = Join-Path $ChatDir "state.json"

function Ensure-ChatStore {
    if (-not (Test-Path -LiteralPath $ChatDir)) {
        New-Item -ItemType Directory -Path $ChatDir | Out-Null
    }
    if (-not (Test-Path -LiteralPath $MessagesPath)) {
        New-Item -ItemType File -Path $MessagesPath | Out-Null
    }
    if (-not (Test-Path -LiteralPath $TasksPath)) {
        Set-Content -LiteralPath $TasksPath -Value "[]" -Encoding UTF8
    }
    if (-not (Test-Path -LiteralPath $StatePath)) {
        $initial = [ordered]@{
            pause_agent_pingpong = $false
            active_priority = "none"
            active_task_id = ""
            updated_at = ""
        }
        Save-Json $StatePath $initial
    }
}

function Save-Json {
    param(
        [string]$Path,
        [object]$Value
    )
    $json = ConvertTo-Json -InputObject $Value -Depth 10
    Set-Content -LiteralPath $Path -Value $json -Encoding UTF8
}

function Read-JsonFile {
    param(
        [string]$Path,
        [object]$DefaultValue
    )
    if (-not (Test-Path -LiteralPath $Path)) {
        return $DefaultValue
    }
    $raw = Get-Content -LiteralPath $Path -Raw
    if ([string]::IsNullOrWhiteSpace($raw)) {
        return $DefaultValue
    }
    return $raw | ConvertFrom-Json
}

function Read-TaskList {
    if (-not (Test-Path -LiteralPath $TasksPath)) {
        return @()
    }

    $raw = Get-Content -LiteralPath $TasksPath -Raw
    if ([string]::IsNullOrWhiteSpace($raw)) {
        return @()
    }

    $parsed = $raw | ConvertFrom-Json
    if ($null -eq $parsed) {
        return @()
    }

    if ($parsed -is [System.Array]) {
        return @($parsed)
    }

    return @($parsed)
}

function Read-Messages {
    Ensure-ChatStore
    $messages = @()
    $lines = Get-Content -LiteralPath $MessagesPath -ErrorAction SilentlyContinue
    foreach ($line in $lines) {
        if (-not [string]::IsNullOrWhiteSpace($line)) {
            $messages += ($line | ConvertFrom-Json)
        }
    }
    return @($messages)
}

function Append-Message {
    param([object]$Message)

    $line = $Message | ConvertTo-Json -Depth 10 -Compress
    Add-Content -LiteralPath $MessagesPath -Value $line -Encoding UTF8
}

function Get-AgentStatePath {
    param([string]$Agent)
    return (Join-Path $ChatDir "state_$($Agent.ToLowerInvariant()).json")
}

function Get-AgentReadState {
    param([string]$Agent)

    $statePath = Get-AgentStatePath $Agent
    return Read-JsonFile $statePath ([ordered]@{
        last_read_id = ""
        last_read_at = ""
        updated_at = ""
    })
}

function Save-AgentReadState {
    param(
        [string]$Agent,
        [object]$Message
    )

    $now = (Get-Date).ToUniversalTime().ToString("o")
    $agentState = [ordered]@{
        last_read_id = $Message.id
        last_read_at = $Message.created_at
        updated_at = $now
    }
    Save-Json (Get-AgentStatePath $Agent) $agentState
}

function Is-AfterCursor {
    param(
        [object]$Message,
        [object]$ReadState
    )

    if ([string]::IsNullOrWhiteSpace($ReadState.last_read_at)) {
        return $true
    }

    try {
        return ([datetime]$Message.created_at) -gt ([datetime]$ReadState.last_read_at)
    } catch {
        return $true
    }
}

function Update-SharedStateForMessage {
    param([object]$Message)

    $state = Read-JsonFile $StatePath ([ordered]@{})
    $state.updated_at = $Message.created_at

    if ($Message.from -eq "user") {
        $state.pause_agent_pingpong = $true
        $state.active_priority = "user"
        $state.active_task_id = $Message.task_id
    } elseif ($Message.type -eq "decision_needed") {
        $state.pause_agent_pingpong = $true
        $state.active_priority = "decision_needed"
        $state.active_task_id = $Message.task_id
    }

    Save-Json $StatePath $state
}

function Show-Message {
    param([object]$Message)

    $target = $Message.to
    if ([string]::IsNullOrWhiteSpace($target)) {
        $target = "all"
    }

    $task = $Message.task_id
    if ([string]::IsNullOrWhiteSpace($task)) {
        $task = "-"
    }

    Write-Output "[$($Message.created_at)] $($Message.from) -> $target :: $($Message.type) :: task=$task"
    Write-Output $Message.text
    Write-Output ""
}

function Command-Help {
    Write-Output "Agent Chat CLI"
    Write-Output ""
    Write-Output "Commands:"
    Write-Output "  send     -From <user|claude|codex> -To <all|claude|codex|user> -Type <type> -Text <text> [-TaskId <id>]"
    Write-Output "  unread   -For <claude|codex|user>"
    Write-Output "  read     -For <claude|codex|user>"
    Write-Output "  list     [-Limit 20] [-All]"
    Write-Output "  state"
    Write-Output "  resume   -From <user|claude|codex>"
    Write-Output "  set-task -TaskId <id> -TaskTitle <title> -TaskState <state>"
    Write-Output "  tasks"
}

function Command-Send {
    if ([string]::IsNullOrWhiteSpace($From)) {
        throw "send requires -From"
    }
    if ([string]::IsNullOrWhiteSpace($Text)) {
        throw "send requires -Text"
    }
    $state = Read-JsonFile $StatePath ([ordered]@{})
    if ($From.ToLowerInvariant() -ne "user" -and $state.pause_agent_pingpong -eq $true -and -not $Force) {
        throw "Agent ping-pong is paused by $($state.active_priority). Use resume first, or pass -Force for an explicit override."
    }

    if ([string]::IsNullOrWhiteSpace($TaskId)) {
        if (-not [string]::IsNullOrWhiteSpace($state.active_task_id)) {
            $TaskId = $state.active_task_id
        } else {
            $TaskId = "task-" + (Get-Date).ToUniversalTime().ToString("yyyyMMddHHmmss")
        }
    }

    $now = (Get-Date).ToUniversalTime().ToString("o")
    $message = [ordered]@{
        id = [guid]::NewGuid().ToString()
        from = $From.ToLowerInvariant()
        to = $To.ToLowerInvariant()
        type = $Type.ToLowerInvariant()
        text = $Text
        task_id = $TaskId
        created_at = $now
        read_by = @($From.ToLowerInvariant())
    }

    Append-Message $message
    Update-SharedStateForMessage $message
    Show-Message $message
}

function Command-Unread {
    if ([string]::IsNullOrWhiteSpace($For)) {
        throw "unread requires -For"
    }

    $agent = $For.ToLowerInvariant()
    $messages = Read-Messages
    $readState = Get-AgentReadState $agent
    $unread = @()
    foreach ($message in $messages) {
        $isRecipient = ($message.to -eq "all" -or $message.to -eq $agent -or $message.from -eq "user")
        if ($message.from -ne $agent -and $isRecipient -and (Is-AfterCursor $message $readState)) {
            $unread += $message
        }
    }

    if ($unread.Count -eq 0) {
        Write-Output "No unread messages for $agent."
        return
    }

    foreach ($message in $unread) {
        Show-Message $message
    }
}

function Command-Read {
    if ([string]::IsNullOrWhiteSpace($For)) {
        throw "read requires -For"
    }

    $agent = $For.ToLowerInvariant()
    $messages = Read-Messages
    $changed = 0
    $lastSeen = $null
    $readState = Get-AgentReadState $agent

    foreach ($message in $messages) {
        $isRecipient = ($message.to -eq "all" -or $message.to -eq $agent -or $message.from -eq "user")
        if ($message.from -ne $agent -and $isRecipient -and (Is-AfterCursor $message $readState)) {
            $lastSeen = $message
            $changed += 1
        }
    }

    if ($null -ne $lastSeen) {
        Save-AgentReadState $agent $lastSeen
    }
    Write-Output "Marked $changed message(s) as read for $agent."
}

function Command-List {
    $messages = Read-Messages
    if (-not $All -and $messages.Count -gt $Limit) {
        $messages = $messages | Select-Object -Last $Limit
    }
    foreach ($message in $messages) {
        Show-Message $message
    }
}

function Command-State {
    Ensure-ChatStore
    Get-Content -LiteralPath $StatePath -Raw
}

function Command-Resume {
    if ([string]::IsNullOrWhiteSpace($From)) {
        throw "resume requires -From"
    }
    if ($From.ToLowerInvariant() -ne "user") {
        throw "Only user can resume agent ping-pong."
    }

    $state = Read-JsonFile $StatePath ([ordered]@{})
    $state.pause_agent_pingpong = $false
    $state.active_priority = "none"
    $state.updated_at = (Get-Date).ToUniversalTime().ToString("o")
    Save-Json $StatePath $state
    Write-Output "Agent ping-pong resumed by $From."
}

function Command-SetTask {
    if ([string]::IsNullOrWhiteSpace($TaskId)) {
        throw "set-task requires -TaskId"
    }
    if ([string]::IsNullOrWhiteSpace($TaskState)) {
        throw "set-task requires -TaskState"
    }

    $tasks = @(Read-TaskList)
    $existing = $null
    foreach ($task in $tasks) {
        if ($task.id -eq $TaskId) {
            $existing = $task
            break
        }
    }

    $now = (Get-Date).ToUniversalTime().ToString("o")
    if ($null -eq $existing) {
        if ([string]::IsNullOrWhiteSpace($TaskTitle)) {
            $TaskTitle = $TaskId
        }
        $tasks += [ordered]@{
            id = $TaskId
            title = $TaskTitle
            state = $TaskState
            updated_at = $now
        }
    } else {
        if (-not [string]::IsNullOrWhiteSpace($TaskTitle)) {
            $existing.title = $TaskTitle
        }
        $existing.state = $TaskState
        $existing.updated_at = $now
    }

    Save-Json $TasksPath $tasks
    Write-Output "Task $TaskId set to $TaskState."
}

function Command-Tasks {
    Ensure-ChatStore
    $tasks = @(Read-TaskList)
    ConvertTo-Json -InputObject $tasks -Depth 10
}

Ensure-ChatStore

switch ($Command) {
    "help" { Command-Help }
    "send" { Command-Send }
    "unread" { Command-Unread }
    "read" { Command-Read }
    "list" { Command-List }
    "state" { Command-State }
    "resume" { Command-Resume }
    "set-task" { Command-SetTask }
    "tasks" { Command-Tasks }
}
