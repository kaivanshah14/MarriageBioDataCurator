param(
  [string]$Expression,
  [string]$ExpressionPath,

  [string]$TargetUrlPrefix = "https://web.whatsapp.com/",
  [string]$Endpoint = "http://127.0.0.1:9222/json/list"
)

$ErrorActionPreference = "Stop"

. "$PSScriptRoot\cdp_lib.ps1"

if ($ExpressionPath) {
  $Expression = Get-Content -Raw -LiteralPath $ExpressionPath
}

if (-not $Expression) {
  throw "Provide -Expression or -ExpressionPath."
}

$targets = Invoke-RestMethod $Endpoint
$target = $targets | Where-Object { $_.type -eq "page" -and $_.url.StartsWith($TargetUrlPrefix) } | Select-Object -First 1
if (-not $target) {
  throw "No page target found for $TargetUrlPrefix"
}

$socket = [System.Net.WebSockets.ClientWebSocket]::new()
$socket.ConnectAsync([Uri]$target.webSocketDebuggerUrl, [Threading.CancellationToken]::None).GetAwaiter().GetResult()

try {
  [void](Invoke-CdpCommand -Socket $socket -Id 1 -Method "Runtime.enable")
  $result = Invoke-CdpCommand -Socket $socket -Id 2 -Method "Runtime.evaluate" -Params @{
    expression = $Expression
    returnByValue = $true
    awaitPromise = $true
  }
  $result.result.value | ConvertTo-Json -Depth 20
}
finally {
  if ($socket.State -eq [System.Net.WebSockets.WebSocketState]::Open) {
    $socket.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "done", [Threading.CancellationToken]::None).GetAwaiter().GetResult()
  }
  $socket.Dispose()
}
