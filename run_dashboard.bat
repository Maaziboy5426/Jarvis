@echo off
setlocal

REM Change to project root (this batch file's directory)
cd /d "%~dp0"

REM Go into the web dashboard app
cd web-dashboard

REM Install dependencies on first run
if not exist node_modules (
  echo Installing Smart Macro JARVIS dependencies...
  npm install
)

echo Starting Smart Macro JARVIS dashboard...
echo.
npm run dev

echo.
echo Press any key to close this window...
pause >nul

endlocal
