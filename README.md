# Quiz Portal

A full-featured quiz application with a **FastAPI** backend and **React + Vite** frontend.

---

## Project Structure

```
quiz_app/
├── backend/                        ← FastAPI backend
│   ├── models/
│   │   └── models.py               # SQLAlchemy database models
│   ├── routes/
│   │   ├── user.py                 # Auth endpoints
│   │   ├── exam.py                 # Exam / subject / question management
│   │   ├── quiz.py                 # Quiz taking endpoints
│   │   └── activity.py            # Activity, leaderboard, statistics
│   ├── main.py                     # FastAPI app entry point
│   ├── session.py                  # Cookie-based session (itsdangerous)
│   └── requirements.txt            # Python dependencies
│
├── frontend/                       ← React + Vite frontend
│   ├── src/
│   │   ├── pages/                  # All page components
│   │   ├── components/             # Shared components (Alert, Loading)
│   │   ├── api.js                  # Axios instance
│   │   ├── App.jsx                 # Root component
│   │   └── main.jsx                # Entry point
│   ├── index.html
│   ├── vite.config.js              # Vite config with /api proxy
│   └── package.json
│
├── start_backend.bat               ← One-click backend start (Windows)
├── start_frontend.bat              ← One-click frontend start (Windows)
└── README.md
```

---

## Requirements

### System
- Python **3.10+** (3.13 supported)
- Node.js **18+** and npm

### Backend Python packages
```
fastapi==0.111.0
uvicorn==0.30.0
sqlalchemy>=2.0.36
itsdangerous==2.2.0
werkzeug==3.0.3
python-multipart==0.0.9
```

### Frontend npm packages
```
react, react-dom, react-router-dom, axios
vite, @vitejs/plugin-react
```

---

## Setup & Installation

### Step 1 — Clone / Download the project
```bash
cd quiz_app
```

### Step 2 — Backend setup

```bash
# (Optional but recommended) Create a virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt
```

### Step 3 — Frontend setup

```bash
cd frontend
npm install
cd ..
```

That's it. The database (`backend/database/app.db`) already exists — no migration needed.

---

## Running the Project

You need **two terminals** running at the same time.

### Terminal 1 — Start Backend (FastAPI)

```bash
# From the quiz_app root folder
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend runs at: `http://localhost:8000`
Swagger API docs: `http://localhost:8000/docs`

---

### Terminal 2 — Start Frontend (Vite + React)

```bash
cd frontend
npm run dev
```

Frontend runs at: `http://localhost:5173`

> The Vite dev server automatically proxies all `/api` requests to `http://localhost:8000` — no CORS issues.

---

### One-click start (Windows)

Double-click `start_backend.bat` in one window, then `start_frontend.bat` in another.

---

## Test User Credentials

| Username | Password | Role |
|---|---|---|
| `testuser` | `password123` | Member |
| `alice_smith` | `password123` | Member |
| `bob_jones` | `password123` | Member |

> Admin accounts can be set via the User Settings panel (requires an existing admin user).

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/register` | Register new user |
| POST | `/api/login` | Login |
| POST | `/api/logout` | Logout |
| GET | `/api/check-auth` | Check session status |

### Exams & Subjects
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/exams` | List all active exams |
| GET | `/api/exams/{id}/subjects` | Subjects for an exam |
| GET | `/api/subjects/{id}/quiz-tests` | Quiz tests for a subject |

### Quiz
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/quiz-tests/{id}/start` | Start a quiz |
| GET | `/api/quiz-tests/{id}/questions` | Get questions (no answers) |
| POST | `/api/quiz-tests/{id}/submit-answer` | Submit one answer |
| POST | `/api/quiz-tests/{id}/submit` | Submit full quiz |

### Activity
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/my-activity` | User test history + stats |
| GET | `/api/leaderboard` | Top performers |
| GET | `/api/test-results/{id}/details` | Detailed result with answers |

### Quiz
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/quiz-tests/{id}/start` | Start a quiz |
| GET | `/api/quiz-tests/{id}/questions` | Get questions — shuffled if enabled |
| POST | `/api/quiz-tests/{id}/submit-answer` | Submit one answer (supports `is_flagged`) |
| POST | `/api/quiz-tests/{id}/flag-question` | Toggle flag on a question |
| POST | `/api/quiz-tests/{id}/submit` | Submit full quiz |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/users` | List all users (paginated) |
| PUT | `/api/admin/users/{id}` | Update user role / status |
| POST/PUT/DELETE | `/api/admin/exams` | Manage exams |
| POST/PUT/DELETE | `/api/admin/subjects` | Manage subjects |
| POST/PUT/DELETE | `/api/admin/quiz-tests` | Manage quiz tests (shuffle toggles) |
| POST/PUT/DELETE | `/api/admin/questions` | Manage questions |
| POST | `/api/admin/quiz-tests/{id}/upload-questions` | Bulk upload via CSV |
| GET | `/api/admin/questions/{id}/flag-details` | Per-user flag details for a question |

---

## Features

- User registration and login with password hashing
- Account activation by admin
- Timed MCQ quizzes with auto-submit on timeout
- Retake limit per quiz test (configurable)
- Detailed result view with correct/incorrect answer breakdown
- Activity dashboard with pagination
- Performance analytics by subject
- Leaderboard
- Admin panel: manage users, exams, subjects, tests, questions
- CSV bulk question upload
- Animated gradient background
- Fully responsive design
- Shuffle questions and shuffle answers per quiz test (admin toggle)
- Question flagging during quiz — persisted to DB, visible in result review and admin panel
- Day Streak tracking on dashboard
- Admin flag analytics — see which questions users flagged and who flagged them

---

## Database

The app uses **SQLite** stored at:
```
quiz_app/backend/database/app.db
```

### Tables
| Table | Description |
|---|---|
| `user` | User accounts |
| `exam` | Exam categories |
| `subject` | Subjects within exams |
| `quiz_test` | Individual quiz tests (includes `shuffle_questions`, `shuffle_answers` flags) |
| `question` | MCQ questions |
| `test_result` | User test attempts |
| `user_answer` | Per-question responses (includes `is_flagged` column) |

---

## Feature Details

### Shuffle Questions & Shuffle Answers
Configured per quiz test by admin via the edit (✏️) modal in Question Management.
- **Shuffle Questions** — every time a user starts the test, questions are served in a random order
- **Shuffle Answers** — the 4 options (A/B/C/D) for each question are randomized on every attempt
- Both are off by default. Enabled tests show 🔀 Q / 🔀 A badges on the test row in the admin tree
- Answer correctness is unaffected because `correct_answer` is stored as the option text value, not A/B/C/D label

### Question Flagging
Users can flag any question during a quiz by clicking the **Flag** button on the question card.
- Flags are stored in the `user_answer` table (`is_flagged` column) — persisted to DB immediately on toggle
- If a question has not been answered yet, the flag is tracked in frontend state and saved when the answer is submitted
- After submission, the result review shows a **Flagged** badge on flagged questions and a **"Flagged (N)"** filter button to show only flagged questions
- The Activity page Test History popup also shows the Flagged badge on relevant questions
- **Admin view** — in Question Management, each question row shows a yellow 🚩 N badge if it has been flagged. Clicking the badge opens a modal showing which users flagged it, what answer they selected, whether they got it right or wrong, and when they answered

### Day Streak
Shown on the Dashboard as a 🔥 stat card.
- Counts how many **consecutive calendar days** the user has completed at least one quiz
- The streak is not broken if the user hasn't taken a test yet today (yesterday counts as the most recent active day)
- Resets to 0 if there is a gap of more than one day between quiz completions
- Example: tests on Mon, Tue, Wed, Fri → streak is 1 (gap between Wed and Fri breaks it)

---

## Troubleshooting

**Port already in use**
```bash
# Kill process on port 8000 (Windows)
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Kill process on port 5173 (Windows)
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

**Module not found (Python)**
```bash
# Make sure virtual environment is activated
venv\Scripts\activate
pip install -r backend/requirements.txt
```

**npm install fails**
```bash
cd frontend
npm install --legacy-peer-deps
```

**Database not found**
```
The database file must exist at: backend/database/app.db
```

**Frontend shows blank page**
- Make sure the backend is running on port 8000 before opening the frontend
- Check browser console for errors

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend framework | FastAPI 0.111 |
| ASGI server | Uvicorn |
| ORM | SQLAlchemy 2.x |
| Database | SQLite |
| Session | itsdangerous (signed cookies) |
| Password hashing | Werkzeug |
| Frontend framework | React 19 |
| Build tool | Vite 8 |
| HTTP client | Axios |
| Routing | React Router DOM 7 |
| Icons | Font Awesome 6 |
