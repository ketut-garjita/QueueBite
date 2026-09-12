from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from app.database import get_session
from app.models import (
    WaitlistEntry, WaitlistCreate, WaitlistUpdateStatus, Table, 
    NotificationLog, SeatPartyRequest
)
from app.ai.predictor import calculate_wait_time

router = APIRouter(prefix="/api/queue", tags=["Queue"])

@router.get("", response_model=List[WaitlistEntry])
def list_queue(
    status: Optional[str] = Query(None, description="Filter by status, e.g. waiting, notified, seated"),
    session: Session = Depends(get_session)
):
    query = select(WaitlistEntry)
    if status:
        query = query.where(WaitlistEntry.status == status)
    else:
        # Default: show active queue (waiting and notified)
        query = query.where(WaitlistEntry.status.in_(["waiting", "notified"]))
    
    query = query.order_by(WaitlistEntry.joined_at.asc())
    return session.exec(query).all()

@router.get("/all", response_model=List[WaitlistEntry])
def list_all_queue(session: Session = Depends(get_session)):
    return session.exec(select(WaitlistEntry).order_by(WaitlistEntry.joined_at.desc())).all()

@router.post("", response_model=WaitlistEntry)
def add_to_queue(
    entry_in: WaitlistCreate,
    session: Session = Depends(get_session)
):
    # Calculate AI wait time
    prediction = calculate_wait_time(session, entry_in.party_size, entry_in.preference or "First Available")
    
    entry = WaitlistEntry(
        customer_name=entry_in.customer_name,
        phone=entry_in.phone,
        party_size=entry_in.party_size,
        notes=entry_in.notes,
        preference=entry_in.preference or "First Available",
        status="waiting",
        joined_at=datetime.now(timezone.utc),
        estimated_wait_minutes=prediction.estimated_wait_minutes
    )
    session.add(entry)
    session.commit()
    session.refresh(entry)

    # Automatically log initial welcome SMS
    welcome_msg = (
        f"QueueBite: Hi {entry.customer_name}! You're on the waitlist at The Rustic Olive. "
        f"Party of {entry.party_size}. Est. wait: ~{entry.estimated_wait_minutes} mins. "
        f"We will text you the moment your table is ready!"
    )
    log = NotificationLog(
        entry_id=entry.id,
        recipient_name=entry.customer_name,
        recipient_phone=entry.phone,
        message=welcome_msg,
        channel="sms_simulated"
    )
    session.add(log)
    session.commit()

    return entry

@router.get("/{entry_id}", response_model=WaitlistEntry)
def get_queue_entry(entry_id: int, session: Session = Depends(get_session)):
    entry = session.get(WaitlistEntry, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Queue entry not found")
    return entry

@router.patch("/{entry_id}/status", response_model=WaitlistEntry)
def update_queue_status(
    entry_id: int,
    update_in: WaitlistUpdateStatus,
    session: Session = Depends(get_session)
):
    entry = session.get(WaitlistEntry, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Queue entry not found")
    
    entry.status = update_in.status
    now = datetime.now(timezone.utc)
    if update_in.status == "notified":
        entry.notified_at = now
    elif update_in.status == "seated":
        entry.seated_at = now
        if update_in.table_id:
            entry.assigned_table_id = update_in.table_id
    
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return entry

@router.post("/{entry_id}/notify", response_model=WaitlistEntry)
def notify_guest(entry_id: int, session: Session = Depends(get_session)):
    entry = session.get(WaitlistEntry, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Queue entry not found")
    
    entry.status = "notified"
    entry.notified_at = datetime.now(timezone.utc)
    session.add(entry)
    
    # Send simulated SMS alert
    sms_msg = (
        f"🎉 Table Ready! Hi {entry.customer_name}, your table at The Rustic Olive is now ready! "
        f"Please head to the host stand within the next 10 minutes."
    )
    log = NotificationLog(
        entry_id=entry.id,
        recipient_name=entry.customer_name,
        recipient_phone=entry.phone,
        message=sms_msg,
        channel="sms_simulated"
    )
    session.add(log)
    session.commit()
    session.refresh(entry)
    return entry

@router.post("/seat", response_model=WaitlistEntry)
def seat_party(payload: SeatPartyRequest, session: Session = Depends(get_session)):
    entry = session.get(WaitlistEntry, payload.waitlist_id)
    table = session.get(Table, payload.table_id)
    
    if not entry:
        raise HTTPException(status_code=404, detail="Queue entry not found")
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    now = datetime.now(timezone.utc)
    entry.status = "seated"
    entry.seated_at = now
    entry.assigned_table_id = table.id
    
    table.status = "occupied"
    table.current_party_name = entry.customer_name
    table.current_waitlist_id = entry.id
    table.seated_at = now
    
    session.add(entry)
    session.add(table)
    session.commit()
    session.refresh(entry)
    return entry
