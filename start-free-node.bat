@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Install Node.js 22 LTS first.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installing FREE dependencies...
  call npm install
  if errorlevel 1 pause & exit /b 1
)
echo.
echo Starting FREE-006 node at http://localhost:3000
echo Keep this window open while you want this node online.
echo.
call npm start
pause
