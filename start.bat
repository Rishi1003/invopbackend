@echo off
REM === Set paths to your backend and frontend ===
set BACKEND_PATH=C:\User\administrator.AMSLINDIA\invopbackend-master\backend
set FRONTEND_PATH=C:\User\administrator.AMSLINDIA\invopbackend-master\frontend


REM === Start backend ===
start "Backend" cmd /k "cd /d %BACKEND_PATH% && npm run dev"

REM === Start frontend ===
start "Frontend" cmd /k "cd /d %FRONTEND_PATH% && npm run dev"

echo Both frontend and backend are running.
echo Go to http://localhost:5173 to access the application.
echo Close these windows or stop the processes when done.
pause
