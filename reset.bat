@echo off

REM === Set the ports used by backend and frontend ===
set BACKEND_PORT=8000
set FRONTEND_PORT=5173

REM === Kill the ports ===
echo Killing ports...
npx kill-port %BACKEND_PORT% >nul 2>&1
npx kill-port %FRONTEND_PORT% >nul 2>&1