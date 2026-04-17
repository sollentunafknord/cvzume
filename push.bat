@echo off
if "%~1"=="" (
    echo Kullanim: push.bat "commit mesaji"
    exit /b
)
git add -A
git commit -m "%~1"
git push
echo.
echo Push tamamlandi!
