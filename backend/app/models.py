from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, func, text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "app_users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=text("0"))
    email_verification_token_hash: Mapped[str | None] = mapped_column(String(64), nullable=True, unique=True)
    email_verification_expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    reset_token_hash: Mapped[str | None] = mapped_column(String(64), nullable=True, unique=True)
    reset_token_expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
