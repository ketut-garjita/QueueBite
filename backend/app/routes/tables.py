from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.models import Table, TableCreate, TableUpdateStatus, TableTurnHistory, WaitlistEntry

router = APIRouter(prefix="/api/tables", tags=["Tables"])

@router.get("", response_model=List[Table])
def get_tables(session: Session = Depends(get_session)):
    tables = session.exec(select(Table).order_by(Table.table_number.asc())).all()
    return tables

@router.post("", response_model=Table)
def create_table(payload: TableCreate, session: Session = Depends(get_session)):
    table = Table(**payload.model_dump())
    session.add(table)
    session.commit()
    session.refresh(table)
    return table

@router.patch("/{table_id}/status", response_model=Table)
def update_table_status(
    table_id: int, 
    payload: TableUpdateStatus, 
    session: Session = Depends(get_session)
):
    table = session.get(Table, table_id)
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    table.status = payload.status
    if payload.status == "occupied":
        table.current_party_name = payload.current_party_name
        table.current_waitlist_id = payload.waitlist_id
        table.seated_at = datetime.now(timezone.utc)
    elif payload.status in ["available", "cleaning"]:
        table.current_party_name = None
        table.current_waitlist_id = None
        table.seated_at = None
        
    session.add(table)
    session.commit()
    session.refresh(table)
    return table

@router.post("/{table_id}/clear", response_model=Table)
def clear_table(table_id: int, session: Session = Depends(get_session)):
    table = session.get(Table, table_id)
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    now = datetime.now(timezone.utc)
    
    # If it was occupied and had seated time, log to turnover history
    if table.status == "occupied" and table.seated_at:
        s_at = table.seated_at if table.seated_at.tzinfo else table.seated_at.replace(tzinfo=timezone.utc)
        duration = max(5, int((now - s_at).total_seconds() / 60))
        history = TableTurnHistory(
            table_number=table.table_number,
            party_size=table.capacity,
            duration_minutes=duration,
            seated_at=s_at,
            completed_at=now
        )
        session.add(history)

    # Transition to cleaning first
    table.status = "cleaning"
    table.current_party_name = None
    table.current_waitlist_id = None
    table.seated_at = None
    session.add(table)
    session.commit()
    session.refresh(table)
    return table

@router.post("/{table_id}/ready", response_model=Table)
def mark_table_ready(table_id: int, session: Session = Depends(get_session)):
    table = session.get(Table, table_id)
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    table.status = "available"
    table.current_party_name = None
    table.current_waitlist_id = None
    table.seated_at = None
    session.add(table)
    session.commit()
    session.refresh(table)
    return table
