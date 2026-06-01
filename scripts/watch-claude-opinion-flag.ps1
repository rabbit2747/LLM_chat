param(
    [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
    [int]$DebounceMilliseconds = 750
)

$watchPath = Join-Path $Root "opinion_claude"
$outPath = Join-Path $Root "opinion_codex"
$flagPath = Join-Path $outPath "CLAUDE_OPINION.flag"
$logPath = Join-Path $outPath "claude_opinion_events.log"

if (-not (Test-Path -LiteralPath $watchPath)) {
    throw "Watch path does not exist: $watchPath"
}

if (-not (Test-Path -LiteralPath $outPath)) {
    New-Item -ItemType Directory -Path $outPath | Out-Null
}

$script:lastEvent = $null
$script:lastWrite = [datetime]::MinValue

function Write-OpinionFlag {
    param(
        [string]$EventName,
        [string]$FullPath,
        [string]$OldFullPath
    )

    $now = Get-Date
    if (($now - $script:lastWrite).TotalMilliseconds -lt $DebounceMilliseconds) {
        return
    }

    $script:lastWrite = $now
    $relativePath = Resolve-Path -LiteralPath $FullPath -ErrorAction SilentlyContinue
    if ($relativePath) {
        $relativePath = $relativePath.Path
    } else {
        $relativePath = $FullPath
    }

    $timestamp = $now.ToUniversalTime().ToString("o")
    $lines = @(
        "changed=true",
        "source=opinion_claude",
        "path=$relativePath",
        "old_path=$OldFullPath",
        "event=$EventName",
        "time=$timestamp"
    )

    Set-Content -LiteralPath $flagPath -Value $lines -Encoding UTF8
    Add-Content -LiteralPath $logPath -Value "[$timestamp] $EventName $relativePath" -Encoding UTF8
    Write-Host "Flag raised: $EventName $relativePath"
}

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $watchPath
$watcher.Filter = "*.md"
$watcher.IncludeSubdirectories = $true
$watcher.NotifyFilter = [System.IO.NotifyFilters]'FileName, LastWrite, CreationTime'
$watcher.EnableRaisingEvents = $true

$handlers = @()
$handlers += Register-ObjectEvent -InputObject $watcher -EventName Created -Action {
    Write-OpinionFlag -EventName "Created" -FullPath $Event.SourceEventArgs.FullPath -OldFullPath ""
}
$handlers += Register-ObjectEvent -InputObject $watcher -EventName Changed -Action {
    Write-OpinionFlag -EventName "Changed" -FullPath $Event.SourceEventArgs.FullPath -OldFullPath ""
}
$handlers += Register-ObjectEvent -InputObject $watcher -EventName Renamed -Action {
    Write-OpinionFlag -EventName "Renamed" -FullPath $Event.SourceEventArgs.FullPath -OldFullPath $Event.SourceEventArgs.OldFullPath
}
$handlers += Register-ObjectEvent -InputObject $watcher -EventName Deleted -Action {
    Write-OpinionFlag -EventName "Deleted" -FullPath $Event.SourceEventArgs.FullPath -OldFullPath ""
}

Write-Host "Watching $watchPath"
Write-Host "Flag file: $flagPath"
Write-Host "Press Ctrl+C to stop."

try {
    while ($true) {
        Wait-Event -Timeout 1 | Out-Null
    }
}
finally {
    foreach ($handler in $handlers) {
        Unregister-Event -SubscriptionId $handler.Id -ErrorAction SilentlyContinue
    }
    $watcher.Dispose()
}
