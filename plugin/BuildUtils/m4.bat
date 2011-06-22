@echo off
rem Caller script to run m4 when appropriate and add -o option to M4

rem Get Current directory before we shift any arguments
set m4dir=%~dp0

rem Check command line options
if "%1"=="" goto printusage

rem Pull -o option if available
set m4output=
if not "%1"=="-o" goto nooutputparam
    shift
    if "%1"=="" goto printusage
    set m4output=%1
    shift            
    if "%1"=="" goto printusage    
:nooutputparam
    
rem Put all available arguments in variable
rem For each argument if it does not begin with - assume it is an input file
rem For every input file, check:
rem     1. The input file exists
rem     2. Whether the input file is newer than the output file if an output file was given.

set shouldruncommand=0

rem Process first argument
set param=%1
set params=%param%
if "%param:~0,1%"=="-" goto nofilenameargument
    
    rem Check input file
    if not exist %param% (
        echo Input file %param% does not exist, exiting.
        goto exiterror
    )    
    
    rem Check date of input file vs output file
    if "%m4output%"=="" goto nooutput
        for /F "delims=" %%i in ('xcopy /DHYL %param% %m4output%^|findstr /I "File"') do set /a outputfileolder=%%i 2>Nul                
        if not exist %m4output% set /a shouldruncommand=1
        if "%outputfileolder%"=="1" set /a shouldruncommand=1
        rem echo After first parameter shouldruncommand=%shouldruncommand%
    :nooutput
:nofilenameargument

rem Process all other arguments
:paramsloop
    shift
    if "%1"=="" goto afterparamsloop
    set param=%1

    if "%param:~0,1%"=="-" goto nofilenameargument_loop
        
        rem Check input file
        if not exist %param% (
            echo Input file %param% does not exist, exiting.
            goto exiterror
        )

        rem Check date of input file vs output file
        if "%m4output%"=="" goto nooutput_loop
            for /F "delims=" %%i in ('xcopy /DHYL %param% %m4output%^|findstr /I "File"') do set /a outputfileolder=%%i 2>Nul        
            if not exist %m4output% set /a shouldruncommand=1
            if "%outputfileolder%"=="1" set /a shouldruncommand=1
            rem echo After N parameter shouldruncommand=%shouldruncommand%
        :nooutput_loop
    :nofilenameargument_loop

    set params=%params% %param%
goto paramsloop
:afterparamsloop

if not "%shouldruncommand%"=="1" goto shouldnotrun
    if "%m4output%"=="" (
        %m4dir%\m4.exe %params%
    ) else (
        %m4dir%\m4.exe %params% > %m4output%
    )
    if %ERRORLEVEL% equ 0 goto aftercommand
    echo Error running M4 command.
    if not "%m4output%"=="" del %m4output%
    goto exiterror
:shouldnotrun
echo No need to run m4 as output file is newer.
goto aftercommand

:aftercommand
goto exitsuccess

:printusage 
echo Usage m4.bat [-o ^<output file^>] ...
goto exiterror

:exitsuccess
exit /B 0

:exiterror
exit /B 1