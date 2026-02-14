from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=False)  # New field - default to False

    # Relationships
    test_results = db.relationship("TestResult", backref="user", lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f"<User {self.username}>"

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "is_active": self.is_active  # This is the line you're adding
        }


class Exam(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

    # Relationships
    subjects = db.relationship("Subject", backref="exam", lazy=True)

    def __repr__(self):
        return f"<Exam {self.name}>"

    def to_dict(self):
        try:
            created_at = self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None
        except Exception as e:
            created_at = None  # or str(self.created_at) as fallback

        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'created_at': created_at,
            'is_active': self.is_active,
            'subject_count': len(self.subjects),
            'total_questions': self.get_total_questions()
        }

    def get_total_questions(self):
        """Calculate the total number of questions across all tests in this exam"""
        total = 0
        for subject in self.subjects:
            for quiz_test in subject.quiz_tests:
                total += len(quiz_test.questions)
        return total

class Subject(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    exam_id = db.Column(db.Integer, db.ForeignKey("exam.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

    # Relationships
    quiz_tests = db.relationship("QuizTest", backref="subject", lazy=True)

    def __repr__(self):
        return f"<Subject {self.name}>"

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "exam_id": self.exam_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "is_active": self.is_active,
            "quiz_test_count": len(self.quiz_tests),
            "total_time_minutes": self.get_total_time_minutes()
        }

    def get_total_time_minutes(self):
        """Calculate the total time in minutes across all tests in this subject"""
        return sum(test.time_limit_minutes for test in self.quiz_tests if test.time_limit_minutes)

class QuizTest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    subject_id = db.Column(db.Integer, db.ForeignKey("subject.id"), nullable=False)
    time_limit_minutes = db.Column(db.Integer, default=20)  # Default 20 minutes
    retake_limit = db.Column(db.Integer, default=1) # Default 1 retake
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

    # Relationships
    questions = db.relationship("Question", backref="quiz_test", lazy=True)
    test_results = db.relationship("TestResult", backref="quiz_test", lazy=True)

    def __repr__(self):
        return f"<QuizTest {self.name}>"

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "subject_id": self.subject_id,
            "time_limit_minutes": self.time_limit_minutes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "is_active": self.is_active,
            "question_count": len(self.questions),
            "retake_limit": self.retake_limit
        }


class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    question_text = db.Column(db.Text, nullable=False)
    option_a = db.Column(db.String(255), nullable=False)
    option_b = db.Column(db.String(255), nullable=False)
    option_c = db.Column(db.String(255), nullable=False)
    option_d = db.Column(db.String(255), nullable=False)
    correct_answer = db.Column(db.String(1), nullable=False)  # A, B, C, or D
    quiz_test_id = db.Column(db.Integer, db.ForeignKey("quiz_test.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user_answers = db.relationship("UserAnswer", backref="question", lazy=True)

    def __repr__(self):
        return f"<Question {self.id}>"

    def to_dict(self):
        return {
            "id": self.id,
            "question_text": self.question_text,
            "option_a": self.option_a,
            "option_b": self.option_b,
            "option_c": self.option_c,
            "option_d": self.option_d,
            "quiz_test_id": self.quiz_test_id,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class TestResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    quiz_test_id = db.Column(db.Integer, db.ForeignKey("quiz_test.id"), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    total_questions = db.Column(db.Integer, nullable=False)
    time_taken_seconds = db.Column(db.Integer, nullable=False)
    started_at = db.Column(db.DateTime, nullable=False)
    completed_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    user_answers = db.relationship("UserAnswer", backref="test_result", lazy=True)

    def __repr__(self):
        return f"<TestResult {self.id}>"

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "quiz_test_id": self.quiz_test_id,
            "score": self.score,
            "total_questions": self.total_questions,
            "percentage": round((self.score / self.total_questions) * 100, 2) if self.total_questions > 0 else 0,
            "time_taken_seconds": self.time_taken_seconds,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None
        }


class UserAnswer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    test_result_id = db.Column(db.Integer, db.ForeignKey("test_result.id"), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey("question.id"), nullable=False)
    selected_answer = db.Column(db.String(1), nullable=False)  # A, B, C, or D
    is_correct = db.Column(db.Boolean, nullable=False)
    answered_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<UserAnswer {self.id}>"

    def to_dict(self):
        return {
            "id": self.id,
            "test_result_id": self.test_result_id,
            "question_id": self.question_id,
            "selected_answer": self.selected_answer,
            "is_correct": self.is_correct,
            "answered_at": self.answered_at.isoformat() if self.answered_at else None
        }