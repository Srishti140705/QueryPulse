from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import inspect, select, text
from sqlalchemy.orm import Session
from app.database import get_sqlalchemy_engine
from app.main import get_current_user
from app.models import Base, UserQuery

router = APIRouter(prefix="/workspace", tags=["workspace"])
def ensure_query_columns(engine):
    Base.metadata.create_all(engine)
    existing = {column["name"] for column in inspect(engine).get_columns("user_queries")}
    with engine.begin() as connection:
        if "row_count" not in existing:
            connection.execute(text("ALTER TABLE user_queries ADD COLUMN row_count INT NULL"))
        if "performance_reason" not in existing:
            connection.execute(text("ALTER TABLE user_queries ADD COLUMN performance_reason VARCHAR(500) NULL"))
def uid(user):
    try: return int(user["sub"])
    except Exception: raise HTTPException(status_code=401, detail="Invalid session")
def item(query):
    return {"id": query.id, "sql": query.sql, "name": query.name, "query_type": query.query_type, "connection_name": query.connection_name, "execution_time_ms": query.execution_time_ms, "row_count": query.row_count, "performance_reason": query.performance_reason, "status": query.status, "is_favorite": query.is_favorite, "is_saved": query.is_saved, "created_at": query.created_at}
class QueryInput(BaseModel):
    sql: str = Field(min_length=1, max_length=20000); name: str | None = Field(default=None, max_length=120); query_type: str = "SQL"; connection_name: str | None = None; execution_time_ms: int | None = None; row_count: int | None = None; performance_reason: str | None = Field(default=None, max_length=500); status: str = "success"
class QueryUpdate(BaseModel): name: str | None = Field(default=None, max_length=120); is_favorite: bool | None = None; is_saved: bool | None = None
@router.get("/queries")
def list_queries(current_user: dict = Depends(get_current_user)):
    engine = get_sqlalchemy_engine(); ensure_query_columns(engine)
    with Session(engine) as session: return [item(q) for q in session.scalars(select(UserQuery).where(UserQuery.user_id == uid(current_user)).order_by(UserQuery.created_at.desc()).limit(100)).all()]
@router.post("/queries")
def add_query(request: QueryInput, current_user: dict = Depends(get_current_user)):
    engine = get_sqlalchemy_engine(); ensure_query_columns(engine)
    with Session(engine) as session:
        q = UserQuery(user_id=uid(current_user), **request.model_dump()); session.add(q); session.commit(); session.refresh(q); return item(q)
@router.patch("/queries/{query_id}")
def update_query(query_id: int, request: QueryUpdate, current_user: dict = Depends(get_current_user)):
    engine = get_sqlalchemy_engine()
    with Session(engine) as session:
        q = session.scalar(select(UserQuery).where(UserQuery.id == query_id, UserQuery.user_id == uid(current_user)))
        if not q: raise HTTPException(status_code=404, detail="Query not found")
        for key, value in request.model_dump(exclude_unset=True).items(): setattr(q, key, value)
        session.commit(); session.refresh(q); return item(q)
@router.delete("/queries/{query_id}", status_code=204)
def delete_query(query_id: int, current_user: dict = Depends(get_current_user)):
    engine = get_sqlalchemy_engine()
    with Session(engine) as session:
        q = session.scalar(select(UserQuery).where(UserQuery.id == query_id, UserQuery.user_id == uid(current_user)))
        if not q: raise HTTPException(status_code=404, detail="Query not found")
        session.delete(q); session.commit()
