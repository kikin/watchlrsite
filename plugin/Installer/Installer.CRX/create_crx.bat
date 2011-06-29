@echo off

rem This script use crxmake to create the CRX.

rem The script assumes X arguments have been passed
rem %1 is assumed to be the path of the build tools directory
rem %2 is assumed to be the path to Version.ver.
rem %3 is assumed to be the path where output is going to be copied.
rem %4 is assumed to be the path where background.html and content_script.js are located
rem %5 is assumed to be the path where chrome_extension.pem (private key) and manifest.json.m4 are located

rem Print parameters so caller knows for sure what we have assumed
echo Generating CRX installer...

rem Variables
set DUMMY_VAR=

set BUILD_TOOLS_DIR="%~1"
echo Build tools dir: %BUILD_TOOLS_DIR%
set CRXMAKE_TOOL="%~1crxmake\crxmake.exe"
echo Using crxmake tool %CRXMAKE_TOOL%
set M4_TOOL="%~1m4.exe"
echo Using M4 at %M4_TOOL%

@rem Do not put quotes around this
@set VERSION_PROPERTIES_FILE=%~2
@echo Build properties file: %VERSION_PROPERTIES_FILE%

@echo Retrieving version numbers...
@for /F "delims=^" %%i IN ('echo include^(^`%VERSION_PROPERTIES_FILE%^'^)__K_MAJOR_VERSION__^| %M4_TOOL%') DO set KIKIN_MAJOR=%%i
@for /F "delims=^" %%i IN ('echo include^(^`%VERSION_PROPERTIES_FILE%^'^)__K_MINOR_VERSION__^| %M4_TOOL%') DO set KIKIN_MINOR=%%i
@for /F "delims=^" %%i IN ('echo include^(^`%VERSION_PROPERTIES_FILE%^'^)__K_BUILD_NUMBER__^| %M4_TOOL%') DO set KIKIN_BUILD=%%i
set KIKIN_VERSION=%KIKIN_MAJOR%.%KIKIN_MINOR%.%KIKIN_BUILD%
echo Using version string %KIKIN_VERSION%

set OUTPUT_DIR="%~3"
echo Generating CRX structure at %OUTPUT_DIR%

echo Output will be located at %~3%
set OUTPUT_FILE="%~3watchlr_installer_%KIKIN_VERSION%.crx"
echo Final CRX installer file: %OUTPUT_FILE%

set CHROME_FILES_DIR="%~4"
echo Using background.html and content_script.js from %OUTPUT_DIR%

echo Using manifest, private key from "%~5"
set MANIFEST_JSON_M4_FILE="%~5manifest.json.m4"
set MANIFEST_JSON_FILENAME=manifest.json
set CHROME_EXTENSION_PEM_FILE="%~5chrome_extension.pem"

echo ...

:DeleteManifestJsonFile
rem Delete manifest.json in chrome dir if it exists
if exist  %CHROME_FILES_DIR%\%MANIFEST_JSON_FILENAME% del /Q  %CHROME_FILES_DIR%\%MANIFEST_JSON_FILENAME%
if %ERRORLEVEL% EQU 0 goto GenerateManifestJsonFile
echo Error removing old %MANIFEST_JSON_M4_FILE%.
goto ErrorAbort

:GenerateManifestJsonFile
rem Updating Version number in manifest.json
%M4_TOOL% %VERSION_PROPERTIES_FILE% %MANIFEST_JSON_M4_FILE% > %CHROME_FILES_DIR%\%MANIFEST_JSON_FILENAME%
if %ERRORLEVEL% EQU 0 goto MakeOutputDir
echo Error generating %CRX_DIR%%MANIFEST_JSON_FILENAME%
goto ErrorAbort

:MakeOutputDir
rem Create folder to put CRX content on
if not exist %OUTPUT_DIR% mkdir %OUTPUT_DIR% > nul
if %ERRORLEVEL% EQU 0 goto DeleteOldOutputFile
echo Error creating %OUTPUT_DIR% directory.
goto ErrorAbort

:DeleteOldOutputFile
if not exist %OUTPUT_FILE% goto GenerateCrx
del %OUTPUT_FILE% > nul
if %ERRORLEVEL% EQU 0 goto GenerateCrx
echo Error deleting %OUTPUT_FILE%
goto ErrorAbort

:GenerateCrx
%CRXMAKE_TOOL% --pack-extension=%CHROME_FILES_DIR% --extension-output=%OUTPUT_FILE% --pack-extension-key=%CHROME_EXTENSION_PEM_FILE% > nul
if %ERRORLEVEL% EQU 0 goto Done
echo Error creating %OUTPUT_FILE%
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
