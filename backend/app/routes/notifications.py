from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select
from app.database import get_session
from app.models import NotificationLog

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationLog])
def list_notifications(
    phone: Optional[str] = Query(None, description="Filter notifications by phone number"),
    limit: int = Query(20, ge=1, le=100),
    session: Session = Depends(get_session)
):
    query = select(NotificationLog)
    if phone:
        # Match normalized phone or substring
        cleaned_phone = phone.replace("-", "").replace(" ", "").replace("(", "").replace(")", "")
        query = query.where(NotificationLog.recipient_phone.contains(cleaned_phone))
    
    query = query.order_by(NotificationLog.sent_at.desc()).limit(limit)
    return session.exec(query).all()

@router.delete("/clear")
def clear_notifications(session: Session = Depends(get_session)):
    logs = session.exec(select(NotificationLog)).all()
    for log in logs:
        session.delete(log)
    session.commit()
    return {"message": "Notification logs cleared"}
