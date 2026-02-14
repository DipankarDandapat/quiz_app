#!/bin/bash

echo "Quiz Portal - Unix Setup Script"
echo "================================"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    echo "Please install Python 3.8 or higher"
    exit 1
fi

echo "Python version:"
python3 --version

echo "Running setup script..."
python3 setup.py

if [ $? -ne 0 ]; then
    echo "Setup failed. Please check the error messages above."
    exit 1
fi

echo ""
echo "Setup completed! You can now run the application."
echo ""
echo "To start the application:"
echo "1. source venv/bin/activate"
echo "2. python src/main.py"
echo "3. Open http://localhost:5000 in your browser"
echo ""

