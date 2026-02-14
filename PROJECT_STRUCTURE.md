# Project Structure Overview

```
quiz_app/
├── 📁 src/                          # Main application source code
│   ├── 🐍 main.py                   # Flask application entry point
│   ├── 📁 models/                   # Database models
│   │   └── 🐍 user.py              # All database models (User, Exam, Subject, etc.)
│   ├── 📁 routes/                   # API route handlers
│   │   ├── 🐍 user.py              # Authentication endpoints (/api/login, /api/register)
│   │   ├── 🐍 exam.py              # Exam management (/api/exams, /api/subjects)
│   │   ├── 🐍 quiz.py              # Quiz functionality (/api/quiz-tests)
│   │   └── 🐍 activity.py          # Activity tracking (/api/my-activity)
│   └── 📁 static/                   # Frontend files
│       ├── 🌐 index.html           # Main web interface
│       └── ⚡ app.js                # Frontend JavaScript logic
├── 🐍 create_dummy_data.py         # Database seeding script
├── 🐍 setup.py                     # Automated setup script
├── 🔧 setup.bat                    # Windows setup script
├── 🔧 setup.sh                     # Unix/Linux setup script
├── 📋 requirements.txt             # Python dependencies
├── 📖 README.md                    # Complete documentation
├── 📖 QUICK_START.md               # Quick setup guide
├── 📖 DATABASE_SCHEMA.md           # Database structure details
├── 📖 API_DOCUMENTATION.md         # API endpoint reference
└── 📖 PROJECT_STRUCTURE.md         # This file
```

## 🗂️ File Descriptions

### Core Application Files

**`src/main.py`**
- Flask application configuration
- CORS setup for frontend-backend communication
- Blueprint registration for modular routing
- Database initialization
- Application entry point

**`src/models/user.py`**
- SQLAlchemy database models for all entities
- User authentication with password hashing
- Exam, Subject, QuizTest, Question models
- TestResult and UserAnswer for tracking
- Database relationships and constraints

### API Route Modules

**`src/routes/user.py`**
- User registration and validation
- Login/logout with session management
- Authentication status checking
- Password security with Werkzeug

**`src/routes/exam.py`**
- Exam listing and management
- Subject retrieval by exam
- Quiz test listing by subject
- Dynamic content population from database

**`src/routes/quiz.py`**
- Quiz test session management
- Question retrieval (without answers)
- Answer submission and validation
- Test completion and scoring
- Timer enforcement and auto-submit

**`src/routes/activity.py`**
- User test history and statistics
- Performance analytics by subject
- Leaderboard generation
- Activity tracking and reporting

### Frontend Files

**`src/static/index.html`**
- Single-page application interface
- Responsive design with CSS Grid/Flexbox
- Beautiful gradient theme
- Modal dialogs for different sections
- Timer display and progress tracking

**`src/static/app.js`**
- Frontend application logic
- API communication with fetch()
- Timer management and countdown
- Dynamic content rendering
- Session management and navigation

### Setup and Configuration

**`create_dummy_data.py`**
- Database schema creation
- Sample data population
- 6 users, 3 exams, 9 subjects
- 11 quiz tests with 15 questions
- Test results for demonstration

**`setup.py`**
- Cross-platform setup automation
- Virtual environment creation
- Dependency installation
- Database initialization
- Error handling and validation

**`requirements.txt`**
- Flask 2.3.3 - Web framework
- Flask-SQLAlchemy 3.0.5 - Database ORM
- Flask-CORS 4.0.0 - Cross-origin requests
- Werkzeug 2.3.7 - Security utilities

## 🔄 Data Flow

```
Frontend (index.html + app.js)
    ↕️ HTTP/JSON API calls
Backend Routes (user.py, exam.py, quiz.py, activity.py)
    ↕️ SQLAlchemy ORM
Database Models (user.py)
    ↕️ SQL queries
SQLite Database (quiz_portal.db)
```

## 🚀 Getting Started

1. **Quick Setup:** Run `setup.bat` (Windows) or `./setup.sh` (Unix)
2. **Manual Setup:** Follow instructions in `README.md`
3. **Database:** Automatically created with sample data
4. **Access:** Open http://localhost:5000
5. **Login:** Use `testuser` / `password123`

## 🎯 Key Features Implemented

- ✅ **User Authentication** - Secure registration/login
- ✅ **Dynamic Exams** - Database-driven content
- ✅ **Timed Quizzes** - Real-time countdown timers
- ✅ **Auto-Submit** - Automatic submission on timeout
- ✅ **Result Tracking** - Comprehensive analytics
- ✅ **Activity Dashboard** - Performance monitoring
- ✅ **Responsive UI** - Works on desktop and mobile
- ✅ **Security** - Password hashing, session management

## 🛠️ Customization

### Adding New Exams
1. Insert into `exams` table
2. Add related subjects in `subjects` table
3. Create quiz tests in `quiz_tests` table
4. Add questions in `questions` table

### Modifying UI
- Edit `src/static/index.html` for layout
- Modify `src/static/app.js` for functionality
- Update CSS styles in the HTML file

### API Extensions
- Add new routes in appropriate route files
- Update database models if needed
- Extend frontend to use new endpoints

## 📊 Database Schema Summary

- **users** - User accounts and authentication
- **exams** - Exam categories (Computer Science, Math, etc.)
- **subjects** - Subject areas within exams
- **quiz_tests** - Individual tests with time limits
- **questions** - MCQ questions with correct answers
- **test_results** - User test attempts and scores
- **user_answers** - Individual question responses

## 🔧 Development Notes

- **Framework:** Flask with SQLAlchemy ORM
- **Database:** SQLite (easily upgradeable to PostgreSQL)
- **Frontend:** Vanilla JavaScript (no frameworks)
- **Styling:** Custom CSS with modern design
- **Architecture:** RESTful API with session-based auth
- **Security:** Password hashing, input validation, CORS

This structure provides a solid foundation for a scalable quiz application with clean separation of concerns and comprehensive documentation.

