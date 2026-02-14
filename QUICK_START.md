# Quick Start Guide

## 🚀 Get Started in 3 Steps

### Option 1: Automated Setup (Recommended)

**Windows:**
```cmd
setup.bat
```

**Linux/macOS:**
```bash
./setup.sh
```

### Option 2: Manual Setup

1. **Install Dependencies**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Initialize Database**
   ```bash
   python create_dummy_data.py
   ```

3. **Run Application**
   ```bash
   python src/main.py
   ```

## 🌐 Access the Application

Open your browser and go to: **http://localhost:5000**

## 👤 Test Login

- **Username:** `testuser`
- **Password:** `password123`

## 📱 What You Can Do

1. **Login** with test credentials
2. **Browse Exams** - 3 categories available
3. **Take Quizzes** - Timed MCQ tests
4. **View Results** - Detailed analytics
5. **Check Activity** - Performance tracking

## 🎯 Sample Data Included

- **3 Exams:** Computer Science, Mathematics, General Knowledge
- **9 Subjects:** Python, Data Structures, Algorithms, etc.
- **11 Quiz Tests:** Various time limits (15-30 minutes)
- **15 Questions:** MCQ with correct answers
- **6 Users:** For testing leaderboard features

## 📚 Documentation

- `README.md` - Complete documentation
- `DATABASE_SCHEMA.md` - Database structure
- `API_DOCUMENTATION.md` - API reference

## 🛠️ Troubleshooting

**Port already in use?**
```bash
# Kill process on port 5000
# Windows: netstat -ano | findstr :5000
# Linux/macOS: lsof -ti:5000 | xargs kill -9
```

**Database issues?**
```bash
python create_dummy_data.py  # Recreate database
```

**Dependencies missing?**
```bash
pip install -r requirements.txt
```

## 🎉 You're Ready!

The quiz application includes all requested features:
- ✅ User registration and login
- ✅ Dynamic exam/subject management
- ✅ Timed MCQ tests with auto-submit
- ✅ Result tracking and analytics
- ✅ Activity monitoring
- ✅ Responsive web interface

**Happy Learning! 🎓**

