@echo off
chcp 65001 >nul
cd /d "%~dp0"
setlocal
set "APP=%~dp0栗栗桌面宠物.exe"
set "VCREDIST=%~dp0vc_redist.x64.exe"
set "LOG=%USERPROFILE%\Desktop\lili-desktop-pet-start.log"

echo [%date% %time%] 启动栗栗桌面宠物 > "%LOG%"
echo 当前目录：%~dp0 >> "%LOG%"

if not exist "%APP%" (
  echo [错误] 找不到程序：%APP% >> "%LOG%"
  echo 找不到 栗栗桌面宠物.exe。请确认已经完整解压整个文件夹。
  echo 日志位置：%LOG%
  pause
  exit /b 1
)

if exist "%VCREDIST%" (
  echo 正在检查/安装 VC++ 运行库...
  echo 安装 VC++ 运行库：%VCREDIST% >> "%LOG%"
  "%VCREDIST%" /install /quiet /norestart >> "%LOG%" 2>&1
  echo VC++ 安装返回值：%errorlevel% >> "%LOG%"
) else (
  echo 未找到 vc_redist.x64.exe，跳过运行库安装。 >> "%LOG%"
)

echo 正在启动 栗栗桌面宠物...
echo 启动程序：%APP% >> "%LOG%"
start "" "%APP%" --disable-gpu --disable-software-rasterizer

echo 如果 5 秒后没有看到宠物，请打开桌面上的 lili-desktop-pet-start.log 和 lili-desktop-pet-error.log 查看原因。
timeout /t 5 >nul
exit /b 0
