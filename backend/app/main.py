from fastapi.middleware.cors import CORSMiddleware
from app.database import get_connection, close_connection, get_sqlalchemy_engine

from pydantic import BaseModel, field_validator
from typing import Literal
from fastapi import Depends, FastAPI, HTTPException, status
from app.api.parser import SQLParser
from app.api.analyzer import QueryAnalyzer
from app.api.query_executor import QueryExecutor
from app.api.oauth import router as oauth_router
from app.models import Base, User
from sqlalchemy import inspect, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
import bcrypt
import re
import os
from datetime import datetime, timedelta, timezone
import jwt
import hashlib
import secrets
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from dotenv import load_dotenv
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

app = FastAPI()
app.include_router(oauth_router)
security = HTTPBearer(auto_error=False)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required", headers={"WWW-Authenticate": "Bearer"})

    try:
        return jwt.decode(
            credentials.credentials,
            os.getenv("JWT_SECRET_KEY", "querypulse-development-secret"),
            algorithms=["HS256"],
        )
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token", headers={"WWW-Authenticate": "Bearer"})


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str
    database: Literal['mysql', 'postgresql', 'sqlite', 'mariadb'] = 'mysql'
class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str) -> str:
        username = value.strip()
        if not username:
            raise ValueError("Username is required")
        if len(username) > 50:
            raise ValueError("Username must be 50 characters or fewer")
        return username

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        email = value.strip().lower()
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
            raise ValueError("A valid email address is required")
        return email

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return value



class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return value


def ensure_reset_columns(engine) -> None:
    existing_columns = {column["name"] for column in inspect(engine).get_columns("app_users")}
    with engine.begin() as connection:
        if "reset_token_hash" not in existing_columns:
            connection.execute(text("ALTER TABLE app_users ADD COLUMN reset_token_hash VARCHAR(64) NULL UNIQUE"))
        if "reset_token_expires_at" not in existing_columns:
            connection.execute(text("ALTER TABLE app_users ADD COLUMN reset_token_expires_at DATETIME NULL"))

@app.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(request: RegisterRequest):
    engine = get_sqlalchemy_engine()
    Base.metadata.create_all(engine)

    with Session(engine) as session:
        if session.scalar(select(User).where(User.username == request.username)):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username is already registered")
        if session.scalar(select(User).where(User.email == request.email)):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")

        user = User(
            username=request.username,
            email=request.email,
            password_hash=bcrypt.hashpw(request.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8"),
        )
        session.add(user)
        try:
            session.commit()
        except IntegrityError:
            session.rollback()
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username or email is already registered")
        session.refresh(user)

        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "created_at": user.created_at,
        }

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/login")
def login_user(request: LoginRequest):
    engine = get_sqlalchemy_engine()

    with Session(engine) as session:
        user = session.scalar(select(User).where(User.email == request.email.strip().lower()))
        if user is None or not bcrypt.checkpw(request.password.encode("utf-8"), user.password_hash.encode("utf-8")):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

        access_token = jwt.encode(
            {
                "sub": str(user.id),
                "username": user.username,
                "email": user.email,
                "exp": datetime.now(timezone.utc) + timedelta(minutes=int(os.getenv("JWT_EXPIRE_MINUTES", "60"))),
            },
            os.getenv("JWT_SECRET_KEY", "querypulse-development-secret"),
            algorithm="HS256",
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {"id": user.id, "username": user.username, "email": user.email},
        }

@app.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest):
    engine = get_sqlalchemy_engine()
    Base.metadata.create_all(engine)
    ensure_reset_columns(engine)

    with Session(engine) as session:
        user = session.scalar(select(User).where(User.email == request.email.strip().lower()))
        if user is None:
            return {"message": "If an account exists for that email, reset instructions are available."}

        reset_token = secrets.token_urlsafe(32)
        user.reset_token_hash = hashlib.sha256(reset_token.encode("utf-8")).hexdigest()
        user.reset_token_expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(hours=1)
        session.commit()

        return {
            "message": "Password reset token generated.",
            "reset_token": reset_token,
        }


@app.post("/reset-password")
def reset_password(request: ResetPasswordRequest):
    engine = get_sqlalchemy_engine()
    Base.metadata.create_all(engine)
    ensure_reset_columns(engine)
    token_hash = hashlib.sha256(request.token.encode("utf-8")).hexdigest()

    with Session(engine) as session:
        user = session.scalar(select(User).where(User.reset_token_hash == token_hash))
        if user is None or user.reset_token_expires_at is None or user.reset_token_expires_at <= datetime.now(timezone.utc).replace(tzinfo=None):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token")

        user.password_hash = bcrypt.hashpw(request.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        user.reset_token_hash = None
        user.reset_token_expires_at = None
        session.commit()

        return {"message": "Password reset successfully."}
@app.post("/query")
def execute_query(request: QueryRequest, current_user: dict = Depends(get_current_user)):
    parser = SQLParser()
    executor = QueryExecutor(request.database)

    # Attempt to determine query type using the parser; fall back to first token
    try:
        parsed = parser.parse(request.query, dialect=request.database)
        qtype = (parsed.get("query_type") or "").upper()
    except Exception:
        qtype = request.query.strip().split()[0].upper() if request.query and request.query.strip() else ""

    try:
        if qtype == "SELECT":
            result = executor.execute_select(request.query)
        elif qtype in {"INSERT", "UPDATE", "DELETE"}:
            result = executor.execute_write(request.query)
        else:
            return {"error": f"Unsupported or unrecognized query type: {qtype}"}

        return {"query": request.query, "result": result}

    except Exception as e:
        return {"error": str(e)}

@app.get("/")
def home():
    return {
        "message": "Welcome to QueryPulse!"
    }

@app.get("/db-test")
def db_test(current_user: dict = Depends(get_current_user)):
    conn = None
    try:
        conn = get_connection()
        return {"message": "Database connected successfully!"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        if conn:
            close_connection(conn)

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "project": "QueryPulse"
    }

@app.post("/analyze")
def analyze_query(request: QueryRequest, current_user: dict = Depends(get_current_user)):
    parser = SQLParser()
    analyzer = None

    try:
        parsed = parser.parse(request.query, dialect=request.database)
        analyzer = QueryAnalyzer(parsed)
        analysis = analyzer.analyze()

        return {
            "parsed": parsed,
            "analysis": analysis,
        }

    except Exception as e:
        return {"error": str(e)}