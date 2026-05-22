# Start script for the standalone homepage

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Starting Homepage Standalone System" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Start Backend on Port 5001
    Write-Host "`n[1/2] Starting Backend Server (Port 5001)..." -ForegroundColor Yellow
    $backendProcess = Start-Process powershell -PassThru -ArgumentList "-NoExit", "-Command", "cd $PSScriptRoot\backend; python run.py"
    Write-Host "-> Backend process started (PID: $($backendProcess.Id))" -ForegroundColor Green

    # Start Frontend
    Write-Host "`n[2/2] Starting Frontend Server (Port 3000/5173)..." -ForegroundColor Yellow
    $frontendProcess = Start-Process powershell -PassThru -ArgumentList "-NoExit", "-Command", "cd $PSScriptRoot; npm run dev"
    Write-Host "-> Frontend process started (PID: $($frontendProcess.Id))" -ForegroundColor Green

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host " System is running!" -ForegroundColor Green
Write-Host " Backend:  http://localhost:5001/api" -ForegroundColor Green
Write-Host " Frontend: Local network IP and localhost" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host "`nClose the opened terminal windows to stop the servers." -ForegroundColor Gray
