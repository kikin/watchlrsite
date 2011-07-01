@echo off

rem This script creates all the builds for kikin video.

rem Vraibles
rem Do not put quotes around this
@set PLUGIN_BASE_DIR=%cd%\..\..
@echo Plugin base dir: %PLUGIN_BASE_DIR%

@set BUILD_TOOLS_DIR="%PLUGIN_BASE_DIR%\BuildUtils\"
@echo Build tools dir: %BUILD_TOOLS_DIR%

@rem Do not put quotes around this
@set VERSION_PROPERTIES_FILE=%PLUGIN_BASE_DIR%\Version.ver
@echo Build properties file: %VERSION_PROPERTIES_FILE%

@set OUTPUT_DIR="%PLUGIN_BASE_DIR%\Builds\"
@echo Output dir: %OUTPUT_DIR%

@set CHROME_FILES_DIR="%PLUGIN_BASE_DIR%\Chrome"
@echo Chrome files dir: %CHROME_FILES_DIR%

@set FIREFOX_FILES_DIR="%PLUGIN_BASE_DIR%\Firefox"
@echo Firefox files dir: %FIREFOX_FILES_DIR%

@set INSTALLER_FILES_DIR=%plugin_base_dir%\Installer
@echo Installer files dir: %INSTALLER_FILES_DIR%

@set CHROME_INSTALLER_FILES_DIR=%INSTALLER_FILES_DIR%\Installer.CRX\
@echo Chrome Installer files dir: %CHROME_INSTALLER_FILES_DIR%

@set FIREFOX_INSTALLER_FILES_DIR=%INSTALLER_FILES_DIR%\Installer.XPI\
@echo Firefox Installer files dir: %FIREFOX_INSTALLER_FILES_DIR%

@set CHROME_INSTALLER_BUILD_TOOL=%CHROME_INSTALLER_FILES_DIR%\create_crx.bat
@echo Chrome Installer build tool: %CHROME_INSTALLER_BUILD_TOOL%

@set FIREFOX_INSTALLER_BUILD_TOOL=%FIREFOX_INSTALLER_FILES_DIR%\create_xpi.bat
@echo Firefox Installer build tool: %FIREFOX_INSTALLER_BUILD_TOOL%

:GenerateCrx
%CHROME_INSTALLER_BUILD_TOOL% %BUILD_TOOLS_DIR% %VERSION_PROPERTIES_FILE% %OUTPUT_DIR% %CHROME_FILES_DIR% %CHROME_INSTALLER_FILES_DIR%
if %ERRORLEVEL% EQU 0 goto GenerateXpi
echo Error creating Chrome installer
goto ErrorAbort

:GenerateXpi
%FIREFOX_INSTALLER_BUILD_TOOL% %BUILD_TOOLS_DIR% %VERSION_PROPERTIES_FILE% %OUTPUT_DIR% %FIREFOX_FILES_DIR% %FIREFOX_INSTALLER_FILES_DIR%
if %ERRORLEVEL% EQU 0 goto Done
echo Error creating Firefox installer
goto ErrorAbort

:Done
goto EndSuccess

:ErrorAbort
    echo Error in ("%~0"). ERROR LEVEL = %ERRORLEVEL%, aborting
    exit /B 1

:EndSuccess
    endlocal
    echo Success ("%~0")
    exit /B 0
