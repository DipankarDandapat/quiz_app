from fastapi import APIRouter, Request, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from backend.models.models import Question, QuizTest, TestResult, UserAnswer, UserTestLimit, User, get_db
from backend.session import require_login, get_session, create_session, COOKIE_NAME
from datetime import datetime
import random

router = APIRouter()


@router.post("/quiz-tests/{quiz_test_id}/start")
def start_quiz_test(quiz_test_id: int, request: Request, db: Session = Depends(get_db)):
    session = require_login(request)
    user_id = session["user_id"]
    qt = db.query(QuizTest).get(quiz_test_id)
    if not qt or not qt.is_active:
        return JSONResponse({"error": "Quiz test not available"}, 404)

    retake_limit = qt.retake_limit or 1
    user_obj = db.query(User).get(user_id)
    global_extra = user_obj.global_extra_attempts if user_obj else 0
    user_limit = db.query(UserTestLimit).filter_by(user_id=user_id, quiz_test_id=quiz_test_id).first()
    test_extra = user_limit.extra_attempts if user_limit else 0
    effective_limit = retake_limit + global_extra + test_extra
    completed_count = db.query(TestResult).filter(
        TestResult.user_id == user_id,
        TestResult.quiz_test_id == quiz_test_id,
        TestResult.completed_at.isnot(None)
    ).count()
    if completed_count >= effective_limit:
        return JSONResponse({"error": f"You have reached your attempt limit ({effective_limit}) for this test."}, 400)

    questions = db.query(Question).filter_by(quiz_test_id=quiz_test_id, is_active=True).all()
    if not questions:
        return JSONResponse({"error": "No questions available for this test"}, 404)

    started_at = datetime.utcnow()
    test_result = TestResult(user_id=user_id, quiz_test_id=quiz_test_id, score=0,
                             total_questions=len(questions), time_taken_seconds=0,
                             started_at=started_at, completed_at=None)
    db.add(test_result)
    db.commit()
    db.refresh(test_result)

    # Store test state in session cookie
    new_session = dict(session)
    new_session[f"test_{quiz_test_id}_result_id"] = test_result.id
    new_session[f"test_{quiz_test_id}_started_at"] = started_at.isoformat()
    token = create_session(new_session)

    resp = JSONResponse({
        "message": "Quiz test started successfully",
        "test_result_id": test_result.id,
        "quiz_test": qt.to_dict(),
        "total_questions": len(questions),
        "time_limit_minutes": qt.time_limit_minutes,
        "started_at": started_at.isoformat(),
    })
    resp.set_cookie(COOKIE_NAME, token, httponly=True, samesite="lax", max_age=86400 * 7)
    return resp


@router.get("/quiz-tests/{quiz_test_id}/questions")
def get_quiz_questions(quiz_test_id: int, request: Request, db: Session = Depends(get_db)):
    session = require_login(request)
    if f"test_{quiz_test_id}_result_id" not in session:
        return JSONResponse({"error": "Test not started. Please start the test first."}, 400)
    qt = db.query(QuizTest).get(quiz_test_id)
    if not qt or not qt.is_active:
        return JSONResponse({"error": "Quiz test not available"}, 404)
    questions = db.query(Question).filter_by(quiz_test_id=quiz_test_id, is_active=True).all()
    if qt.shuffle_questions:
        random.shuffle(questions)
    questions_data = [q.to_dict() for q in questions]
    for q in questions_data:
        q.pop("correct_answer", None)
    if qt.shuffle_answers:
        for q in questions_data:
            opts = [q["option_a"], q["option_b"], q["option_c"], q["option_d"]]
            random.shuffle(opts)
            q["option_a"], q["option_b"], q["option_c"], q["option_d"] = opts
    return {"questions": questions_data, "quiz_test": qt.to_dict()}


@router.post("/quiz-tests/{quiz_test_id}/submit-answer")
def submit_answer(quiz_test_id: int, request: Request, db: Session = Depends(get_db)):
    session = require_login(request)
    data = request.state.body
    if not data or "question_id" not in data or "selected_answer" not in data:
        return JSONResponse({"error": "Question ID and selected answer are required"}, 400)
    if f"test_{quiz_test_id}_result_id" not in session:
        return JSONResponse({"error": "Test not started. Please start the test first."}, 400)

    test_result_id = session[f"test_{quiz_test_id}_result_id"]
    test_result = db.query(TestResult).get(test_result_id)
    if not test_result:
        return JSONResponse({"error": "Test session not found"}, 404)
    if test_result.completed_at:
        return JSONResponse({"error": "Test already completed"}, 400)

    question = db.query(Question).get(data["question_id"])
    if not question or question.quiz_test_id != quiz_test_id:
        return JSONResponse({"error": "Invalid question"}, 404)

    existing = db.query(UserAnswer).filter_by(test_result_id=test_result_id, question_id=data["question_id"]).first()
    is_correct = data["selected_answer"].strip().lower() == question.correct_answer.strip().lower()
    is_flagged = bool(data.get("is_flagged", existing.is_flagged if existing else False))
    if existing:
        existing.selected_answer = data["selected_answer"]
        existing.is_correct = is_correct
        existing.is_flagged = is_flagged
        existing.answered_at = datetime.utcnow()
    else:
        db.add(UserAnswer(test_result_id=test_result_id, question_id=data["question_id"],
                          selected_answer=data["selected_answer"], is_correct=is_correct, is_flagged=is_flagged))
    db.commit()
    return {"message": "Answer submitted successfully"}


@router.post("/quiz-tests/{quiz_test_id}/flag-question")
def flag_question(quiz_test_id: int, request: Request, db: Session = Depends(get_db)):
    session = require_login(request)
    data = request.state.body
    if not data or "question_id" not in data or "is_flagged" not in data:
        return JSONResponse({"error": "question_id and is_flagged are required"}, 400)
    if f"test_{quiz_test_id}_result_id" not in session:
        return JSONResponse({"error": "Test not started"}, 400)
    test_result_id = session[f"test_{quiz_test_id}_result_id"]
    existing = db.query(UserAnswer).filter_by(test_result_id=test_result_id, question_id=data["question_id"]).first()
    if existing:
        existing.is_flagged = bool(data["is_flagged"])
        db.commit()
    return {"message": "Flag updated"}


@router.post("/quiz-tests/{quiz_test_id}/submit")
def submit_quiz_test(quiz_test_id: int, request: Request, db: Session = Depends(get_db)):
    session = require_login(request)
    key_id = f"test_{quiz_test_id}_result_id"
    key_at = f"test_{quiz_test_id}_started_at"
    if key_id not in session or key_at not in session:
        return JSONResponse({"error": "Test not started. Please start the test first."}, 400)

    test_result = db.query(TestResult).get(session[key_id])
    if not test_result:
        return JSONResponse({"error": "Test session not found"}, 404)
    if test_result.completed_at:
        return JSONResponse({"error": "Test already completed"}, 400)

    started_at = datetime.fromisoformat(session[key_at])
    completed_at = datetime.utcnow()
    time_taken_seconds = int((completed_at - started_at).total_seconds())
    correct_answers = db.query(UserAnswer).filter_by(test_result_id=test_result.id, is_correct=True).count()
    incorrect_answers = db.query(UserAnswer).filter_by(test_result_id=test_result.id, is_correct=False).count()

    qt = db.query(QuizTest).get(test_result.quiz_test_id)
    marks_correct = qt.marks_correct if qt and qt.marks_correct is not None else 1.0
    marks_negative = qt.marks_negative if qt and qt.marks_negative is not None else 0.0
    final_score = round(correct_answers * marks_correct - incorrect_answers * marks_negative, 2) if marks_negative > 0 else None

    test_result.score = correct_answers
    test_result.final_score = final_score
    test_result.time_taken_seconds = time_taken_seconds
    test_result.completed_at = completed_at
    db.commit()

    new_session = {k: v for k, v in session.items() if k not in (key_id, key_at)}
    token = create_session(new_session)
    resp = JSONResponse({"message": "Quiz test submitted successfully", "result": test_result.to_dict()})
    resp.set_cookie(COOKIE_NAME, token, httponly=True, samesite="lax", max_age=86400 * 7)
    return resp


@router.get("/quiz-tests/{quiz_test_id}/status")
def get_quiz_test_status(quiz_test_id: int, request: Request, db: Session = Depends(get_db)):
    session = require_login(request)
    key_id = f"test_{quiz_test_id}_result_id"
    key_at = f"test_{quiz_test_id}_started_at"
    if key_id not in session or key_at not in session:
        return {"started": False, "message": "Test not started"}

    test_result = db.query(TestResult).get(session[key_id])
    if not test_result:
        return JSONResponse({"error": "Test session not found"}, 404)
    if test_result.completed_at:
        return {"started": True, "completed": True, "result": test_result.to_dict()}

    started_at = datetime.fromisoformat(session[key_at])
    qt = db.query(QuizTest).get(quiz_test_id)
    time_limit_seconds = qt.time_limit_minutes * 60
    elapsed = int((datetime.utcnow() - started_at).total_seconds())
    remaining = max(0, time_limit_seconds - elapsed)
    answered = db.query(UserAnswer).filter_by(test_result_id=test_result.id).count()
    return {
        "started": True, "completed": False,
        "test_result_id": test_result.id,
        "elapsed_seconds": elapsed, "remaining_seconds": remaining,
        "time_limit_seconds": time_limit_seconds,
        "answered_count": answered, "total_questions": test_result.total_questions,
        "auto_submit": remaining <= 0,
    }


@router.get("/test-results/{result_id}")
def get_test_result(result_id: int, request: Request, db: Session = Depends(get_db)):
    session = require_login(request)
    test_result = db.query(TestResult).get(result_id)
    if not test_result or test_result.user_id != session["user_id"]:
        return JSONResponse({"error": "Unauthorized"}, 403)
    answers = db.query(UserAnswer, Question).join(Question, UserAnswer.question_id == Question.id)\
        .filter(UserAnswer.test_result_id == result_id).all()
    answers_data = []
    for ua, q in answers:
        d = ua.to_dict()
        d["question"] = q.to_dict()
        answers_data.append(d)
    qt = db.query(QuizTest).get(test_result.quiz_test_id)
    return {"test_result": test_result.to_dict(), "quiz_test": qt.to_dict() if qt else None, "answers": answers_data}


@router.get("/my-results")
def get_my_results(request: Request, db: Session = Depends(get_db)):
    session = require_login(request)
    user_id = session["user_id"]
    rows = db.query(TestResult, QuizTest).join(QuizTest, TestResult.quiz_test_id == QuizTest.id)\
        .filter(TestResult.user_id == user_id, TestResult.completed_at.isnot(None))\
        .order_by(TestResult.completed_at.desc()).all()
    results = []
    for tr, qt in rows:
        d = tr.to_dict()
        d["quiz_test"] = qt.to_dict()
        results.append(d)
    return results
