@echo off
REM 栗栗桌面宠物 - 一键生成 Windows 安装包
REM 前提：已在 Windows 上安装 NSIS（https://nsis.sourceforge.io/Download）
REM 把本文件与「栗栗桌面宠物.nsi」「app\」放在同一文件夹，双击即可。

setlocal
set NSIS="C:\Program Files (x86)\NSIS\makensis.exe"
if not exist %NSIS% set NSIS="C:\Program Files\NSIS\makensis.exe"

if not exist %NSIS% (
  echo [错误] 未找到 makensis.exe，请先安装 NSIS：
  echo   https://nsis.sourceforge.io/Download
  echo   安装时勾选 "Add NSIS to PATH"（或保持默认安装路径）。
  pause
  exit /b 1
)

if not exist "vc_redist.x64.exe" (
  echo [错误] 缺少 vc_redist.x64.exe（内嵌运行库），请将其与本文件放在同一文件夹。
  pause
  exit /b 1
)

if not exist "app\" (
  echo [错误] 缺少 app\ 目录（应用程序文件），请确认打包产物已放入。
  pause
  exit /b 1
)

echo [1/2] 正在编译安装脚本（含内嵌 VC++ 运行库）...
%NSIS% "栗栗桌面宠物.nsi"
if errorlevel 1 (
  echo [失败] 编译出错，请检查 .nsi 脚本。
  pause
  exit /b 1
)

echo [2/2] 完成！生成文件：栗栗桌面宠物-setup.exe
pause
