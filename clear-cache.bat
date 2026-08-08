@echo off
title Lodestar - Clear cache
cd /d "%~dp0"

echo Stopping Lodestar servers...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3000 :3001" ^| findstr "LISTENING"') do (
  taskkill /pid %%p /f >nul 2>&1
)

echo Clearing cache...
if exist "%~dp0backend\.cache" rmdir /s /q "%~dp0backend\.cache"

echo Restarting Lodestar...
start "Lodestar backend" /d "%~dp0backend" cmd /k node server.js
start "Lodestar frontend" /d "%~dp0frontend" cmd /k node serve.js

timeout /t 2 /nobreak >nul
start "" http://localhost:3000
echo Done.
