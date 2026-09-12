from datetime import datetime, timezone
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from pydantic import BaseModel

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

# ---------------------------------------------------------------------------
# SQLModel Database Tables
# ---------------------------------------------------------------------------

class Restaurant(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    cuisine: str = "Italian Mediterranean"
    address: str = "104 Olive Grove Way, San Francisco, CA"
    average_turn_minutes_2p: int = 45
    average_turn_minutes_4p: int = 65
    average_turn_minutes_large: int = 85

class Table(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    table_number: str = Field(index=True, unique=True)
    capacity: int = Field(default=4)
    section: str = Field(default="Indoor")  # Indoor, Patio, Bar Lounge
    status: str = Field(default="available")  # available, occupied, reserved, cleaning
    current_party_name: Optional[str] = None
    current_waitlist_id: Optional[int] = None
    seated_at: Optional[datetime] = None

class WaitlistEntry(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    customer_name: str
    phone: str
    party_size: int = Field(default=2)
    notes: Optional[str] = None
    preference: str = Field(default="First Available")  # Indoor, Patio, Bar Lounge, First Available
    status: str = Field(default="waiting")  # waiting, notified, seated, cancelled, no_show
    joined_at: datetime = Field(default_factory=utc_now)
    estimated_wait_minutes: int = Field(default=15)
    notified_at: Optional[datetime] = None
    seated_at: Optional[datetime] = None
    assigned_table_id: Optional[int] = None

class TableTurnHistory(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    table_number: str
    party_size: int
    duration_minutes: int
    seated_at: datetime = Field(default_factory=utc_now)
    completed_at: datetime = Field(default_factory=utc_now)

class NotificationLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    entry_id: Optional[int] = None
    recipient_name: str
    recipient_phone: str
    message: str
    sent_at: datetime = Field(default_factory=utc_now)
    channel: str = "sms_simulated"

# ---------------------------------------------------------------------------
# API Schemas (Request / Response)
# ---------------------------------------------------------------------------

class WaitlistCreate(BaseModel):
    customer_name: str
    phone: str
    party_size: int = 2
    notes: Optional[str] = None
    preference: Optional[str] = "First Available"

class WaitlistUpdateStatus(BaseModel):
    status: str  # waiting, notified, seated, cancelled, no_show
    table_id: Optional[int] = None

class TableCreate(BaseModel):
    table_number: str
    capacity: int = 4
    section: str = "Indoor"
    status: str = "available"

class TableUpdateStatus(BaseModel):
    status: str
    current_party_name: Optional[str] = None
    waitlist_id: Optional[int] = None

class SeatPartyRequest(BaseModel):
    waitlist_id: int
    table_id: int

class ChatMessage(BaseModel):
    role: str  # user, assistant, system
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    portal: str = "guest"  # "guest" or "host"
    context: Optional[dict] = None

class ChatResponse(BaseModel):
    reply: str
    suggested_actions: Optional[List[str]] = None

class WaitEstimateResponse(BaseModel):
    party_size: int
    preference: str
    estimated_wait_minutes: int
    queue_position: int
    confidence: str
    reasoning: str

class TableRecommendation(BaseModel):
    table_id: int
    table_number: str
    capacity: int
    section: str
    status: str
    score: float
    reason: str
