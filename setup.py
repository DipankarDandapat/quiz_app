#!/usr/bin/env python3
"""
Quiz Portal Setup Script
Automated setup for the Quiz Portal application
"""

import os
import sys
import subprocess
import platform

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"\n🔄 {description}...")
    try:
        if platform.system() == "Windows":
            result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        else:
            result = subprocess.run(command.split(), check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error during {description}")
        print(f"Command: {command}")
        print(f"Error: {e.stderr}")
        return False

def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8 or higher is required")
        print(f"Current version: {version.major}.{version.minor}.{version.micro}")
        return False
    print(f"✅ Python version {version.major}.{version.minor}.{version.micro} is compatible")
    return True

def setup_virtual_environment():
    """Create and activate virtual environment"""
    print("\n🔄 Setting up virtual environment...")
    
    # Create virtual environment
    if not run_command("python -m venv venv", "Creating virtual environment"):
        return False
    
    # Determine activation command based on OS
    if platform.system() == "Windows":
        activate_cmd = "venv\\Scripts\\activate"
        pip_cmd = "venv\\Scripts\\pip"
    else:
        activate_cmd = "source venv/bin/activate"
        pip_cmd = "venv/bin/pip"
    
    print(f"✅ Virtual environment created")
    print(f"📝 To activate manually: {activate_cmd}")
    
    return pip_cmd

def install_dependencies(pip_cmd):
    """Install required Python packages"""
    dependencies = [
        "Flask==2.3.3",
        "Flask-SQLAlchemy==3.0.5", 
        "Flask-CORS==4.0.0",
        "Werkzeug==2.3.7"
    ]
    
    for dep in dependencies:
        if not run_command(f"{pip_cmd} install {dep}", f"Installing {dep}"):
            return False
    
    return True

def initialize_database():
    """Initialize database with dummy data"""
    print("\n🔄 Initializing database with sample data...")
    
    if platform.system() == "Windows":
        python_cmd = "venv\\Scripts\\python"
    else:
        python_cmd = "venv/bin/python"
    
    return run_command(f"{python_cmd} create_dummy_data.py", "Database initialization")

def main():
    """Main setup function"""
    print("🚀 Quiz Portal Setup Script")
    print("=" * 50)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Setup virtual environment
    pip_cmd = setup_virtual_environment()
    if not pip_cmd:
        print("❌ Failed to setup virtual environment")
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies(pip_cmd):
        print("❌ Failed to install dependencies")
        sys.exit(1)
    
    # Initialize database
    if not initialize_database():
        print("❌ Failed to initialize database")
        sys.exit(1)
    
    # Success message
    print("\n" + "=" * 50)
    print("🎉 Setup completed successfully!")
    print("=" * 50)
    
    print("\n📋 Next steps:")
    if platform.system() == "Windows":
        print("1. Activate virtual environment: venv\\Scripts\\activate")
        print("2. Start the application: venv\\Scripts\\python src\\main.py")
    else:
        print("1. Activate virtual environment: source venv/bin/activate")
        print("2. Start the application: python src/main.py")
    
    print("3. Open browser to: http://localhost:5000")
    print("\n👤 Test user credentials:")
    print("   Username: testuser")
    print("   Password: password123")
    
    print("\n📚 Documentation:")
    print("   - README.md - Complete setup and usage guide")
    print("   - DATABASE_SCHEMA.md - Database structure details")
    print("   - API_DOCUMENTATION.md - API endpoint reference")

if __name__ == "__main__":
    main()

