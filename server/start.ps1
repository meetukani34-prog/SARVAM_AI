# Set current directory to where the script is located
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Set PYTHONPATH so the 'api' package is found
$env:PYTHONPATH = $scriptPath

Write-Host "[SARVAM] Starting Backend..." -ForegroundColor Cyan
Write-Host "Location: $scriptPath" -ForegroundColor Gray

# Start the server
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
