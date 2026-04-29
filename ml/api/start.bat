@echo off
echo CartIQ ML API — Starting...
echo.

cd /d "%~dp0"

pip install -q -r requirements.txt

echo.
python app.py
pause