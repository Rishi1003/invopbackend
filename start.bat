@echo off
start "Backend" cmd /k run-backend.cmd
start "Frontend" cmd /k run-frontend.cmd
echo.
echo ✅ Servers running. Close terminals to stop them open http://localhost:5173/ to access the app.
pause
