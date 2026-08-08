@echo off
title Lodestar
cd /d "%~dp0"

echo Starting Lodestar backend...
start "Lodestar backend" /d "%~dp0backend" cmd /k node server.js

echo Starting Lodestar frontend...
start "Lodestar frontend" /d "%~dp0frontend" cmd /k node serve.js

timeout /t 2 /nobreak >nul
start "" http://localhost:3000
echo Lodestar is running at http://localhost:3000
