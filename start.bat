@ECHO off
set LogLevel=2
:loop
set Timestamp=%date:/=-% %time::=-%
echo %Timestamp%
node .
rem node . >> "log/%Timestamp%_out.log" 2>> "log/%Timestamp%_error.log"
goto loop
pause
