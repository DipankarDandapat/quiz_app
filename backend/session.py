from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from fastapi import Request, HTTPException

SECRET_KEY = "asdf#FGSgvasgf$5$WGT"
_s = URLSafeTimedSerializer(SECRET_KEY)
COOKIE_NAME = "session"


def create_session(data: dict) -> str:
    return _s.dumps(data)


def get_session(request: Request) -> dict:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        return {}
    try:
        return _s.loads(token, max_age=86400 * 7)
    except (BadSignature, SignatureExpired):
        return {}


def require_login(request: Request) -> dict:
    session = get_session(request)
    if "user_id" not in session:
        raise HTTPException(status_code=401, detail="Authentication required")
    return session


def require_admin(request: Request) -> dict:
    session = get_session(request)
    if "user_id" not in session:
        raise HTTPException(status_code=401, detail="Authentication required")
    if session.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return session
