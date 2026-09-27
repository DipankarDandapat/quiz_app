from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from backend.models.models import User, Exam, Subject, QuizTest, TestResult, UserAnswer, Question, get_db
from backend.session import require_login
from datetime import datetime, timedelta

router = APIRouter()


@router.get("/my-activity")
def get_my_activity(request: Request, page: int = 1, per_page: int = 10, db: Session = Depends(get_db)):
    session = require_login(request)
    user_id = session["user_id"]
    offset = (page - 1) * per_page

    total_tests = db.query(TestResult).filter_by(user_id=user_id).filter(TestResult.completed_at.isnot(None)).count()

    avg_score_result = db.query(func.avg(TestResult.score * 100.0 / TestResult.total_questions))\
        .filter_by(user_id=user_id).filter(TestResult.completed_at.isnot(None)).scalar()
    avg_score = round(avg_score_result, 2) if avg_score_result else 0

    total_correct = db.query(func.sum(TestResult.score))\
        .filter_by(user_id=user_id).filter(TestResult.completed_at.isnot(None)).scalar() or 0

    total_time = db.query(func.sum(TestResult.time_taken_seconds))\
        .filter_by(user_id=user_id).filter(TestResult.completed_at.isnot(None)).scalar() or 0
    total_time_minutes = round(total_time / 60, 2)

    paginated = db.query(TestResult, QuizTest, Subject, Exam)\
        .join(QuizTest, TestResult.quiz_test_id == QuizTest.id)\
        .join(Subject, QuizTest.subject_id == Subject.id)\
        .join(Exam, Subject.exam_id == Exam.id)\
        .filter(TestResult.user_id == user_id, TestResult.completed_at.isnot(None))\
        .order_by(desc(TestResult.completed_at)).offset(offset).limit(per_page).all()

    recent_activity = []
    for tr, qt, sub, exam in paginated:
        d = tr.to_dict()
        d["quiz_test"] = qt.to_dict()
        d["subject"] = sub.to_dict()
        d["exam"] = exam.to_dict()
        recent_activity.append(d)

    subject_perf = db.query(
        Subject.name, Subject.id,
        func.count(TestResult.id).label("tests_taken"),
        func.avg(TestResult.score * 100.0 / TestResult.total_questions).label("avg_pct"),
        func.sum(TestResult.score).label("correct"),
        func.sum(TestResult.total_questions).label("total_q")
    ).join(QuizTest, Subject.id == QuizTest.subject_id)\
     .join(TestResult, QuizTest.id == TestResult.quiz_test_id)\
     .filter(TestResult.user_id == user_id, TestResult.completed_at.isnot(None))\
     .group_by(Subject.id, Subject.name).all()

    subject_stats = [{
        "subject_name": r[0], "subject_id": r[1], "tests_taken": r[2],
        "average_percentage": round(r[3], 2) if r[3] else 0,
        "correct_answers": r[4] or 0, "total_questions": r[5] or 0
    } for r in subject_perf]

    six_months_ago = datetime.utcnow() - timedelta(days=180)
    monthly = db.query(
        func.strftime("%Y-%m", TestResult.completed_at).label("month"),
        func.count(TestResult.id).label("tests_count"),
        func.avg(TestResult.score * 100.0 / TestResult.total_questions).label("avg_score")
    ).filter(TestResult.user_id == user_id, TestResult.completed_at >= six_months_ago,
             TestResult.completed_at.isnot(None))\
     .group_by(func.strftime("%Y-%m", TestResult.completed_at)).all()

    monthly_stats = [{"month": r[0], "tests_count": r[1], "average_score": round(r[2], 2) if r[2] else 0} for r in monthly]

    return {
        "summary": {"total_tests": total_tests, "average_score": avg_score,
                    "total_time_minutes": total_time_minutes, "correct_answers": total_correct},
        "recent_activity": recent_activity,
        "subject_performance": subject_stats,
        "monthly_activity": monthly_stats,
        "pagination": {"page": page, "per_page": per_page,
                       "total_pages": (total_tests + per_page - 1) // per_page, "total_items": total_tests},
    }


def _leaderboard_rows(db, since=None):
    q = db.query(
        User.username, User.id,
        func.count(TestResult.id).label("tests_taken"),
        func.avg(TestResult.score * 100.0 / TestResult.total_questions).label("avg_pct"),
        func.sum(TestResult.time_taken_seconds).label("total_time")
    ).join(TestResult, User.id == TestResult.user_id)\
     .filter(TestResult.completed_at.isnot(None))
    if since:
        q = q.filter(TestResult.completed_at >= since)
    rows = q.group_by(User.id, User.username)\
            .having(func.count(TestResult.id) >= 1)\
            .order_by(desc("avg_pct")).limit(20).all()
    return [{
        "rank": i + 1, "username": r[0], "user_id": r[1], "tests_taken": r[2],
        "average_percentage": round(r[3], 2) if r[3] else 0,
        "total_time_minutes": round((r[4] or 0) / 60, 2)
    } for i, r in enumerate(rows)]


@router.get("/leaderboard")
def get_leaderboard(request: Request, db: Session = Depends(get_db)):
    require_login(request)
    return _leaderboard_rows(db)


@router.get("/leaderboard/monthly")
def get_leaderboard_monthly(request: Request, db: Session = Depends(get_db)):
    require_login(request)
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    return _leaderboard_rows(db, since=month_start)


@router.get("/leaderboard/weekly")
def get_leaderboard_weekly(request: Request, db: Session = Depends(get_db)):
    require_login(request)
    week_start = datetime.utcnow() - timedelta(days=7)
    return _leaderboard_rows(db, since=week_start)


@router.get("/statistics")
def get_statistics(request: Request, db: Session = Depends(get_db)):
    require_login(request)
    popular = db.query(Subject.name, Subject.id, func.count(TestResult.id).label("cnt"))\
        .join(QuizTest, Subject.id == QuizTest.subject_id)\
        .join(TestResult, QuizTest.id == TestResult.quiz_test_id)\
        .filter(TestResult.completed_at.isnot(None))\
        .group_by(Subject.id, Subject.name).order_by(desc("cnt")).limit(10).all()

    recent = db.query(User.username, TestResult.completed_at, QuizTest.name, Subject.name,
                      TestResult.score, TestResult.total_questions)\
        .join(User, TestResult.user_id == User.id)\
        .join(QuizTest, TestResult.quiz_test_id == QuizTest.id)\
        .join(Subject, QuizTest.subject_id == Subject.id)\
        .filter(TestResult.completed_at.isnot(None))\
        .order_by(desc(TestResult.completed_at)).limit(20).all()

    return {
        "platform_stats": {
            "total_users": db.query(User).count(),
            "total_exams": db.query(Exam).filter_by(is_active=True).count(),
            "total_subjects": db.query(Subject).filter_by(is_active=True).count(),
            "total_quiz_tests": db.query(QuizTest).filter_by(is_active=True).count(),
            "total_questions": db.query(Question).filter_by(is_active=True).count(),
            "total_tests_taken": db.query(TestResult).filter(TestResult.completed_at.isnot(None)).count(),
        },
        "popular_subjects": [{"subject_name": r[0], "subject_id": r[1], "tests_count": r[2]} for r in popular],
        "recent_activity": [{
            "username": r[0],
            "completed_at": r[1].isoformat() if r[1] else None,
            "quiz_name": r[2], "subject_name": r[3], "score": r[4], "total_questions": r[5],
            "percentage": round((r[4] / r[5]) * 100, 2) if r[5] > 0 else 0
        } for r in recent],
    }


@router.get("/subject/{subject_id}/statistics")
def get_subject_statistics(subject_id: int, request: Request, db: Session = Depends(get_db)):
    session = require_login(request)
    user_id = session["user_id"]
    subject = db.query(Subject).get(subject_id)
    if not subject:
        return {"error": "Not found"}, 404

    user_tests = db.query(TestResult, QuizTest)\
        .join(QuizTest, TestResult.quiz_test_id == QuizTest.id)\
        .filter(TestResult.user_id == user_id, QuizTest.subject_id == subject_id,
                TestResult.completed_at.isnot(None))\
        .order_by(desc(TestResult.completed_at)).all()

    total_score = sum(tr.score for tr, _ in user_tests)
    total_q = sum(tr.total_questions for tr, _ in user_tests)
    user_avg = round((total_score / total_q) * 100, 2) if total_q > 0 else 0

    subject_avg = db.query(func.avg(TestResult.score * 100.0 / TestResult.total_questions))\
        .join(QuizTest, TestResult.quiz_test_id == QuizTest.id)\
        .filter(QuizTest.subject_id == subject_id, TestResult.completed_at.isnot(None)).scalar()

    perf = []
    for tr, qt in user_tests:
        d = tr.to_dict()
        d["quiz_test"] = qt.to_dict()
        perf.append(d)

    return {
        "subject": subject.to_dict(),
        "user_performance": {"tests_taken": len(user_tests), "average_percentage": user_avg, "test_history": perf},
        "subject_average": round(subject_avg, 2) if subject_avg else 0,
        "available_quiz_tests": [qt.to_dict() for qt in db.query(QuizTest).filter_by(subject_id=subject_id, is_active=True).all()],
    }


@router.get("/test-results/{test_result_id}/details")
def get_test_result_details(test_result_id: int, request: Request, db: Session = Depends(get_db)):
    session = require_login(request)
    user_id = session["user_id"]

    row = db.query(TestResult, QuizTest, Subject, Exam)\
        .join(QuizTest, TestResult.quiz_test_id == QuizTest.id)\
        .join(Subject, QuizTest.subject_id == Subject.id)\
        .join(Exam, Subject.exam_id == Exam.id)\
        .filter(TestResult.id == test_result_id, TestResult.user_id == user_id).first()

    if not row:
        return {"error": "Test result not found"}, 404

    tr, qt, sub, exam = row
    answers = db.query(UserAnswer, Question)\
        .join(Question, UserAnswer.question_id == Question.id)\
        .filter(UserAnswer.test_result_id == test_result_id)\
        .order_by(Question.id).all()

    qwa = []
    for ua, q in answers:
        qwa.append({
            "question": {**q.to_dict(), "correct_answer": q.correct_answer},
            "selected_answer": ua.selected_answer,
            "is_correct": ua.is_correct,
            "is_flagged": bool(ua.is_flagged),
            "answered_at": ua.answered_at.isoformat() if ua.answered_at else None,
        })

    result = tr.to_dict()
    result["quiz_test"] = qt.to_dict()
    result["subject"] = sub.to_dict()
    result["exam"] = exam.to_dict()
    result["questions_with_answers"] = qwa
    return result
