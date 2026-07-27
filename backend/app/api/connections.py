from __future__ import annotations

import os
import re
from contextlib import closing
from typing import Optional

import mysql.connector
from cryptography.fernet import Fernet, InvalidToken
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_sqlalchemy_engine
from app.models import Base, SavedConnection
from app.main import get_current_user

router = APIRouter(prefix="/connections", tags=["connections"])
_IDENTIFIER = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


def encryption_key() -> bytes:
    value = os.getenv("CONNECTION_ENCRYPTION_KEY")
    if not value:
        raise HTTPException(status_code=500, detail="CONNECTION_ENCRYPTION_KEY is not configured")
    try:
        Fernet(value.encode("utf-8"))
    except (ValueError, TypeError):
        raise HTTPException(status_code=500, detail="CONNECTION_ENCRYPTION_KEY is invalid")
    return value.encode("utf-8")


def cipher() -> Fernet:
    return Fernet(encryption_key())


def serialize(connection: SavedConnection) -> dict:
    return {
        "id": connection.id,
        "name": connection.name,
        "host": connection.host,
        "port": connection.port,
        "username": connection.username,
        "database_name": connection.database_name,
        "is_active": connection.is_active,
        "created_at": connection.created_at,
        "updated_at": connection.updated_at,
    }


def user_id(current_user: dict) -> int:
    try:
        return int(current_user["sub"])
    except (KeyError, TypeError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session")


def get_owned(session: Session, connection_id: int, owner_id: int) -> SavedConnection:
    connection = session.scalar(select(SavedConnection).where(SavedConnection.id == connection_id, SavedConnection.user_id == owner_id))
    if connection is None:
        raise HTTPException(status_code=404, detail="Connection not found")
    return connection


def open_connection(connection: SavedConnection):
    try:
        password = cipher().decrypt(connection.password_encrypted.encode("utf-8")).decode("utf-8")
    except InvalidToken:
        raise HTTPException(status_code=500, detail="Saved connection credentials cannot be decrypted")
    try:
        return mysql.connector.connect(host=connection.host, port=connection.port, user=connection.username, password=password, database=connection.database_name, connection_timeout=10)
    except mysql.connector.Error:
        raise HTTPException(status_code=400, detail="Unable to connect using these database details")


class ConnectionInput(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    host: str = Field(min_length=1, max_length=255)
    port: int = Field(default=3306, ge=1, le=65535)
    username: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=1, max_length=512)
    database_name: str = Field(min_length=1, max_length=255)

    @field_validator("name", "host", "username", "database_name")
    @classmethod
    def strip_required(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("This field is required")
        return value


class ConnectionUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    host: Optional[str] = Field(default=None, min_length=1, max_length=255)
    port: Optional[int] = Field(default=None, ge=1, le=65535)
    username: Optional[str] = Field(default=None, min_length=1, max_length=255)
    password: Optional[str] = Field(default=None, min_length=1, max_length=512)
    database_name: Optional[str] = Field(default=None, min_length=1, max_length=255)


@router.get("")
def list_connections(current_user: dict = Depends(get_current_user)):
    engine = get_sqlalchemy_engine(); Base.metadata.create_all(engine)
    with Session(engine) as session:
        connections = session.scalars(select(SavedConnection).where(SavedConnection.user_id == user_id(current_user)).order_by(SavedConnection.name)).all()
        return [serialize(connection) for connection in connections]


@router.post("", status_code=status.HTTP_201_CREATED)
def create_connection(request: ConnectionInput, current_user: dict = Depends(get_current_user)):
    engine = get_sqlalchemy_engine(); Base.metadata.create_all(engine)
    with Session(engine) as session:
        connection = SavedConnection(user_id=user_id(current_user), name=request.name, host=request.host, port=request.port, username=request.username, password_encrypted=cipher().encrypt(request.password.encode("utf-8")).decode("utf-8"), database_name=request.database_name)
        session.add(connection)
        try:
            session.commit(); session.refresh(connection)
        except IntegrityError:
            session.rollback(); raise HTTPException(status_code=409, detail="A connection with this name already exists")
        return serialize(connection)


@router.patch("/{connection_id}")
def update_connection(connection_id: int, request: ConnectionUpdate, current_user: dict = Depends(get_current_user)):
    changes = request.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=400, detail="Provide at least one field to update")
    engine = get_sqlalchemy_engine(); Base.metadata.create_all(engine)
    with Session(engine) as session:
        connection = get_owned(session, connection_id, user_id(current_user))
        if "password" in changes:
            connection.password_encrypted = cipher().encrypt(changes.pop("password").encode("utf-8")).decode("utf-8")
        for field, value in changes.items():
            setattr(connection, field, value.strip() if isinstance(value, str) else value)
        try:
            session.commit(); session.refresh(connection)
        except IntegrityError:
            session.rollback(); raise HTTPException(status_code=409, detail="A connection with this name already exists")
        return serialize(connection)


@router.delete("/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_connection(connection_id: int, current_user: dict = Depends(get_current_user)):
    engine = get_sqlalchemy_engine()
    with Session(engine) as session:
        connection = get_owned(session, connection_id, user_id(current_user)); session.delete(connection); session.commit()


@router.post("/test")
def test_unsaved_connection(request: ConnectionInput, current_user: dict = Depends(get_current_user)):
    try:
        with closing(mysql.connector.connect(host=request.host, port=request.port, user=request.username, password=request.password, database=request.database_name, connection_timeout=10)) as connection:
            if not connection.is_connected(): raise RuntimeError()
    except mysql.connector.Error:
        raise HTTPException(status_code=400, detail="Unable to connect using these database details")
    return {"message": "Connection successful"}


@router.post("/{connection_id}/test")
def test_saved_connection(connection_id: int, current_user: dict = Depends(get_current_user)):
    engine = get_sqlalchemy_engine()
    with Session(engine) as session:
        connection = get_owned(session, connection_id, user_id(current_user))
        with closing(open_connection(connection)) as db: pass
    return {"message": "Connection successful"}


@router.post("/{connection_id}/connect")
def connect_connection(connection_id: int, current_user: dict = Depends(get_current_user)):
    engine = get_sqlalchemy_engine()
    with Session(engine) as session:
        owner_id = user_id(current_user); connection = get_owned(session, connection_id, owner_id)
        with closing(open_connection(connection)) as db: pass
        session.execute(update(SavedConnection).where(SavedConnection.user_id == owner_id).values(is_active=False))
        connection.is_active = True; session.commit(); session.refresh(connection)
        return serialize(connection)


@router.post("/{connection_id}/disconnect")
def disconnect_connection(connection_id: int, current_user: dict = Depends(get_current_user)):
    engine = get_sqlalchemy_engine()
    with Session(engine) as session:
        connection = get_owned(session, connection_id, user_id(current_user)); connection.is_active = False; session.commit()
    return {"message": "Connection disconnected"}


def active_connection(session: Session, owner_id: int) -> SavedConnection:
    connection = session.scalar(select(SavedConnection).where(SavedConnection.user_id == owner_id, SavedConnection.is_active.is_(True)))
    if connection is None: raise HTTPException(status_code=400, detail="No active database connection")
    return connection


@router.get("/active/schema")
def get_schema(current_user: dict = Depends(get_current_user)):
    engine = get_sqlalchemy_engine()
    with Session(engine) as session:
        connection = active_connection(session, user_id(current_user))
        with closing(open_connection(connection)) as db, closing(db.cursor(dictionary=True)) as cursor:
            cursor.execute("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = %s AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME", (connection.database_name,))
            tables = [row["TABLE_NAME"] for row in cursor.fetchall()]
            cursor.execute("SELECT c.TABLE_NAME, c.COLUMN_NAME, c.COLUMN_TYPE, c.IS_NULLABLE, CASE WHEN k.COLUMN_NAME IS NULL THEN FALSE ELSE TRUE END AS IS_PRIMARY_KEY FROM information_schema.COLUMNS c LEFT JOIN information_schema.KEY_COLUMN_USAGE k ON k.TABLE_SCHEMA = c.TABLE_SCHEMA AND k.TABLE_NAME = c.TABLE_NAME AND k.COLUMN_NAME = c.COLUMN_NAME AND k.CONSTRAINT_NAME = 'PRIMARY' WHERE c.TABLE_SCHEMA = %s ORDER BY c.TABLE_NAME, c.ORDINAL_POSITION", (connection.database_name,))
            columns = cursor.fetchall()
    by_table = {table: [] for table in tables}
    for column in columns:
        by_table.setdefault(column["TABLE_NAME"], []).append({"name": column["COLUMN_NAME"], "data_type": column["COLUMN_TYPE"], "nullable": column["IS_NULLABLE"] == "YES", "primary_key": bool(column["IS_PRIMARY_KEY"])})
    return {"database_name": connection.database_name, "tables": [{"name": table, "columns": by_table.get(table, [])} for table in tables]}


@router.get("/active/tables/{table_name}/rows")
def preview_rows(table_name: str, current_user: dict = Depends(get_current_user)):
    if not _IDENTIFIER.fullmatch(table_name): raise HTTPException(status_code=400, detail="Invalid table name")
    engine = get_sqlalchemy_engine()
    with Session(engine) as session:
        connection = active_connection(session, user_id(current_user))
        with closing(open_connection(connection)) as db, closing(db.cursor(dictionary=True)) as cursor:
            cursor.execute("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = %s AND TABLE_NAME = %s AND TABLE_TYPE = 'BASE TABLE'", (connection.database_name, table_name))
            if cursor.fetchone() is None: raise HTTPException(status_code=404, detail="Table not found")
            cursor.execute(f"SELECT * FROM `{table_name}` LIMIT 100")
            rows = cursor.fetchall(); columns = [description[0] for description in cursor.description]
    return {"table": table_name, "columns": columns, "rows": rows}
