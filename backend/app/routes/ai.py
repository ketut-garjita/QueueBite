from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session
from app.database import get_session
from app.models import (
    WaitEstimateResponse, TableRecommendation, ChatRequest, 
    ChatResponse, WaitlistEntry
)
from app.ai.predictor import calculate_wait_time
from app.ai.optimizer import recommend_tables_for_party
from app.ai.assistant import handle_conversational_chat

router = APIRouter(prefix="/api/ai", tags=["AI Engine"])

@router.get("/predict-wait", response_model=WaitEstimateResponse)
def get_wait_prediction(
    party_size: int = 2,
    preference: str = "First Available",
    session: Session = Depends(get_session)
):
    return calculate_wait_time(session, party_size, preference)

@router.get("/recommend-tables/{waitlist_id}", response_model=List[TableRecommendation])
def get_table_recommendations(
    waitlist_id: int,
    session: Session = Depends(get_session)
):
    entry = session.get(WaitlistEntry, waitlist_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Waitlist entry not found")
    
    return recommend_tables_for_party(session, entry.party_size, entry.preference)

@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    payload: ChatRequest,
    session: Session = Depends(get_session)
):
    return await handle_conversational_chat(
        session=session,
        messages=payload.messages,
        portal=payload.portal,
        context=payload.context
    )
