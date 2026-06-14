param(
  [Parameter(Mandatory = $true)]
  [string]$Method,

  [string]$ParamsJson = "{}",
  [string]$ParamsPath,
  [string]$TargetUrlPrefix = "https://web.whatsapp.com/",
  [string]$Endpoint = "http://127.0.0.1:9222/json/list"
)

$ErrorActionPreference = "Stop"

. "$PSScriptRoot\cdp_lib.ps1"

function Convert-ToHashtable {
  param($Value)

  if ($Value -is [System.Collections.IEnumerable] -and $Value -isnot [string] -and $Value -isnot [pscustomobject]) {
    return @($Value | ForEach-Object { Convert-ToHashtable $_ })
  }

  if ($Value -is [pscustomobject]) {
    $hash = @{}
    foreach ($property in $Value.PSObject.Properties) {
      $hash[$property.Name] = Convert-ToHashtable $property.Value
    }
    return $hash
  }

  $Value
}

$targets = Invoke-RestMethod $Endpoint
$target = $targets | Where-Object { $_.type -eq "page" -and $_.url.StartsWith($TargetUrlPrefix) } | Select-Object -First 1
if (-not $target) {
  throw "No page target found for $TargetUrlPrefix"
}

$socket = [System.Net.WebSockets.ClientWebSocket]::new()
$socket.ConnectAsync([Uri]$target.webSocketDebuggerUrl, [Threading.CancellationToken]::None).GetAwaiter().GetResult()

try {
  if ($ParamsPath) {
    $ParamsJson = Get-Content -Raw -LiteralPath $ParamsPath
  }
  $params = Convert-ToHashtable (ConvertFrom-Json $ParamsJson)
  [void](Invoke-CdpCommand -Socket $socket -Id 1 -Method $Method -Params $params)
}
finally {
  if ($socket.State -eq [System.Net.WebSockets.WebSocketState]::Open) {
    [void]$socket.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "done", [Threading.CancellationToken]::None).GetAwaiter().GetResult()
  }
  $socket.Dispose()
}
