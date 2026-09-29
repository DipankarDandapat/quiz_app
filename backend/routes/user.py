from fastapi import APIRouter, Request, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.models.models import User, TestResult, get_db
from backend.session import create_session, get_session, require_login, require_admin, COOKIE_NAME

router = APIRouter()


@router.post("/register")
def register(request: Request, db: Session = Depends(get_db)):
    data = request.state.body
    if not data.get("username") or not data.get("email") or not data.get("password"):
        return JSONResponse({"error": "Username, email, and password are required"}, 400)
    if db.query(User).filter(func.lower(User.username) == data["username"].strip().lower()).first():
        return JSONResponse({"error": "Username already taken"}, 400)
    if db.query(User).filter(func.lower(User.email) == data["email"].strip().lower()).first():
        return JSONResponse({"error": "This email is already registered. Please login instead."}, 400)
    phone = data.get("phone", "").strip() or None
    user = User(username=data["username"].strip(), email=data["email"].strip().lower(), phone=phone, is_active=False)
    user.set_password(data["password"])
    db.add(user)
    db.commit()
    db.refresh(user)
    return JSONResponse({
        "message": "Please send an email to d.dandapat96@gmail.com or a WhatsApp message to 9800188406 to activate your account.",
        "user": user.to_dict()
    }, 201)


@router.post("/login")
def login(request: Request, db: Session = Depends(get_db)):
    data = request.state.body
    identifier = data.get("username", "").strip()
    if not identifier or not data.get("password"):
        return JSONResponse({"error": "Username/email and password are required"}, 400)
    # Case-insensitive match on username first, then email
    user = db.query(User).filter(func.lower(User.username) == identifier.lower()).first()
    if not user:
        user = db.query(User).filter(func.lower(User.email) == identifier.lower()).first()
    if user and user.check_password(data["password"]):
        if not user.is_active:
            return JSONResponse({
                "error": "Your account is not active",
                "message": "Please send an email to <strong>d.dandapat96@gmail.com</strong> or a WhatsApp message to <strong>9800188406</strong> to activate your account.",
                "contains_html": True
            }, 403)
        token = create_session({"user_id": user.id, "username": user.username, "user_type": user.user_type})
        resp = JSONResponse({"message": "Login successful", "user": user.to_dict(), "token": token})
        resp.set_cookie(COOKIE_NAME, token, httponly=True, samesite="none", secure=True, max_age=86400 * 7)
        return resp
    return JSONResponse({"error": "Invalid username/email or password"}, 401)


@router.post("/logout")
def logout(request: Request):
    session = get_session(request)
    if "user_id" not in session:
        return JSONResponse({"error": "Authentication required"}, 401)
    resp = JSONResponse({"message": "Logout successful"})
    resp.delete_cookie(COOKIE_NAME)
    return resp


@router.get("/check-auth")
def check_auth(request: Request, db: Session = Depends(get_db)):
    session = get_session(request)
    if "user_id" in session:
        user = db.query(User).get(session["user_id"])
        if user:
            return {"authenticated": True, "user": user.to_dict()}
    return {"authenticated": False}


@router.get("/profile")
def get_profile(request: Request, db: Session = Depends(get_db)):
    session = require_login(request)
    user = db.query(User).get(session["user_id"])
    if not user:
        return JSONResponse({"error": "User not found"}, 404)
    return user.to_dict()


@router.get("/users")
def get_users(request: Request, db: Session = Depends(get_db)):
    require_login(request)
    return [u.to_dict() for u in db.query(User).all()]


@router.get("/users/{user_id}")
def get_user(user_id: int, request: Request, db: Session = Depends(get_db)):
    require_login(request)
    user = db.query(User).get(user_id)
    if not user:
        return JSONResponse({"error": "Not found"}, 404)
    return user.to_dict()


@router.put("/users/{user_id}")
def update_user(user_id: int, request: Request, db: Session = Depends(get_db)):
    session = require_login(request)
    if session["user_id"] != user_id:
        return JSONResponse({"error": "Unauthorized"}, 403)
    user = db.query(User).get(user_id)
    if not user:
        return JSONResponse({"error": "Not found"}, 404)
    data = request.state.body
    if "username" in data:
        ex = db.query(User).filter(func.lower(User.username) == data["username"].strip().lower()).first()
        if ex and ex.id != user_id:
            return JSONResponse({"error": "Username already taken"}, 400)
        user.username = data["username"].strip()
    if "email" in data:
        ex = db.query(User).filter(func.lower(User.email) == data["email"].strip().lower()).first()
        if ex and ex.id != user_id:
            return JSONResponse({"error": "This email is already registered"}, 400)
        user.email = data["email"].strip().lower()
    if "password" in data:
        user.set_password(data["password"])
    db.commit()
    return user.to_dict()


@router.delete("/users/{user_id}")
def delete_user(user_id: int, request: Request, db: Session = Depends(get_db)):
    session = require_login(request)
    if session["user_id"] != user_id:
        return JSONResponse({"error": "Unauthorized"}, 403)
    user = db.query(User).get(user_id)
    if not user:
        return JSONResponse({"error": "Not found"}, 404)
    db.delete(user)
    db.commit()
    resp = JSONResponse({}, 204)
    resp.delete_cookie(COOKIE_NAME)
    return resp


@router.post("/admin/activate-user/{user_id}")
def activate_user(user_id: int, request: Request, db: Session = Depends(get_db)):
    require_admin(request)
    user = db.query(User).get(user_id)
    if not user:
        return JSONResponse({"error": "Not found"}, 404)
    user.is_active = True
    db.commit()
    return {"message": "User activated successfully", "user": user.to_dict()}


@router.get("/admin/users")
def admin_get_users(request: Request, page: int = 1, per_page: int = 10, search: str = '', db: Session = Depends(get_db)):
    require_admin(request)
    q = db.query(User)
    if search:
        q = q.filter((User.username.ilike(f'%{search}%')) | (User.email.ilike(f'%{search}%')))
    total = q.count()
    users = q.order_by(User.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    result = []
    for u in users:
        d = u.to_dict()
        d['tests_taken'] = db.query(func.count(TestResult.id)).filter_by(user_id=u.id).filter(TestResult.completed_at.isnot(None)).scalar() or 0
        result.append(d)
    return {
        "users": result,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": max(1, (total + per_page - 1) // per_page),
    }


@router.put("/admin/users/{user_id}")
def admin_update_user(user_id: int, request: Request, db: Session = Depends(get_db)):
    require_admin(request)
    user = db.query(User).get(user_id)
    if not user:
        return JSONResponse({"error": "Not found"}, 404)
    data = request.state.body
    if "is_active" in data:
        val = data["is_active"]
        user.is_active = val if isinstance(val, bool) else str(val).lower() == "true"
    if "user_type" in data and data["user_type"] in ("member", "admin"):
        user.user_type = data["user_type"]
    if "global_extra_attempts" in data:
        val = int(data["global_extra_attempts"])
        user.global_extra_attempts = max(0, val)
    db.commit()
    return {"message": "User updated successfully", "user": user.to_dict()}
