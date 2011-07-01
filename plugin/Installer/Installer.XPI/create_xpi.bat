@echo off

rem This script copies all XPI files into an XPI folder and then
rem zips the content of the folder to create the XPI.

rem The script assumes X arguments have been passed
rem The script assumes X arguments have been passed
rem %1 is assumed to be the path of the build tools directory
rem %2 is assumed to be the path to Version.ver.
rem %3 is assumed to be the path where output is going to be copied.
rem %4 is assumed to be the path where firefox files are are located
rem %5 is assumed to be the path where install.rdf.m4 are located

rem Print parameters so caller knows for sure what we have assumed
echo Generating XPI installer...

rem Variables
set DUMMY_VAR=

set BUILD_TOOLS_DIR="%~1"
echo Build tools dir: %BUILD_TOOLS_DIR%
set ZIP_TOOL="%~17z.exe"
echo Using Zip tool %ZIP_TOOL%
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
echo Output will be located at %~3%
set OUTPUT_FILE="%~3watchlr_installer_%KIKIN_VERSION%.xpi"
echo Final XPI installer file: %OUTPUT_FILE%

set FIREFOX_FILES_DIR="%~4"
echo Using firefox files from %FIREFOX_FILES_DIR%

echo Using install.rdf from "%~5"
set INSTALL_RDF_M4_FILE="%~5install.rdf.m4"
set INSTALL_RDF_FILENAME=install.rdf

echo ...

:DeleteInstallRdfFile
rem Delete install.rdf in firefox dir if it exists
if exist  %FIREFOX_FILES_DIR%\%INSTALL_RDF_FILENAME% del /Q  %FIREFOX_FILES_DIR%\%INSTALL_RDF_FILENAME%
if %ERRORLEVEL% EQU 0 goto GenerateInstallRdfFile
echo Error removing old %INSTALL_RDF_FILENAME%.
goto ErrorAbort

:GenerateInstallRdfFile
rem Updating Version number in insatll.rdf
%M4_TOOL% %VERSION_PROPERTIES_FILE% %INSTALL_RDF_M4_FILE% > %FIREFOX_FILES_DIR%\%INSTALL_RDF_FILENAME%
if %ERRORLEVEL% EQU 0 goto MakeOutputDir
echo Error generating %FIREFOX_FILES_DIR%%INSTALL_RDF_FILENAME%
goto ErrorAbort

:MakeOutputDir
rem Create folder to put CRX content on
if not exist %OUTPUT_DIR% mkdir %OUTPUT_DIR% > nul
if %ERRORLEVEL% EQU 0 goto DeleteOldOutputFile
echo Error creating %OUTPUT_DIR% directory.
goto ErrorAbort

:DeleteOldOutputFile
if not exist %OUTPUT_FILE% goto GenerateXpi
del %OUTPUT_FILE% > nul
if %ERRORLEVEL% EQU 0 goto GenerateXpi
echo Error deleting %OUTPUT_FILE%
goto ErrorAbort

:GenerateXpi
cd /D %FIREFOX_FILES_DIR%
if %ERRORLEVEL% EQU 0 goto GenerateZip
echo Error gentering %FIREFOX_FILES_DIR%
goto ErrorAbort

:GenerateZip
%ZIP_TOOL% a -tzip %OUTPUT_FILE% * > nul
if %ERRORLEVEL% EQU 0 goto Done
echo Error zipping Firefox dir into %OUTPUT_FILE%
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
