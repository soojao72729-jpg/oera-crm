@echo off
setlocal
echo ==========================================
echo    OERA SALES CRM - QUICK INSTALLER
echo ==========================================
echo.
echo [1/3] Creating Application Folder...
set "INSTALL_DIR=C:\OERA-Sales-CRM"
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

echo [2/3] Copying Software Files...
xcopy /E /I /Y * "%INSTALL_DIR%" >nul

echo [3/3] Creating Desktop App Shortcut...
set "SCRIPT_PATH=%TEMP%\CreateShortcut.vbs"
set "ICON_PATH=%INSTALL_DIR%\logo.png"

echo Set oWS = WScript.CreateObject("WScript.Shell") > "%SCRIPT_PATH%"
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\OERA Sales CRM.lnk" >> "%SCRIPT_PATH%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%SCRIPT_PATH%"
:: Point shortcut to a small batch file we will create to launch Electron
echo oLink.TargetPath = "cmd.exe" >> "%SCRIPT_PATH%"
echo oLink.Arguments = "/c start /min """" ""%INSTALL_DIR%\run_app.bat"" " >> "%SCRIPT_PATH%"
echo oLink.Description = "OERA Premium Sales CRM (Desktop App)" >> "%SCRIPT_PATH%"
echo oLink.WorkingDirectory = "%INSTALL_DIR%" >> "%SCRIPT_PATH%"
if exist "%ICON_PATH%" (
    echo oLink.IconLocation = "%ICON_PATH%" >> "%SCRIPT_PATH%"
)
echo oLink.Save >> "%SCRIPT_PATH%"

cscript /nologo "%SCRIPT_PATH%"
del "%SCRIPT_PATH%"

:: Create the launch helper batch file
echo @echo off > "%INSTALL_DIR%\run_app.bat"
echo cd /d "%%~dp0" >> "%INSTALL_DIR%\run_app.bat"
echo start "" "node_modules\electron\dist\electron.exe" . >> "%INSTALL_DIR%\run_app.bat"

echo.
echo ==========================================
echo    INSTALLED SUCCESSFULLY! 
echo    Check your Desktop for 'OERA Sales CRM'.
echo ==========================================
echo.
pause
