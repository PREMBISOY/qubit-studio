@echo off
setlocal
set "APP_DIR=C:\Users\Prem Bisoy\Documents\VIT\SEM1\BAPHY\ppt"

REM Start the local web server only if it is not already running.
netstat -ano | findstr /C:":4173" | findstr /C:"LISTENING" >nul
if errorlevel 1 (
    start "Qubit Studio Server" /D "%APP_DIR%" cmd /k node server.js
)
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:4173"
endlocal
