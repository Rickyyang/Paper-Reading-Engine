@echo off
setlocal
cd /d "%~dp0"

rem Prefer a normal Node.js installation; fall back to this computer's Codex runtime.
set "PAPER_NODE=node"
where node >nul 2>nul
if errorlevel 1 (
  set "PAPER_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
  if not exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" (
    echo Node.js was not found. Install Node.js, then try again.
    pause
    exit /b 1
  )
)

if not exist "node_modules\vite\bin\vite.js" (
  echo Dependencies are missing. Run npm install in this folder first.
  pause
  exit /b 1
)

echo Starting Paper Reading Companion at http://127.0.0.1:5173/
echo Keep this window open while using the app. Close it to stop the server.
echo If the port is already in use, open http://127.0.0.1:5173/ in your browser.
echo.
"%PAPER_NODE%" "node_modules\vite\bin\vite.js" --host 127.0.0.1 --port 5173 --strictPort --open
if errorlevel 1 (
  echo.
  echo Startup failed. See the message above for details.
  pause
)
endlocal
