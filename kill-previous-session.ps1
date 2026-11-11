param(
  [int[]]$Ports = @(3001)
)

foreach ($port in $Ports) {
  $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  foreach ($connection in $connections) {
    $process = Get-Process -Id $connection.OwningProcess -ErrorAction SilentlyContinue
    if ($process) {
      Write-Host "Stopping PID $($process.Id) on port $port..."
      Stop-Process -Id $process.Id -Force
    }
  }
}
