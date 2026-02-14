# Quiz Portal - Comprehensive Quiz Application

A full-featured quiz application built with Python Flask and modern web technologies, featuring user authentication, dynamic exam management, timed MCQ tests, result tracking, and comprehensive analytics.

## 🚀 Features

### Core Functionality
- **User Authentication**: Secure registration, login, and logout with password hashing
- **Dynamic Exam Management**: Exams and subjects automatically populate from database
- **Quiz Test System**: Multiple choice questions with correct answers stored in database
- **Timer Functionality**: Configurable time limits per test with real-time countdown
- **Auto-Submit**: Tests automatically submit when time expires
- **Result Tracking**: Automatic scoring (1 mark per question) with detailed analytics
- **Activity Dashboard**: Complete test history and performance statistics
- **Responsive Design**: Beautiful gradient UI that works on desktop and mobile

### Advanced Features
- **Duplicate Prevention**: Users cannot retake completed tests
- **Progress Tracking**: Visual progress bars during tests
- **Subject Analytics**: Performance breakdown by subject area
- **Leaderboard**: Compare performance with other users
- **Session Management**: Secure user sessions with proper logout
- **Database Relationships**: Properly normalized database with foreign key constraints

## 📋 Requirements

### System Requirements
- Python 3.8 or higher
- pip (Python package installer)
- Virtual environment (recommended)

### Python Dependencies
```
Flask==2.3.3
Flask-SQLAlchemy==3.0.5
Flask-CORS==4.0.0
Werkzeug==2.3.7
```

## 🛠️ Installation & Setup

### 1. Clone/Download the Project
```bash
# If you have the project files, navigate to the project directory
cd quiz_app
```

### 2. Create Virtual Environment
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install Flask==2.3.3 Flask-SQLAlchemy==3.0.5 Flask-CORS==4.0.0 Werkzeug==2.3.7
```

### 4. Initialize Database with Dummy Data
```bash
python create_dummy_data.py
```

### 5. Run the Application
```bash
python src/main.py
```

The application will be available at: `http://localhost:5000`

## 👤 Test User Credentials

### Main Test User
- **Username**: `testuser`
- **Password**: `password123`
- **Email**: `test@example.com`

### Additional Users (for leaderboard testing)
- **alice_smith** / password123
- **bob_jones** / password123
- **carol_brown** / password123
- **david_wilson** / password123
- **emma_davis** / password123

## 📊 Database Structure

### Tables Overview
1. **users** - User account information
2. **exams** - Exam categories (e.g., Computer Science, Mathematics)
3. **subjects** - Subject areas within exams (e.g., Python Programming, Calculus)
4. **quiz_tests** - Individual quiz tests with time limits
5. **questions** - MCQ questions with options and correct answers
6. **test_results** - User test attempts and scores
7. **user_answers** - Individual question responses

### Entity Relationships
```
users (1) ←→ (many) test_results
exams (1) ←→ (many) subjects
subjects (1) ←→ (many) quiz_tests
quiz_tests (1) ←→ (many) questions
quiz_tests (1) ←→ (many) test_results
test_results (1) ←→ (many) user_answers
questions (1) ←→ (many) user_answers
```

## 🗂️ Project Structure

```
quiz_app/
├── src/
│   ├── main.py                 # Main Flask application
│   ├── models/
│   │   └── user.py            # Database models and schemas
│   ├── routes/
│   │   ├── user.py            # Authentication endpoints
│   │   ├── exam.py            # Exam and subject management
│   │   ├── quiz.py            # Quiz test functionality
│   │   └── activity.py        # Activity tracking and analytics
│   └── static/
│       ├── index.html         # Main frontend interface
│       └── app.js             # Frontend JavaScript logic
├── create_dummy_data.py       # Database seeding script
├── requirements.txt           # Python dependencies
├── README.md                  # This documentation
├── DATABASE_SCHEMA.md         # Detailed database documentation
└── API_DOCUMENTATION.md       # API endpoint documentation
```

## 🔧 Configuration

### Database Configuration
The application uses SQLite by default with the database file stored at:
```
quiz_app/src/quiz_portal.db
```

### CORS Configuration
CORS is enabled for all origins to support frontend-backend communication.

### Session Configuration
- Session timeout: Browser session (closes when browser closes)
- Secure session cookies in production
- Session data stored server-side

## 🎯 Sample Data

### Exams Included
1. **Computer Science Fundamentals**
   - Python Programming (2 tests)
   - Data Structures (2 tests)
   - Algorithms (1 test)

2. **Mathematics for Engineers**
   - Calculus (1 test)
   - Linear Algebra (1 test)
   - Statistics (1 test)

3. **General Knowledge Quiz**
   - World History (1 test)
   - Geography (1 test)
   - Science Facts (1 test)

### Question Types
- Python programming concepts
- Data structure fundamentals
- Mathematical principles
- World geography and capitals
- General science knowledge

## 🚀 Usage Guide

### For Students
1. **Register/Login**: Create account or login with test credentials
2. **Browse Exams**: View available exam categories
3. **Select Subject**: Choose a subject within an exam
4. **Take Quiz**: Select a quiz test and start the timer
5. **Answer Questions**: Navigate through MCQ questions
6. **Submit**: Complete test before time expires
7. **View Results**: Check scores and detailed analytics
8. **Track Progress**: Monitor performance in Activity section

### For Administrators
1. **Add Exams**: Insert new exam categories in database
2. **Create Subjects**: Add subjects linked to exams
3. **Design Tests**: Create quiz tests with time limits
4. **Add Questions**: Insert MCQ questions with correct answers
5. **Monitor Usage**: View user activity and performance

## 🔌 API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/check-auth` - Check authentication status

### Exams & Subjects
- `GET /api/exams` - Get all exams
- `GET /api/exams/{id}/subjects` - Get subjects for an exam
- `GET /api/subjects/{id}/quiz-tests` - Get quiz tests for a subject

### Quiz Tests
- `POST /api/quiz-tests/{id}/start` - Start a quiz test
- `GET /api/quiz-tests/{id}/questions` - Get test questions
- `POST /api/quiz-tests/{id}/submit-answer` - Submit answer
- `POST /api/quiz-tests/{id}/submit` - Submit complete test

### Activity & Analytics
- `GET /api/my-activity` - Get user's test history
- `GET /api/leaderboard` - Get leaderboard data

## 🛡️ Security Features

### Password Security
- Passwords hashed using Werkzeug's secure password hashing
- No plain text passwords stored in database
- Secure password verification

### Session Security
- Server-side session management
- Session data not exposed to client
- Automatic session cleanup

### Input Validation
- SQL injection prevention through SQLAlchemy ORM
- Input sanitization for all user data
- Proper error handling and validation

## 🐛 Troubleshooting

### Common Issues

**Database not found**
```bash
# Solution: Run the dummy data script
python create_dummy_data.py
```

**Port already in use**
```bash
# Solution: Change port in main.py or kill existing process
# Kill process on port 5000 (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Kill process on port 5000 (macOS/Linux)
lsof -ti:5000 | xargs kill -9
```

**Module not found**
```bash
# Solution: Ensure virtual environment is activated and dependencies installed
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

**CORS errors**
- Ensure Flask-CORS is installed and configured
- Check that frontend is accessing correct backend URL

## 📈 Performance Considerations

### Database Optimization
- Indexed foreign key relationships
- Efficient query patterns using SQLAlchemy
- Minimal database calls per request

### Frontend Optimization
- Single-page application design
- Efficient DOM manipulation
- Responsive CSS with minimal overhead

### Scalability
- Stateless API design
- Database connection pooling
- Modular architecture for easy expansion

## 🔮 Future Enhancements

### Planned Features
- Question categories and difficulty levels
- Image/media support in questions
- Detailed analytics dashboard
- Export results to PDF/Excel
- Email notifications
- Mobile app version
- Real-time multiplayer quizzes

### Technical Improvements
- Redis for session storage
- PostgreSQL for production database
- Docker containerization
- Automated testing suite
- CI/CD pipeline

## 📞 Support

### Getting Help
1. Check this README for common solutions
2. Review the API documentation
3. Examine the database schema documentation
4. Check application logs for error details

### Development
- Built with Flask 2.3.3
- Frontend uses vanilla JavaScript (no frameworks)
- Database: SQLAlchemy ORM with SQLite
- Styling: Custom CSS with gradient themes

## 📄 License

This project is created for educational and demonstration purposes. Feel free to use, modify, and distribute as needed.

---

**Happy Learning! 🎓**

