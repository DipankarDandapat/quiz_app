# API Documentation

## Overview

The Quiz Portal API is a RESTful web service built with Flask that provides endpoints for user authentication, exam management, quiz functionality, and activity tracking. All endpoints return JSON responses and use standard HTTP status codes.

## Base URL
```
http://localhost:5000/api
```

## Authentication

The API uses session-based authentication. Users must login to access protected endpoints. Session cookies are automatically managed by the browser.

### Session Management
- Sessions are stored server-side
- Session cookies are HTTP-only for security
- Sessions expire when the browser is closed
- No token-based authentication required

## Response Format

### Success Response
```json
{
    "success": true,
    "data": { ... },
    "message": "Operation completed successfully"
}
```

### Error Response
```json
{
    "success": false,
    "error": "Error description",
    "message": "User-friendly error message"
}
```

## HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `500 Internal Server Error` - Server error

---

## Authentication Endpoints

### Register User
Create a new user account.

**Endpoint:** `POST /api/register`

**Request Body:**
```json
{
    "username": "string (required, 3-80 chars)",
    "email": "string (required, valid email)",
    "password": "string (required, min 6 chars)"
}
```

**Response (201 Created):**
```json
{
    "success": true,
    "message": "User registered successfully",
    "data": {
        "user_id": 1,
        "username": "testuser",
        "email": "test@example.com"
    }
}
```

**Error Responses:**
- `400` - Invalid input data
- `409` - Username or email already exists

**Example:**
```bash
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "newuser@example.com",
    "password": "password123"
  }'
```

### Login User
Authenticate user and create session.

**Endpoint:** `POST /api/login`

**Request Body:**
```json
{
    "username": "string (required)",
    "password": "string (required)"
}
```

**Response (200 OK):**
```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "user_id": 1,
        "username": "testuser",
        "email": "test@example.com"
    }
}
```

**Error Responses:**
- `400` - Missing username or password
- `401` - Invalid credentials

**Example:**
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

### Logout User
End user session.

**Endpoint:** `POST /api/logout`

**Authentication:** Required

**Response (200 OK):**
```json
{
    "success": true,
    "message": "Logged out successfully"
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/logout \
  -b cookies.txt
```

### Check Authentication
Verify if user is authenticated.

**Endpoint:** `GET /api/check-auth`

**Response (200 OK):**
```json
{
    "authenticated": true,
    "user": {
        "user_id": 1,
        "username": "testuser",
        "email": "test@example.com"
    }
}
```

**Response (Unauthenticated):**
```json
{
    "authenticated": false,
    "user": null
}
```

---

## Exam Management Endpoints

### Get All Exams
Retrieve list of all available exams.

**Endpoint:** `GET /api/exams`

**Authentication:** Required

**Response (200 OK):**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "Computer Science Fundamentals",
            "description": "Basic concepts in computer science including programming, algorithms, and data structures",
            "created_at": "2025-06-22T00:00:00"
        },
        {
            "id": 2,
            "name": "Mathematics for Engineers",
            "description": "Essential mathematical concepts for engineering students",
            "created_at": "2025-06-22T00:00:00"
        }
    ]
}
```

**Example:**
```bash
curl -X GET http://localhost:5000/api/exams \
  -b cookies.txt
```

### Get Subjects for Exam
Retrieve subjects within a specific exam.

**Endpoint:** `GET /api/exams/{exam_id}/subjects`

**Authentication:** Required

**Path Parameters:**
- `exam_id` (integer) - ID of the exam

**Response (200 OK):**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "Python Programming",
            "description": "Learn Python programming basics",
            "exam_id": 1,
            "created_at": "2025-06-22T00:00:00"
        },
        {
            "id": 2,
            "name": "Data Structures",
            "description": "Arrays, lists, trees, and graphs",
            "exam_id": 1,
            "created_at": "2025-06-22T00:00:00"
        }
    ]
}
```

**Error Responses:**
- `404` - Exam not found

**Example:**
```bash
curl -X GET http://localhost:5000/api/exams/1/subjects \
  -b cookies.txt
```

### Get Quiz Tests for Subject
Retrieve quiz tests within a specific subject.

**Endpoint:** `GET /api/subjects/{subject_id}/quiz-tests`

**Authentication:** Required

**Path Parameters:**
- `subject_id` (integer) - ID of the subject

**Response (200 OK):**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "Python Basics",
            "description": "Variables, data types, and basic operations",
            "subject_id": 1,
            "time_limit_minutes": 15,
            "question_count": 5,
            "created_at": "2025-06-22T00:00:00"
        },
        {
            "id": 2,
            "name": "Python Functions",
            "description": "Function definition and usage",
            "subject_id": 1,
            "time_limit_minutes": 20,
            "question_count": 3,
            "created_at": "2025-06-22T00:00:00"
        }
    ]
}
```

**Error Responses:**
- `404` - Subject not found

**Example:**
```bash
curl -X GET http://localhost:5000/api/subjects/1/quiz-tests \
  -b cookies.txt
```

---

## Quiz Test Endpoints

### Start Quiz Test
Begin a new quiz test session.

**Endpoint:** `POST /api/quiz-tests/{test_id}/start`

**Authentication:** Required

**Path Parameters:**
- `test_id` (integer) - ID of the quiz test

**Response (200 OK):**
```json
{
    "success": true,
    "message": "Quiz started successfully",
    "data": {
        "test_result_id": 123,
        "quiz_test_id": 1,
        "time_limit_minutes": 15,
        "started_at": "2025-06-22T15:30:00",
        "total_questions": 5
    }
}
```

**Error Responses:**
- `400` - Test already completed by user
- `404` - Quiz test not found

**Example:**
```bash
curl -X POST http://localhost:5000/api/quiz-tests/1/start \
  -b cookies.txt
```

### Get Quiz Questions
Retrieve questions for a quiz test.

**Endpoint:** `GET /api/quiz-tests/{test_id}/questions`

**Authentication:** Required

**Path Parameters:**
- `test_id` (integer) - ID of the quiz test

**Response (200 OK):**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "question_text": "What is the correct way to declare a variable in Python?",
            "option_a": "var x = 5",
            "option_b": "x = 5",
            "option_c": "int x = 5",
            "option_d": "declare x = 5"
        },
        {
            "id": 2,
            "question_text": "Which of the following is a mutable data type in Python?",
            "option_a": "tuple",
            "option_b": "string",
            "option_c": "list",
            "option_d": "integer"
        }
    ]
}
```

**Note:** Correct answers are not included in the response for security.

**Error Responses:**
- `404` - Quiz test not found
- `403` - Test not started or already completed

**Example:**
```bash
curl -X GET http://localhost:5000/api/quiz-tests/1/questions \
  -b cookies.txt
```

### Submit Answer
Submit an answer for a specific question.

**Endpoint:** `POST /api/quiz-tests/{test_id}/submit-answer`

**Authentication:** Required

**Path Parameters:**
- `test_id` (integer) - ID of the quiz test

**Request Body:**
```json
{
    "question_id": 1,
    "selected_answer": "B"
}
```

**Response (200 OK):**
```json
{
    "success": true,
    "message": "Answer submitted successfully",
    "data": {
        "question_id": 1,
        "selected_answer": "B",
        "is_correct": true
    }
}
```

**Error Responses:**
- `400` - Invalid question ID or answer
- `404` - Quiz test not found
- `403` - Test not started or already completed

**Example:**
```bash
curl -X POST http://localhost:5000/api/quiz-tests/1/submit-answer \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "question_id": 1,
    "selected_answer": "B"
  }'
```

### Submit Quiz Test
Complete and submit the entire quiz test.

**Endpoint:** `POST /api/quiz-tests/{test_id}/submit`

**Authentication:** Required

**Path Parameters:**
- `test_id` (integer) - ID of the quiz test

**Response (200 OK):**
```json
{
    "success": true,
    "message": "Quiz submitted successfully",
    "data": {
        "test_result_id": 123,
        "score": 4,
        "total_questions": 5,
        "percentage": 80.0,
        "time_taken_seconds": 720,
        "completed_at": "2025-06-22T15:42:00"
    }
}
```

**Error Responses:**
- `400` - Test not started or already completed
- `404` - Quiz test not found

**Example:**
```bash
curl -X POST http://localhost:5000/api/quiz-tests/1/submit \
  -b cookies.txt
```

---

## Activity & Analytics Endpoints

### Get User Activity
Retrieve user's test history and performance statistics.

**Endpoint:** `GET /api/my-activity`

**Authentication:** Required

**Response (200 OK):**
```json
{
    "success": true,
    "data": {
        "statistics": {
            "total_tests": 3,
            "average_score": 85.5,
            "total_time_minutes": 45
        },
        "recent_tests": [
            {
                "id": 2,
                "test_name": "World Capitals",
                "subject_name": "Geography",
                "exam_name": "General Knowledge Quiz",
                "score": 5,
                "total_questions": 5,
                "percentage": 100.0,
                "time_taken_seconds": 480,
                "completed_at": "2025-06-21T14:08:00"
            },
            {
                "id": 1,
                "test_name": "Python Basics",
                "subject_name": "Python Programming",
                "exam_name": "Computer Science Fundamentals",
                "score": 4,
                "total_questions": 5,
                "percentage": 80.0,
                "time_taken_seconds": 720,
                "completed_at": "2025-06-20T15:12:00"
            }
        ],
        "subject_performance": [
            {
                "subject_name": "Python Programming",
                "tests_taken": 2,
                "average_percentage": 75.0
            },
            {
                "subject_name": "Geography",
                "tests_taken": 1,
                "average_percentage": 100.0
            }
        ]
    }
}
```

**Example:**
```bash
curl -X GET http://localhost:5000/api/my-activity \
  -b cookies.txt
```

### Get Leaderboard
Retrieve leaderboard data showing top performers.

**Endpoint:** `GET /api/leaderboard`

**Authentication:** Required

**Query Parameters:**
- `test_id` (optional) - Filter by specific test
- `limit` (optional) - Number of results (default: 10)

**Response (200 OK):**
```json
{
    "success": true,
    "data": [
        {
            "rank": 1,
            "username": "alice_smith",
            "total_tests": 5,
            "average_percentage": 92.5,
            "total_time_minutes": 85
        },
        {
            "rank": 2,
            "username": "testuser",
            "total_tests": 3,
            "average_percentage": 85.5,
            "total_time_minutes": 45
        },
        {
            "rank": 3,
            "username": "bob_jones",
            "total_tests": 4,
            "average_percentage": 78.2,
            "total_time_minutes": 92
        }
    ]
}
```

**Example:**
```bash
curl -X GET http://localhost:5000/api/leaderboard \
  -b cookies.txt

# Filter by specific test
curl -X GET "http://localhost:5000/api/leaderboard?test_id=1&limit=5" \
  -b cookies.txt
```

---

## Error Handling

### Common Error Responses

**Authentication Required (401):**
```json
{
    "success": false,
    "error": "Authentication required",
    "message": "Please login to access this resource"
}
```

**Resource Not Found (404):**
```json
{
    "success": false,
    "error": "Resource not found",
    "message": "The requested resource could not be found"
}
```

**Validation Error (400):**
```json
{
    "success": false,
    "error": "Validation failed",
    "message": "Invalid input data",
    "details": {
        "username": "Username is required",
        "email": "Invalid email format"
    }
}
```

**Server Error (500):**
```json
{
    "success": false,
    "error": "Internal server error",
    "message": "An unexpected error occurred"
}
```

## Rate Limiting

Currently, no rate limiting is implemented. For production use, consider implementing:
- Request rate limiting per IP/user
- Quiz attempt frequency limits
- Session timeout management

## CORS Configuration

The API supports Cross-Origin Resource Sharing (CORS) for all origins:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`
- `Access-Control-Allow-Credentials: true`

## Testing the API

### Using cURL
```bash
# Login and save session
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"username": "testuser", "password": "password123"}'

# Use session for subsequent requests
curl -X GET http://localhost:5000/api/exams \
  -b cookies.txt
```

### Using JavaScript (Frontend)
```javascript
// Login
const loginResponse = await fetch('/api/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    credentials: 'include', // Important for session cookies
    body: JSON.stringify({
        username: 'testuser',
        password: 'password123'
    })
});

// Subsequent requests automatically include session cookie
const examsResponse = await fetch('/api/exams', {
    credentials: 'include'
});
```

### Using Python Requests
```python
import requests

# Create session to maintain cookies
session = requests.Session()

# Login
login_data = {
    'username': 'testuser',
    'password': 'password123'
}
response = session.post('http://localhost:5000/api/login', json=login_data)

# Use session for subsequent requests
exams = session.get('http://localhost:5000/api/exams')
print(exams.json())
```

## API Versioning

Currently, the API is version 1 and uses URL path versioning:
- Base path: `/api/`
- Future versions: `/api/v2/`, `/api/v3/`, etc.

## Security Considerations

### Authentication Security
- Passwords are hashed using Werkzeug's secure password hashing
- Sessions are stored server-side with secure cookies
- No sensitive data exposed in API responses

### Input Validation
- All input data is validated before processing
- SQL injection prevention through SQLAlchemy ORM
- XSS prevention through proper data handling

### Best Practices
- Use HTTPS in production
- Implement request rate limiting
- Add API key authentication for external access
- Log security events and failed authentication attempts
- Regular security audits and dependency updates

---

This API documentation provides comprehensive information for integrating with the Quiz Portal backend. For additional support or questions, refer to the main README.md file.

