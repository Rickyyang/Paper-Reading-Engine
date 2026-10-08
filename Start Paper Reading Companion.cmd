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
  echo Dependencies are missing. Run pnpm install --frozen-lockfile in this folder first.
  pause
  exit /b 1
)

rem Git pulls do not install newly declared dependencies on this computer.
"%PAPER_NODE%" -e "const fs=require('node:fs'); const p=require('./package.json'); const missing=Object.keys({...p.dependencies,...p.devDependencies}).filter(name=>!fs.existsSync('node_modules/'+name+'/package.json')); if(missing.length){console.error('Missing dependencies: '+missing.join(', '));process.exitCode=1}"
if errorlevel 1 (
  echo.
  echo After pulling updates, run pnpm install --frozen-lockfile in this folder.
  echo Then run this launcher again.
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
