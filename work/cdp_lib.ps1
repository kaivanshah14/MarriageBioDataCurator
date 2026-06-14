function Receive-CdpMessage {
  param([System.Net.WebSockets.ClientWebSocket]$Socket)

  $buffer = [byte[]]::new(1048576)
  $stream = [System.IO.MemoryStream]::new()
  do {
    $segment = [ArraySegment[byte]]::new($buffer)
    $result = $Socket.ReceiveAsync($segment, [Threading.CancellationToken]::None).GetAwaiter().GetResult()
    if ($result.Count -gt 0) {
      $stream.Write($buffer, 0, $result.Count)
    }
  } while (-not $result.EndOfMessage)

  [Text.Encoding]::UTF8.GetString($stream.ToArray()) | ConvertFrom-Json
}

function Send-CdpCommand {
  param(
    [System.Net.WebSockets.ClientWebSocket]$Socket,
    [int]$Id,
    [string]$Method,
    [hashtable]$Params = @{}
  )

  $payload = @{
    id = $Id
    method = $Method
    params = $Params
  } | ConvertTo-Json -Compress -Depth 20

  $bytes = [Text.Encoding]::UTF8.GetBytes($payload)
  $segment = [ArraySegment[byte]]::new($bytes)
  [void]$Socket.SendAsync($segment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, [Threading.CancellationToken]::None).GetAwaiter().GetResult()
}

function Invoke-CdpCommand {
  param(
    [System.Net.WebSockets.ClientWebSocket]$Socket,
    [int]$Id,
    [string]$Method,
    [hashtable]$Params = @{}
  )

  Send-CdpCommand -Socket $Socket -Id $Id -Method $Method -Params $Params
  do {
    $message = Receive-CdpMessage -Socket $Socket
  } while ($message.id -ne $Id)

  if ($message.error) {
    throw ($message.error | ConvertTo-Json -Compress -Depth 10)
  }

  $message.result
}
