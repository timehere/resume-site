; ============================================================
; 栗栗桌面宠物 - Windows 安装包（内嵌 VC++ 运行库，零依赖）
; 编译：在已安装 NSIS 的 Windows 上双击 build_installer.bat
; 说明：安装时会先静默安装官方 VC++ 2015-2022 运行库，
;       因此目标机器无需任何前置组件即可运行。
; ============================================================

!define APPNAME    "栗栗桌面宠物"
!define EXE_NAME   "栗栗桌面宠物.exe"
!define PUBLISHER  "栗栗工作室"
!define APPVERSION "1.0.0"

!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "x64.nsh"

Name    "${APPNAME}"
OutFile "栗栗桌面宠物-setup.exe"
InstallDir "$PROGRAMFILES64\${APPNAME}"
InstallDirRegKey HKLM "Software\${APPNAME}" "Install_Dir"
RequestExecutionLevel admin

; ---------- 界面 ----------
!define MUI_ABORTWARNING
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

!insertmacro MUI_LANGUAGE "SimpChinese"

; ---------- 安装前检查系统架构 ----------
Function .onInit
  ${IfNot} ${RunningX64}
    MessageBox MB_OK|MB_ICONSTOP "本程序仅支持 64 位 Windows（Win10 21H2 及以上）。"
    Abort
  ${EndIf}
FunctionEnd

; ---------- 安装段 ----------
Section "主程序" SecMain
  SetOutPath "$INSTDIR"
  ; 复制 app 目录下全部文件（含子目录，含无扩展名文件如 LICENSE）
  File /r "app"

  ; 快捷方式
  CreateDirectory "$SMPROGRAMS\${APPNAME}"
  CreateShortcut "$SMPROGRAMS\${APPNAME}\${APPNAME}.lnk" "$INSTDIR\${EXE_NAME}"
  CreateShortcut "$DESKTOP\${APPNAME}.lnk" "$INSTDIR\${EXE_NAME}"

  ; 卸载信息
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "DisplayName" "${APPNAME}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "UninstallString" "$\"$INSTDIR\Uninstall.exe$\""
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "Publisher" "${PUBLISHER}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "DisplayVersion" "${APPVERSION}"
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}" "NoRepair" 1

  WriteRegStr HKLM "Software\${APPNAME}" "Install_Dir" "$INSTDIR"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
SectionEnd

; ---------- 内嵌 VC++ 运行库（零依赖关键）----------
Section "VC++ 运行库" SecVCRedist
  SetOutPath "$PLUGINSDIR"
  File "vc_redist.x64.exe"
  ; 静默安装；已安装则秒过，无界面
  ExecWait '"$PLUGINSDIR\vc_redist.x64.exe" /install /quiet /norestart'
SectionEnd

; ---------- 卸载段 ----------
Section "Uninstall"
  Delete "$SMPROGRAMS\${APPNAME}\${APPNAME}.lnk"
  Delete "$DESKTOP\${APPNAME}.lnk"
  RMDir  "$SMPROGRAMS\${APPNAME}"
  RMDir /r "$INSTDIR"
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APPNAME}"
  DeleteRegKey HKLM "Software\${APPNAME}"
SectionEnd
