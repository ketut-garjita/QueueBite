import re
from typing import List, Optional
import httpx
from sqlmodel import Session, select
from app.config import settings
from app.models import ChatMessage, ChatResponse, WaitlistEntry, Table, Restaurant

async def call_openai_llm(messages: List[ChatMessage], system_prompt: str) -> Optional[str]:
    if not settings.OPENAI_API_KEY:
        return None
    try:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        payload_messages = [{"role": "system", "content": system_prompt}] + [
            {"role": m.role, "content": m.content} for m in messages
        ]
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                url,
                headers=headers,
                json={"model": "gpt-4o-mini", "messages": payload_messages, "temperature": 0.7}
            )
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"]
    except Exception:
        pass
    return None

async def call_gemini_llm(messages: List[ChatMessage], system_prompt: str) -> Optional[str]:
    if not settings.GEMINI_API_KEY:
        return None
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
        contents = [{"role": "user", "parts": [{"text": system_prompt}]}]
        for m in messages:
            role = "user" if m.role in ["user", "system"] else "model"
            contents.append({"role": role, "parts": [{"text": m.content}]})
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json={"contents": contents})
            if resp.status_code == 200:
                data = resp.json()
                return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception:
        pass
    return None

def local_guest_response(query: str, session: Session, context: Optional[dict]) -> tuple[str, List[str]]:
    q = query.lower()
    
    # Active waitlist info
    waiting = session.exec(select(WaitlistEntry).where(WaitlistEntry.status == "waiting")).all()
    
    entry_name = context.get("customer_name") if context else None
    user_entry = None
    if entry_name:
        user_entry = next((e for e in waiting if e.customer_name.lower() == entry_name.lower()), None)
    
    if any(k in q for k in ["how long", "wait time", "when", "how much longer", "status", "estimate"]):
        if user_entry:
            mins = user_entry.estimated_wait_minutes
            return (
                f"Hello {user_entry.customer_name}! Your current estimated wait is approximately **{mins} minutes**. "
                f"You are party size {user_entry.party_size} with '{user_entry.preference}' preference. "
                "We will alert you on this screen and send a chime the moment your table is ready!",
                ["Can we switch to patio?", "Running 5 minutes late", "View drink menu"]
            )
        return (
            f"Currently there are {len(waiting)} parties in line. The average wait is between 15 to 35 minutes depending on party size and section.",
            ["Join Waitlist", "Can we sit outside?", "Dietary options"]
        )

    if any(k in q for k in ["patio", "outside", "outdoor", "indoor", "bar"]):
        return (
            "We have lovely outdoor patio seating with heated lamps and covered umbrellas! "
            "Patio tables are in high demand during dinner rushes, but you can select 'Patio' as your preference when joining or request an update with the host.",
            ["Check patio wait time", "Keep first available", "Menu questions"]
        )

    if any(k in q for k in ["dietary", "vegan", "gluten", "vegetarian", "allergy", "allergies", "kid", "children"]):
        return (
            "The Rustic Olive proudly offers extensive vegetarian, vegan, and gluten-sensitive options! "
            "Our fresh gluten-free penne and wood-fired seasonal vegetables are guest favorites. "
            "Please mention any severe allergies to your server upon being seated.",
            ["View popular dishes", "Check my wait time", "Drink specials"]
        )

    if any(k in q for k in ["late", "delay", "running late", "hold", "minutes late"]):
        return (
            "No worries at all! We've noted that you might be running slightly late. "
            "We hold notified tables for up to 10 minutes. If you need more time, the host stand can hold your place at the top of the queue.",
            ["I am on my way!", "What is our current spot?"]
        )

    if any(k in q for k in ["cancel", "leave", "drop"]):
        return (
            "You can cancel your waitlist spot anytime using the 'Cancel Spot' button on your status card, "
            "or simply let us know and we will release the table for the next party.",
            ["Keep my spot", "Cancel my spot"]
        )

    return (
        "Welcome to The Rustic Olive! I am your QueueBite dining assistant. "
        "I can help you check your live wait time, update seating preferences, or answer questions about our menu and dining experience.",
        ["How long is the wait?", "Can we sit on the patio?", "Do you have vegetarian options?"]
    )

def local_host_response(query: str, session: Session, context: Optional[dict]) -> tuple[str, List[str]]:
    q = query.lower()
    waiting = session.exec(
        select(WaitlistEntry)
        .where(WaitlistEntry.status.in_(["waiting", "notified"]))
        .order_by(WaitlistEntry.joined_at.asc())
    ).all()
    tables = session.exec(select(Table)).all()
    available_tables = [t for t in tables if t.status == "available"]
    cleaning_tables = [t for t in tables if t.status == "cleaning"]

    if any(k in q for k in ["longest", "next", "who", "first"]):
        if waiting:
            first_p = waiting[0]
            return (
                f"**{first_p.customer_name}** (Party of {first_p.party_size}, {first_p.preference}) has been waiting the longest. "
                f"Status: `{first_p.status.upper()}`. Estimated wait was {first_p.estimated_wait_minutes} mins.",
                [f"Seat {first_p.customer_name}", "Show available tables", "Queue summary"]
            )
        return ("The waitlist is currently empty! All parties have been seated.", ["View floor status", "Add walk-in party"])

    if any(k in q for k in ["summary", "overview", "busy", "queue status", "how busy"]):
        return (
            f"**Host Stand Live Briefing:**\n"
            f"- **Waitlist:** {len(waiting)} active parties waiting\n"
            f"- **Tables Available:** {len(available_tables)} of {len(tables)}\n"
            f"- **Tables in Cleaning/Bus:** {len(cleaning_tables)}\n"
            f"- **Recommended focus:** Turn cleaned tables quickly to seat next waiting parties.",
            ["Who has been waiting longest?", "Show available tables", "Suggest table assignment"]
        )

    if any(k in q for k in ["table", "available", "suggest", "seat"]):
        avail_str = ", ".join([f"T{t.table_number} ({t.section}, {t.capacity}p)" for t in available_tables]) if available_tables else "None"
        return (
            f"**Available Tables Right Now:** {avail_str}.\n"
            f"Use the Table Optimizer on the dashboard to match the best party size and minimize turnaround time.",
            ["Seat longest waiting party", "Show queue summary", "Check patio tables"]
        )

    return (
        "QueueBite Host Copilot ready. I can summarize queue backlog, pinpoint the next party to seat, "
        "and recommend table allocations across Main Dining, Patio, and Bar Lounge.",
        ["Queue summary", "Who has been waiting the longest?", "Show available tables"]
    )

async def handle_conversational_chat(
    session: Session,
    messages: List[ChatMessage],
    portal: str = "guest",
    context: Optional[dict] = None
) -> ChatResponse:
    latest_user_msg = next((m.content for m in reversed(messages) if m.role == "user"), "")
    
    # Check if external LLM key is configured
    restaurant = session.exec(select(Restaurant)).first()
    rest_name = restaurant.name if restaurant else "The Rustic Olive"
    
    system_prompt = (
        f"You are the friendly and efficient AI Assistant for '{rest_name}', a lively Mediterranean restaurant using QueueBite.\n"
        f"User portal mode: {portal.upper()}.\n"
        f"Context provided: {context}\n"
        f"Keep responses concise (2-4 sentences), warm, and helpful. Guide users on wait times, seating, and operations."
    )
    
    # Try external LLM if available
    llm_reply = await call_openai_llm(messages, system_prompt) or await call_gemini_llm(messages, system_prompt)
    if llm_reply:
        suggested = ["Check wait time", "Seating preferences", "Menu details"] if portal == "guest" else ["Queue summary", "Next party", "Available tables"]
        return ChatResponse(reply=llm_reply, suggested_actions=suggested)
    
    # Built-in high accuracy fallback
    if portal == "host":
        reply, suggested = local_host_response(latest_user_msg, session, context)
    else:
        reply, suggested = local_guest_response(latest_user_msg, session, context)
        
    return ChatResponse(reply=reply, suggested_actions=suggested)
