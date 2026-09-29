from fastapi import APIRouter, Request, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.models.models import Exam, Subject, QuizTest, Question, UserTestLimit, UserAnswer, TestResult, get_db
from backend.models.models import User
from backend.session import require_login

router = APIRouter()


@router.get("/exams")
def get_exams(request: Request, db: Session = Depends(get_db)):
    require_login(request)
    exams = db.query(Exam).filter_by(is_active=True).all()
    # Single query to get total questions per exam
    counts = db.query(Subject.exam_id, func.count(Question.id))\
        .join(QuizTest, QuizTest.subject_id == Subject.id)\
        .join(Question, Question.quiz_test_id == QuizTest.id)\
        .filter(Subject.exam_id.in_([e.id for e in exams]))\
        .group_by(Subject.exam_id).all()
    q_count = {exam_id: cnt for exam_id, cnt in counts}
    # Single query for subject counts
    s_counts = db.query(Subject.exam_id, func.count(Subject.id))\
        .filter(Subject.exam_id.in_([e.id for e in exams]))\
        .group_by(Subject.exam_id).all()
    s_count = {exam_id: cnt for exam_id, cnt in s_counts}
    return [e.to_dict(total_questions=q_count.get(e.id, 0), subject_count=s_count.get(e.id, 0)) for e in exams]


@router.get("/exams/{exam_id}")
def get_exam(exam_id: int, request: Request, db: Session = Depends(get_db)):
    require_login(request)
    exam = db.query(Exam).get(exam_id)
    if not exam or not exam.is_active:
        return JSONResponse({"error": "Exam not available"}, 404)
    return exam.to_dict()


@router.get("/exams/{exam_id}/subjects")
def get_exam_subjects(exam_id: int, request: Request, db: Session = Depends(get_db)):
    require_login(request)
    exam = db.query(Exam).get(exam_id)
    if not exam or not exam.is_active:
        return JSONResponse({"error": "Exam not available"}, 404)
    return [s.to_dict() for s in db.query(Subject).filter_by(exam_id=exam_id, is_active=True).all()]


@router.get("/subjects/{subject_id}")
def get_subject(subject_id: int, request: Request, db: Session = Depends(get_db)):
    require_login(request)
    subject = db.query(Subject).get(subject_id)
    if not subject or not subject.is_active:
        return JSONResponse({"error": "Subject not available"}, 404)
    return subject.to_dict()


@router.get("/subjects/{subject_id}/quiz-tests")
def get_subject_quiz_tests(subject_id: int, request: Request, db: Session = Depends(get_db)):
    require_login(request)
    session_data = require_login(request)
    user_id = session_data["user_id"]
    subject = db.query(Subject).get(subject_id)
    if not subject or not subject.is_active:
        return JSONResponse({"error": "Subject not available"}, 404)
    tests = db.query(QuizTest).filter_by(subject_id=subject_id, is_active=True).all()
    if not tests:
        return []
    test_ids = [qt.id for qt in tests]
    # Bulk query: attempt counts per test
    attempt_rows = db.query(TestResult.quiz_test_id, func.count(TestResult.id))\
        .filter(TestResult.user_id == user_id, TestResult.quiz_test_id.in_(test_ids),
                TestResult.completed_at.isnot(None))\
        .group_by(TestResult.quiz_test_id).all()
    attempts_map = {qt_id: cnt for qt_id, cnt in attempt_rows}
    # Bulk query: best score per test
    best_rows = db.query(TestResult.quiz_test_id,
                         func.max(TestResult.score * 100.0 / TestResult.total_questions))\
        .filter(TestResult.user_id == user_id, TestResult.quiz_test_id.in_(test_ids),
                TestResult.completed_at.isnot(None))\
        .group_by(TestResult.quiz_test_id).all()
    best_map = {qt_id: best for qt_id, best in best_rows}
    # Bulk query: user limits
    limits_map = {ul.quiz_test_id: ul.extra_attempts for ul in
                  db.query(UserTestLimit).filter_by(user_id=user_id)
                  .filter(UserTestLimit.quiz_test_id.in_(test_ids)).all()}
    user_obj = db.query(User).get(user_id)
    global_extra = user_obj.global_extra_attempts if user_obj else 0
    result = []
    for qt in tests:
        d = qt.to_dict()
        extra = limits_map.get(qt.id, 0) + global_extra
        d["user_attempts"] = attempts_map.get(qt.id, 0)
        best = best_map.get(qt.id)
        d["user_best_percentage"] = round(best, 1) if best else None
        d["retake_limit"] = (qt.retake_limit or 1) + extra
        result.append(d)
    return result


@router.get("/subjects/{subject_id}/practice-test")
def get_practice_test(subject_id: int, request: Request, db: Session = Depends(get_db)):
    require_login(request)
    subject = db.query(Subject).get(subject_id)
    if not subject or subject.subject_type != "practice":
        return JSONResponse({"error": "Not a practice subject"}, 400)
    qt = db.query(QuizTest).filter_by(subject_id=subject_id, is_active=True).first()
    if not qt:
        return JSONResponse({"error": "Practice test not configured yet"}, 404)
    return qt.to_dict()


@router.get("/quiz-tests/{quiz_test_id}")
def get_quiz_test(quiz_test_id: int, request: Request, db: Session = Depends(get_db)):
    require_login(request)
    qt = db.query(QuizTest).get(quiz_test_id)
    if not qt or not qt.is_active:
        return JSONResponse({"error": "Quiz test not available"}, 404)
    return qt.to_dict()


# ── Admin routes ──────────────────────────────────────────────────────────────

@router.get("/admin/questions/{question_id}/flag-details")
def get_question_flag_details(question_id: int, request: Request, db: Session = Depends(get_db)):
    require_login(request)
    q = db.query(Question).get(question_id)
    if not q:
        return JSONResponse({"error": "Not found"}, 404)
    rows = db.query(UserAnswer, TestResult, User)\
        .join(TestResult, UserAnswer.test_result_id == TestResult.id)\
        .join(User, TestResult.user_id == User.id)\
        .filter(UserAnswer.question_id == question_id, UserAnswer.is_flagged == True).all()
    return {
        "question_id": question_id,
        "question_text": q.question_text,
        "flag_count": len(rows),
        "flags": [{
            "username": user.username,
            "user_id": user.id,
            "test_result_id": tr.id,
            "selected_answer": ua.selected_answer,
            "is_correct": ua.is_correct,
            "answered_at": ua.answered_at.isoformat() if ua.answered_at else None,
        } for ua, tr, user in rows]
    }


@router.get("/admin/exams")
def admin_list_exams(request: Request, db: Session = Depends(get_db)):
    require_login(request)
    return [e.to_dict() for e in db.query(Exam).order_by(Exam.id).all()]


@router.post("/admin/exams")
def create_exam(request: Request, db: Session = Depends(get_db)):
    require_login(request)
    data = request.state.body
    if not data.get("name"):
        return JSONResponse({"error": "Exam name is required"}, 400)
    exam = Exam(name=data["name"], description=data.get("description", ""), is_active=data.get("is_active", True))
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return JSONResponse({"message": "Exam created successfully", "exam": exam.to_dict()}, 201)


@router.put("/admin/exams/{exam_id}")
def update_exam(exam_id: int, request: Request, db: Session = Depends(get_db)):
    require_login(request)
    exam = db.query(Exam).get(exam_id)
    if not exam:
        return JSONResponse({"error": "Not found"}, 404)
    data = request.state.body
    for field in ["name", "description", "is_active"]:
        if field in data:
            setattr(exam, field, data[field])
    db.commit()
    return exam.to_dict()


@router.delete("/admin/exams/{exam_id}")
def delete_exam(exam_id: int, request: Request, db: Session = Depends(get_db)):
    require_login(request)
    exam = db.query(Exam).get(exam_id)
    if not exam:
        return JSONResponse({"error": "Not found"}, 404)
    if db.query(Subject).filter_by(exam_id=exam_id).count():
        return JSONResponse({"error": "Cannot delete exam with existing subjects. Remove all subjects first."}, 400)
    db.delete(exam)
    db.commit()
    return {"message": "Exam deleted"}


@router.get("/admin/exams/{exam_id}/subjects")
def admin_list_subjects(exam_id: int, request: Request, db: Session = Depends(get_db)):
    require_login(request)
    return [s.to_dict() for s in db.query(Subject).filter_by(exam_id=exam_id).order_by(Subject.id).all()]


@router.post("/admin/subjects")
def create_subject(request: Request, db: Session = Depends(get_db)):
    require_login(request)
    data = request.state.body
    if not data.get("name") or not data.get("exam_id"):
        return JSONResponse({"error": "Subject name and exam_id are required"}, 400)
    if not db.query(Exam).get(data["exam_id"]):
        return JSONResponse({"error": "Exam not found"}, 404)
    subject = Subject(name=data["name"], description=data.get("description", ""), exam_id=data["exam_id"], is_active=data.get("is_active", True), subject_type=data.get("subject_type", "subject"))
    db.add(subject)
    db.commit()
    db.refresh(subject)
    # Auto-create a single QuizTest for practice subjects
    if subject.subject_type == "practice":
        qt = QuizTest(
            name=data["name"],
            description=data.get("description", ""),
            subject_id=subject.id,
            time_limit_minutes=data.get("time_limit_minutes", 30),
            retake_limit=data.get("retake_limit", 1),
            is_active=True,
            marks_correct=data.get("marks_correct", 1.0),
            marks_negative=data.get("marks_negative", 0.0),
        )
        db.add(qt)
        db.commit()
    return JSONResponse({"message": "Subject created successfully", "subject": subject.to_dict()}, 201)


@router.put("/admin/subjects/{subject_id}")
def update_subject(subject_id: int, request: Request, db: Session = Depends(get_db)):
    require_login(request)
    subject = db.query(Subject).get(subject_id)
    if not subject:
        return JSONResponse({"error": "Not found"}, 404)
    data = request.state.body
    for field in ["name", "description", "is_active", "subject_type"]:
        if field in data:
            setattr(subject, field, data[field])
    db.commit()
    return subject.to_dict()


@router.delete("/admin/subjects/{subject_id}")
def delete_subject(subject_id: int, request: Request, db: Session = Depends(get_db)):
    require_login(request)
    subject = db.query(Subject).get(subject_id)
    if not subject:
        return JSONResponse({"error": "Not found"}, 404)
    if db.query(QuizTest).filter_by(subject_id=subject_id).count():
        return JSONResponse({"error": "Cannot delete subject with existing tests. Set tests inactive instead."}, 400)
    db.delete(subject)
    db.commit()
    return {"message": "Subject deleted"}


@router.get("/admin/subjects/{subject_id}/quiz-tests")
def admin_list_quiz_tests(subject_id: int, request: Request, db: Session = Depends(get_db)):
    require_login(request)
    return [t.to_dict() for t in db.query(QuizTest).filter_by(subject_id=subject_id).order_by(QuizTest.id).all()]


@router.post("/admin/quiz-tests")
def create_quiz_test(request: Request, db: Session = Depends(get_db)):
    require_login(request)
    data = request.state.body
    if not data.get("name") or not data.get("subject_id"):
        return JSONResponse({"error": "Quiz test name and subject_id are required"}, 400)
    if not db.query(Subject).get(data["subject_id"]):
        return JSONResponse({"error": "Subject not found"}, 404)
    qt = QuizTest(name=data["name"], description=data.get("description", ""), subject_id=data["subject_id"],
                  time_limit_minutes=data.get("time_limit_minutes", 20), is_active=data.get("is_active", True),
                  shuffle_questions=data.get("shuffle_questions", False), shuffle_answers=data.get("shuffle_answers", False),
                  marks_correct=data.get("marks_correct", 1.0), marks_negative=data.get("marks_negative", 0.0))
    db.add(qt)
    db.commit()
    db.refresh(qt)
    return JSONResponse({"message": "Quiz test created successfully", "quiz_test": qt.to_dict()}, 201)


@router.put("/admin/quiz-tests/{quiz_test_id}")
def update_quiz_test(quiz_test_id: int, request: Request, db: Session = Depends(get_db)):
    require_login(request)
    qt = db.query(QuizTest).get(quiz_test_id)
    if not qt:
        return JSONResponse({"error": "Not found"}, 404)
    data = request.state.body
    for field in ["name", "description", "time_limit_minutes", "retake_limit", "is_active", "shuffle_questions", "shuffle_answers", "marks_correct", "marks_negative"]:
        if field in data:
            setattr(qt, field, data[field])
    db.commit()
    return qt.to_dict()


@router.delete("/admin/quiz-tests/{quiz_test_id}")
def delete_quiz_test(quiz_test_id: int, request: Request, db: Session = Depends(get_db)):
    require_login(request)
    qt = db.query(QuizTest).get(quiz_test_id)
    if not qt:
        return JSONResponse({"error": "Not found"}, 404)
    db.delete(qt)
    db.commit()
    return {"message": "Quiz test deleted"}


@router.get("/admin/quiz-tests/{quiz_test_id}/questions")
def admin_list_questions(quiz_test_id: int, request: Request, db: Session = Depends(get_db)):
    require_login(request)
    questions = db.query(Question).filter_by(quiz_test_id=quiz_test_id).order_by(Question.id).all()
    result = []
    for q in questions:
        d = q.to_admin_dict()
        flag_count = db.query(UserAnswer).filter_by(question_id=q.id, is_flagged=True).count()
        d["flag_count"] = flag_count
        result.append(d)
    return result


@router.post("/admin/questions")
def create_question(request: Request, db: Session = Depends(get_db)):
    require_login(request)
    data = request.state.body
    required = ["quiz_test_id", "question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer"]
    if not data or any(not data.get(f) for f in required):
        return JSONResponse({"error": "All question fields are required"}, 400)
    explanation = str(data["explanation"]).strip() if data.get("explanation") else None
    q = Question(quiz_test_id=data["quiz_test_id"], question_text=data["question_text"],
                 option_a=data["option_a"], option_b=data["option_b"],
                 option_c=data["option_c"], option_d=data["option_d"],
                 correct_answer=data["correct_answer"].strip(), explanation=explanation)
    db.add(q)
    db.commit()
    db.refresh(q)
    return JSONResponse({"message": "Question created", "question": q.to_admin_dict()}, 201)


@router.put("/admin/questions/{question_id}")
def update_question(question_id: int, request: Request, db: Session = Depends(get_db)):
    require_login(request)
    q = db.query(Question).get(question_id)
    if not q:
        return JSONResponse({"error": "Not found"}, 404)
    data = request.state.body
    for field in ["question_text", "option_a", "option_b", "option_c", "option_d"]:
        if field in data:
            setattr(q, field, data[field])
    if "correct_answer" in data:
        q.correct_answer = data["correct_answer"].strip()
    if "explanation" in data:
        q.explanation = str(data["explanation"]).strip() if data["explanation"] else None
    if "is_active" in data:
        q.is_active = bool(data["is_active"])
    db.commit()
    return {"message": "Question updated", "question": q.to_admin_dict()}


@router.delete("/admin/questions/{question_id}")
def delete_question(question_id: int, request: Request, db: Session = Depends(get_db)):
    require_login(request)
    q = db.query(Question).get(question_id)
    if not q:
        return JSONResponse({"error": "Not found"}, 404)
    db.delete(q)
    db.commit()
    return {"message": "Question deleted"}


@router.post("/admin/quiz-tests/{quiz_test_id}/upload-questions")
def upload_questions(quiz_test_id: int, request: Request, db: Session = Depends(get_db)):
    require_login(request)
    if not db.query(QuizTest).get(quiz_test_id):
        return JSONResponse({"error": "Not found"}, 404)
    data = request.state.body
    if not data or not isinstance(data.get("questions"), list):
        return JSONResponse({"error": "questions array required"}, 400)
    inserted, errors = 0, []
    for i, row in enumerate(data["questions"], 1):
        missing = [f for f in ["question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer"] if not str(row.get(f, "")).strip()]
        if missing:
            errors.append(f"Row {i}: missing {missing}")
            continue
        expl = str(row["explanation"]).strip() if row.get("explanation") else None
        db.add(Question(quiz_test_id=quiz_test_id, question_text=str(row["question_text"]).strip(),
                        option_a=str(row["option_a"]).strip(), option_b=str(row["option_b"]).strip(),
                        option_c=str(row["option_c"]).strip(), option_d=str(row["option_d"]).strip(),
                        correct_answer=str(row["correct_answer"]).strip(), explanation=expl))
        inserted += 1
    db.commit()
    return JSONResponse({"message": f"{inserted} questions uploaded", "errors": errors}, 201)


# ── User attempt limit routes ─────────────────────────────────────────────────

@router.get("/admin/quiz-tests/{quiz_test_id}/user-limits")
def get_user_limits(quiz_test_id: int, request: Request, db: Session = Depends(get_db)):
    require_login(request)
    qt = db.query(QuizTest).get(quiz_test_id)
    if not qt:
        return JSONResponse({"error": "Not found"}, 404)
    users = db.query(User).filter_by(is_active=True).order_by(User.username).all()
    limits = {ul.user_id: ul.extra_attempts for ul in db.query(UserTestLimit).filter_by(quiz_test_id=quiz_test_id).all()}
    from backend.models.models import TestResult
    result = []
    for u in users:
        completed = db.query(TestResult).filter_by(user_id=u.id, quiz_test_id=quiz_test_id).filter(
            TestResult.completed_at.isnot(None)).count()
        test_extra = limits.get(u.id, 0)
        global_extra = u.global_extra_attempts or 0
        effective = (qt.retake_limit or 1) + global_extra + test_extra
        result.append({
            "user_id": u.id,
            "username": u.username,
            "email": u.email,
            "global_extra_attempts": global_extra,
            "test_extra_attempts": test_extra,
            "effective_limit": effective,
            "completed_attempts": completed,
        })
    return {"test_retake_limit": qt.retake_limit or 1, "users": result}


@router.put("/admin/quiz-tests/{quiz_test_id}/user-limits/{user_id}")
def set_user_limit(quiz_test_id: int, user_id: int, request: Request, db: Session = Depends(get_db)):
    require_login(request)
    data = request.state.body
    extra = int(data.get("extra_attempts", 0))
    if extra < 0:
        return JSONResponse({"error": "extra_attempts cannot be negative"}, 400)
    ul = db.query(UserTestLimit).filter_by(user_id=user_id, quiz_test_id=quiz_test_id).first()
    if ul:
        ul.extra_attempts = extra
    else:
        db.add(UserTestLimit(user_id=user_id, quiz_test_id=quiz_test_id, extra_attempts=extra))
    db.commit()
    qt = db.query(QuizTest).get(quiz_test_id)
    return {"message": "Limit updated", "effective_limit": (qt.retake_limit or 1) + extra}
