# Database Schema Documentation

## Overview

The Quiz Portal uses a relational database design with SQLite as the default database engine. The schema is designed to support a scalable quiz system with proper normalization and referential integrity.

## Database Tables

### 1. users
Stores user account information and authentication data.

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `id`: Primary key, auto-incrementing user identifier
- `username`: Unique username for login (max 80 characters)
- `email`: Unique email address (max 120 characters)
- `password_hash`: Hashed password using Werkzeug security
- `created_at`: Account creation timestamp

**Sample Data:**
```sql
INSERT INTO users VALUES 
(1, 'testuser', 'test@example.com', 'hashed_password', '2025-06-22 03:00:00'),
(2, 'alice_smith', 'alice@example.com', 'hashed_password', '2025-06-22 03:00:00');
```

### 2. exams
Represents exam categories or main subject areas.

```sql
CREATE TABLE exams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Fields:**
- `id`: Primary key, exam identifier
- `name`: Exam category name (e.g., "Computer Science Fundamentals")
- `description`: Detailed description of the exam
- `created_at`: Exam creation timestamp

**Sample Data:**
```sql
INSERT INTO exams VALUES 
(1, 'Computer Science Fundamentals', 'Basic concepts in computer science including programming, algorithms, and data structures', '2025-06-22'),
(2, 'Mathematics for Engineers', 'Essential mathematical concepts for engineering students', '2025-06-22'),
(3, 'General Knowledge Quiz', 'Test your knowledge across various topics including history, geography, and science', '2025-06-22');
```

### 3. subjects
Represents subject areas within each exam category.

```sql
CREATE TABLE subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    exam_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams (id)
);
```

**Fields:**
- `id`: Primary key, subject identifier
- `name`: Subject name (e.g., "Python Programming")
- `description`: Subject description
- `exam_id`: Foreign key referencing exams table
- `created_at`: Subject creation timestamp

**Relationships:**
- Many-to-One with `exams` (many subjects belong to one exam)

**Sample Data:**
```sql
INSERT INTO subjects VALUES 
(1, 'Python Programming', 'Learn Python programming basics', 1, '2025-06-22'),
(2, 'Data Structures', 'Arrays, lists, trees, and graphs', 1, '2025-06-22'),
(3, 'Algorithms', 'Sorting, searching, and optimization algorithms', 1, '2025-06-22');
```

### 4. quiz_tests
Individual quiz tests within each subject.

```sql
CREATE TABLE quiz_tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    subject_id INTEGER NOT NULL,
    time_limit_minutes INTEGER NOT NULL DEFAULT 30,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects (id)
);
```

**Fields:**
- `id`: Primary key, quiz test identifier
- `name`: Test name (e.g., "Python Basics")
- `description`: Test description
- `subject_id`: Foreign key referencing subjects table
- `time_limit_minutes`: Time limit for the test in minutes
- `created_at`: Test creation timestamp

**Relationships:**
- Many-to-One with `subjects` (many tests belong to one subject)

**Sample Data:**
```sql
INSERT INTO quiz_tests VALUES 
(1, 'Python Basics', 'Variables, data types, and basic operations', 1, 15, '2025-06-22'),
(2, 'Python Functions', 'Function definition and usage', 1, 20, '2025-06-22'),
(10, 'World Capitals', 'Capital cities of major countries', 8, 15, '2025-06-22');
```

### 5. questions
Multiple choice questions for each quiz test.

```sql
CREATE TABLE questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_test_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    option_a VARCHAR(500) NOT NULL,
    option_b VARCHAR(500) NOT NULL,
    option_c VARCHAR(500) NOT NULL,
    option_d VARCHAR(500) NOT NULL,
    correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_test_id) REFERENCES quiz_tests (id)
);
```

**Fields:**
- `id`: Primary key, question identifier
- `quiz_test_id`: Foreign key referencing quiz_tests table
- `question_text`: The question text
- `option_a`, `option_b`, `option_c`, `option_d`: Multiple choice options
- `correct_answer`: Correct answer ('A', 'B', 'C', or 'D')
- `created_at`: Question creation timestamp

**Relationships:**
- Many-to-One with `quiz_tests` (many questions belong to one test)

**Sample Data:**
```sql
INSERT INTO questions VALUES 
(1, 1, 'What is the correct way to declare a variable in Python?', 'var x = 5', 'x = 5', 'int x = 5', 'declare x = 5', 'B', '2025-06-22'),
(2, 1, 'Which of the following is a mutable data type in Python?', 'tuple', 'string', 'list', 'integer', 'C', '2025-06-22');
```

### 6. test_results
Records of user test attempts and scores.

```sql
CREATE TABLE test_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    quiz_test_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    time_taken_seconds INTEGER NOT NULL,
    started_at DATETIME NOT NULL,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (quiz_test_id) REFERENCES quiz_tests (id),
    UNIQUE(user_id, quiz_test_id)
);
```

**Fields:**
- `id`: Primary key, test result identifier
- `user_id`: Foreign key referencing users table
- `quiz_test_id`: Foreign key referencing quiz_tests table
- `score`: Number of correct answers
- `total_questions`: Total number of questions in the test
- `time_taken_seconds`: Time taken to complete the test
- `started_at`: Test start timestamp
- `completed_at`: Test completion timestamp
- `created_at`: Record creation timestamp

**Constraints:**
- Unique constraint on (user_id, quiz_test_id) prevents duplicate attempts

**Relationships:**
- Many-to-One with `users` (many results belong to one user)
- Many-to-One with `quiz_tests` (many results for one test)

**Sample Data:**
```sql
INSERT INTO test_results VALUES 
(1, 1, 1, 4, 5, 720, '2025-06-20 15:00:00', '2025-06-20 15:12:00', '2025-06-20 15:12:00'),
(2, 1, 10, 5, 5, 480, '2025-06-21 14:00:00', '2025-06-21 14:08:00', '2025-06-21 14:08:00');
```

### 7. user_answers
Individual question responses from users.

```sql
CREATE TABLE user_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_result_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    selected_answer CHAR(1) NOT NULL CHECK (selected_answer IN ('A', 'B', 'C', 'D')),
    is_correct BOOLEAN NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_result_id) REFERENCES test_results (id),
    FOREIGN KEY (question_id) REFERENCES questions (id)
);
```

**Fields:**
- `id`: Primary key, answer identifier
- `test_result_id`: Foreign key referencing test_results table
- `question_id`: Foreign key referencing questions table
- `selected_answer`: User's selected answer ('A', 'B', 'C', or 'D')
- `is_correct`: Boolean indicating if the answer was correct
- `created_at`: Answer submission timestamp

**Relationships:**
- Many-to-One with `test_results` (many answers belong to one test result)
- Many-to-One with `questions` (many answers for one question)

**Sample Data:**
```sql
INSERT INTO user_answers VALUES 
(1, 1, 1, 'B', 1, '2025-06-20 15:05:00'),
(2, 1, 2, 'C', 1, '2025-06-20 15:07:00');
```

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    users    │       │    exams    │       │  subjects   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)     │       │ id (PK)     │
│ username    │       │ name        │       │ name        │
│ email       │       │ description │       │ description │
│ password_hash│      │ created_at  │       │ exam_id (FK)│
│ created_at  │       └─────────────┘       │ created_at  │
└─────────────┘              │              └─────────────┘
       │                     │                     │
       │                     └─────────────────────┘
       │                                           │
       │                                           ▼
       │                                  ┌─────────────┐
       │                                  │ quiz_tests  │
       │                                  ├─────────────┤
       │                                  │ id (PK)     │
       │                                  │ name        │
       │                                  │ description │
       │                                  │ subject_id  │
       │                                  │ time_limit  │
       │                                  │ created_at  │
       │                                  └─────────────┘
       │                                         │
       │                                         │
       │                                         ▼
       │                                  ┌─────────────┐
       │                                  │ questions   │
       │                                  ├─────────────┤
       │                                  │ id (PK)     │
       │                                  │ quiz_test_id│
       │                                  │ question_text│
       │                                  │ option_a    │
       │                                  │ option_b    │
       │                                  │ option_c    │
       │                                  │ option_d    │
       │                                  │ correct_answer│
       │                                  │ created_at  │
       │                                  └─────────────┘
       │                                         │
       │                                         │
       ▼                                         │
┌─────────────┐                                 │
│test_results │                                 │
├─────────────┤                                 │
│ id (PK)     │                                 │
│ user_id (FK)│                                 │
│ quiz_test_id│                                 │
│ score       │                                 │
│ total_questions│                              │
│ time_taken  │                                 │
│ started_at  │                                 │
│ completed_at│                                 │
│ created_at  │                                 │
└─────────────┘                                 │
       │                                         │
       │                                         │
       ▼                                         ▼
┌─────────────┐                          ┌─────────────┐
│user_answers │                          │             │
├─────────────┤                          │             │
│ id (PK)     │                          │             │
│ test_result_id (FK)  ◄──────────────────┘             │
│ question_id (FK) ◄───────────────────────────────────┘
│ selected_answer│
│ is_correct  │
│ created_at  │
└─────────────┘
```

## Database Indexes

### Automatic Indexes (Primary Keys)
- `users.id`
- `exams.id`
- `subjects.id`
- `quiz_tests.id`
- `questions.id`
- `test_results.id`
- `user_answers.id`

### Foreign Key Indexes
SQLAlchemy automatically creates indexes for foreign key columns:
- `subjects.exam_id`
- `quiz_tests.subject_id`
- `questions.quiz_test_id`
- `test_results.user_id`
- `test_results.quiz_test_id`
- `user_answers.test_result_id`
- `user_answers.question_id`

### Unique Constraints
- `users.username` (unique)
- `users.email` (unique)
- `(test_results.user_id, test_results.quiz_test_id)` (composite unique)

## Data Integrity Rules

### Referential Integrity
- All foreign key relationships are enforced
- Cascade deletes are not implemented (manual cleanup required)
- Orphaned records are prevented by foreign key constraints

### Data Validation
- `questions.correct_answer` must be 'A', 'B', 'C', or 'D'
- `user_answers.selected_answer` must be 'A', 'B', 'C', or 'D'
- `users.username` and `users.email` must be unique
- Users cannot take the same test multiple times

### Business Rules
- Test results are immutable once created
- Scores are calculated as number of correct answers
- Time limits are enforced on the frontend with backend validation
- User sessions are managed securely

## Sample Queries

### Get all exams with subject count
```sql
SELECT e.id, e.name, e.description, COUNT(s.id) as subject_count
FROM exams e
LEFT JOIN subjects s ON e.id = s.exam_id
GROUP BY e.id, e.name, e.description;
```

### Get user's test history with scores
```sql
SELECT u.username, qt.name as test_name, tr.score, tr.total_questions,
       ROUND((tr.score * 100.0 / tr.total_questions), 2) as percentage,
       tr.completed_at
FROM test_results tr
JOIN users u ON tr.user_id = u.id
JOIN quiz_tests qt ON tr.quiz_test_id = qt.id
WHERE u.id = 1
ORDER BY tr.completed_at DESC;
```

### Get leaderboard for a specific test
```sql
SELECT u.username, tr.score, tr.total_questions,
       ROUND((tr.score * 100.0 / tr.total_questions), 2) as percentage,
       tr.time_taken_seconds
FROM test_results tr
JOIN users u ON tr.user_id = u.id
WHERE tr.quiz_test_id = 1
ORDER BY percentage DESC, tr.time_taken_seconds ASC;
```

### Get questions for a quiz test
```sql
SELECT id, question_text, option_a, option_b, option_c, option_d
FROM questions
WHERE quiz_test_id = 1
ORDER BY id;
```

## Database Initialization

The database is initialized using the `create_dummy_data.py` script which:

1. Drops all existing tables
2. Creates fresh table structure
3. Populates with sample data including:
   - 6 users (1 main test user + 5 additional users)
   - 3 exams with 9 subjects
   - 11 quiz tests with varying time limits
   - 15 MCQ questions with correct answers
   - Sample test results for demonstration

## Performance Considerations

### Query Optimization
- Foreign key indexes improve join performance
- Composite unique constraint on test_results prevents duplicate queries
- Proper normalization reduces data redundancy

### Scalability
- Database design supports horizontal scaling
- Stateless API design allows for database connection pooling
- Minimal complex queries reduce database load

### Storage
- SQLite suitable for development and small deployments
- Easy migration path to PostgreSQL for production
- Efficient storage with proper data types

## Migration Notes

### From SQLite to PostgreSQL
1. Update connection string in Flask configuration
2. Install psycopg2 driver
3. Modify any SQLite-specific syntax
4. Update auto-increment to SERIAL type
5. Adjust datetime handling if needed

### Schema Evolution
- Use Flask-Migrate for database migrations
- Version control schema changes
- Backup data before major schema updates
- Test migrations on development data first

---

This schema provides a solid foundation for a scalable quiz application with proper data integrity and performance characteristics.

