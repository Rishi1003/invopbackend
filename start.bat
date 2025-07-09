@echo off
REM === Set paths to your backend and frontend ===
set BACKEND_PATH=C:\User\administrator.AMSLINDIA\invopbackend-master\backend
set FRONTEND_PATH=C:\User\administrator.AMSLINDIA\invopbackend-master\frontend

REM === Set the ports used by backend and frontend ===
set BACKEND_PORT=8000
set FRONTEND_PORT=5173

REM === Kill the ports ===
echo Killing ports...
npx kill-port %BACKEND_PORT% >nul 2>&1
npx kill-port %FRONTEND_PORT% >nul 2>&1

REM === Start backend ===
start "Backend" cmd /k "cd /d %BACKEND_PATH% && npm run dev"

REM === Start frontend ===
start "Frontend" cmd /k "cd /d %FRONTEND_PATH% && npm run dev"

echo Both frontend and backend are running.
echo Go to http://localhost:5173 to access the application.
echo Close these windows or stop the processes when done.
pause
