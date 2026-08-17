@echo off
chcp 65001 >nul
cd /d "%~dp0"
setlocal
set "APP=%~dp0lili-desktop-pet.exe"
set "VCREDIST=%~dp0vc_redist.x64.exe"
set "LOG=%USERPROFILE%\Desktop\lili-desktop-pet-start.log"

echo [%date% %time%] Starting Lili Desktop Pet > "%LOG%"
echo Current directory: %~dp0 >> "%LOG%"

if not exist "%APP%" (
  echo [ERROR] Cannot find app: %APP% >> "%LOG%"
  echo Cannot find lili-desktop-pet.exe. Please extract the whole zip folder first.
  echo Log file: %LOG%
  pause
  exit /b 1
)

if exist "%VCREDIST%" (
  echo Checking / installing Microsoft VC++ runtime...
  echo Installing VC++ runtime: %VCREDIST% >> "%LOG%"
  "%VCREDIST%" /install /quiet /norestart >> "%LOG%" 2>&1
  echo VC++ installer exit code: %errorlevel% >> "%LOG%"
) else (
  echo vc_redist.x64.exe not found, skipping runtime installer. >> "%LOG%"
)

echo Starting Lili Desktop Pet...
echo Launching: %APP% >> "%LOG%"
start "" "%APP%" --disable-gpu --disable-software-rasterizer

echo If the pet does not appear after 5 seconds, check these files on Desktop:
echo - lili-desktop-pet-start.log
echo - lili-desktop-pet-error.log
timeout /t 5 >nul
exit /b 0
