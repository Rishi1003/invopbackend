@echo off
REM === Set paths to backend and frontend ===
set "BACKEND_PATH=C:\Users\administrator.AMSLINDIA\invopbackend-master\backend"
set "FRONTEND_PATH=C:\Users\administrator.AMSLINDIA\invopbackend-master\frontend"

REM === Start backend ===
start "Backend" cmd /k ""cd /d %BACKEND_PATH% && npm run dev""

REM === Start frontend ===
start "Frontend" cmd /k ""cd /d %FRONTEND_PATH% && npm run dev""

echo.
echo ✅ Both servers launching in new terminals.
echo ❌ Close the windows to stop them.
pause
