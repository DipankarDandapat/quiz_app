@echo off
echo Quiz Portal - Windows Setup Script
echo ===================================

echo Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8 or higher from https://python.org
    pause
    exit /b 1
)

echo Running setup script...
python setup.py

if errorlevel 1 (
    echo Setup failed. Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo Setup completed! You can now run the application.
echo.
echo To start the application:
echo 1. venv\Scripts\activate
echo 2. python src\main.py
echo 3. Open http://localhost:5000 in your browser
echo.
pause

