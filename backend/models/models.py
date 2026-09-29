from sqlalchemy import create_engine, Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float, select, func, Index
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import os

_db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'database', 'app.db'))
DATABASE_URL = f"sqlite:///{_db_path}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class User(Base):
    __tablename__ = "user"
    id = Column(Integer, primary_key=True)
    username = Column(String(80), unique=True, nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    phone = Column(String(20), nullable=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=False)
    user_type = Column(String(20), default="member")
    global_extra_attempts = Column(Integer, default=0, nullable=False)
    test_results = relationship("TestResult", back_populates="user")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "phone": self.phone or '',
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "is_active": bool(self.is_active) if self.is_active is not None else False,
            "user_type": self.user_type,
            "global_extra_attempts": self.global_extra_attempts or 0,
        }


class Exam(Base):
    __tablename__ = "exam"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    subjects = relationship("Subject", back_populates="exam")

    def to_dict(self, total_questions=0, subject_count=None):
        try:
            created_at = self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None
        except Exception:
            created_at = None
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "created_at": created_at,
            "is_active": self.is_active,
            "subject_count": subject_count if subject_count is not None else len(self.subjects),
            "total_questions": total_questions,
        }


class Subject(Base):
    __tablename__ = "subject"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    exam_id = Column(Integer, ForeignKey("exam.id"), nullable=False)
    subject_type = Column(String(20), default="subject")
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    exam = relationship("Exam", back_populates="subjects")
    quiz_tests = relationship("QuizTest", back_populates="subject")

    def to_dict(self):
        total_time = sum(t.time_limit_minutes for t in self.quiz_tests if t.time_limit_minutes)
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "exam_id": self.exam_id,
            "subject_type": self.subject_type or "subject",
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "is_active": self.is_active,
            "quiz_test_count": len(self.quiz_tests),
            "total_time_minutes": total_time,
        }


class QuizTest(Base):
    __tablename__ = "quiz_test"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    subject_id = Column(Integer, ForeignKey("subject.id"), nullable=False)
    time_limit_minutes = Column(Integer, default=20)
    retake_limit = Column(Integer, default=1)
    shuffle_questions = Column(Boolean, default=False)
    shuffle_answers = Column(Boolean, default=False)
    marks_correct = Column(Float, default=1.0)
    marks_negative = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    subject = relationship("Subject", back_populates="quiz_tests")
    questions = relationship("Question", back_populates="quiz_test")
    test_results = relationship("TestResult", back_populates="quiz_test")

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
            "retake_limit": self.retake_limit,
            "shuffle_questions": bool(self.shuffle_questions),
            "shuffle_answers": bool(self.shuffle_answers),
            "marks_correct": self.marks_correct if self.marks_correct is not None else 1.0,
            "marks_negative": self.marks_negative if self.marks_negative is not None else 0.0,
        }


class Question(Base):
    __tablename__ = "question"
    id = Column(Integer, primary_key=True)
    question_text = Column(Text, nullable=False)
    option_a = Column(String(255), nullable=False)
    option_b = Column(String(255), nullable=False)
    option_c = Column(String(255), nullable=False)
    option_d = Column(String(255), nullable=False)
    correct_answer = Column(Text, nullable=False)
    explanation = Column(Text, nullable=True)
    quiz_test_id = Column(Integer, ForeignKey("quiz_test.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    quiz_test = relationship("QuizTest", back_populates="questions")
    user_answers = relationship("UserAnswer", back_populates="question")

    def to_dict(self):
        return {
            "id": self.id,
            "question_text": self.question_text,
            "option_a": self.option_a,
            "option_b": self.option_b,
            "option_c": self.option_c,
            "option_d": self.option_d,
            "explanation": self.explanation or None,
            "quiz_test_id": self.quiz_test_id,
            "is_active": self.is_active if self.is_active is not None else True,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def to_admin_dict(self):
        d = self.to_dict()
        d["correct_answer"] = self.correct_answer
        return d


class TestResult(Base):
    __tablename__ = "test_result"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    quiz_test_id = Column(Integer, ForeignKey("quiz_test.id"), nullable=False)
    score = Column(Integer, nullable=False)
    total_questions = Column(Integer, nullable=False)
    final_score = Column(Float, nullable=True)
    time_taken_seconds = Column(Integer, nullable=False)
    started_at = Column(DateTime, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    user = relationship("User", back_populates="test_results")
    quiz_test = relationship("QuizTest", back_populates="test_results")
    user_answers = relationship("UserAnswer", back_populates="test_result")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "quiz_test_id": self.quiz_test_id,
            "score": self.score,
            "total_questions": self.total_questions,
            "final_score": self.final_score,
            "percentage": round((self.score / self.total_questions) * 100, 2) if self.total_questions > 0 else 0,
            "time_taken_seconds": self.time_taken_seconds,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }


class UserAnswer(Base):
    __tablename__ = "user_answer"
    id = Column(Integer, primary_key=True)
    test_result_id = Column(Integer, ForeignKey("test_result.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("question.id"), nullable=False)
    selected_answer = Column(Text, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    is_flagged = Column(Boolean, default=False)
    answered_at = Column(DateTime, default=datetime.utcnow)
    test_result = relationship("TestResult", back_populates="user_answers")
    question = relationship("Question", back_populates="user_answers")

    def to_dict(self):
        return {
            "id": self.id,
            "test_result_id": self.test_result_id,
            "question_id": self.question_id,
            "selected_answer": self.selected_answer,
            "is_correct": self.is_correct,
            "is_flagged": bool(self.is_flagged),
            "answered_at": self.answered_at.isoformat() if self.answered_at else None,
        }


class UserTestLimit(Base):
    __tablename__ = "user_test_limit"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    quiz_test_id = Column(Integer, ForeignKey("quiz_test.id"), nullable=False)
    extra_attempts = Column(Integer, default=0, nullable=False)
    user = relationship("User")
    quiz_test = relationship("QuizTest")


Base.metadata.create_all(bind=engine)

# Indexes for common query patterns
Index("ix_subject_exam_id", Subject.exam_id, Subject.is_active)
Index("ix_quiz_test_subject_id", QuizTest.subject_id, QuizTest.is_active)
Index("ix_question_quiz_test_id", Question.quiz_test_id)
Index("ix_test_result_user_quiz", TestResult.user_id, TestResult.quiz_test_id)
Base.metadata.create_all(bind=engine)
