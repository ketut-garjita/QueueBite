from datetime import datetime, timezone
from typing import List, Optional
from sqlmodel import Session, select
from app.models import Table, WaitlistEntry, TableTurnHistory, Restaurant, WaitEstimateResponse

def calculate_wait_time(
    session: Session,
    party_size: int,
    preference: str = "First Available"
) -> WaitEstimateResponse:
    """
    Intelligent Dynamic Wait-Time Estimator.
    Considers:
    1. Number of parties already waiting ahead with compatible party size.
    2. Tables matching the party size (capacity >= party_size and capacity <= party_size + 2).
    3. Elapsed dining duration of currently occupied compatible tables.
    4. Historical average turn times.
    """
    restaurant = session.exec(select(Restaurant)).first()
    avg_2p = restaurant.average_turn_minutes_2p if restaurant else 45
    avg_4p = restaurant.average_turn_minutes_4p if restaurant else 65
    avg_large = restaurant.average_turn_minutes_large if restaurant else 85

    # Determine baseline dining duration for party size
    if party_size <= 2:
        baseline_turn = avg_2p
    elif party_size <= 4:
        baseline_turn = avg_4p
    else:
        baseline_turn = avg_large

    # Count active queue ahead
    waiting_parties = session.exec(
        select(WaitlistEntry)
        .where(WaitlistEntry.status.in_(["waiting", "notified"]))
        .order_by(WaitlistEntry.joined_at.asc())
    ).all()
    
    queue_pos = len(waiting_parties) + 1

    # Find compatible tables
    all_tables = session.exec(select(Table)).all()
    compatible_tables = [
        t for t in all_tables 
        if t.capacity >= party_size and (preference in ["First Available", ""] or t.section.lower() == preference.lower())
    ]
    
    if not compatible_tables:
        # Fallback to any table >= party_size
        compatible_tables = [t for t in all_tables if t.capacity >= party_size]

    available_tables = [t for t in compatible_tables if t.status == "available"]

    # If there are available tables right now and no line ahead
    if available_tables and len(waiting_parties) == 0:
        return WaitEstimateResponse(
            party_size=party_size,
            preference=preference,
            estimated_wait_minutes=0,
            queue_position=1,
            confidence="High",
            reasoning=f"Table {available_tables[0].table_number} ({available_tables[0].section}) is available immediately."
        )

    # Calculate throughput and estimated minutes
    now = datetime.now(timezone.utc)
    occupied_tables = [t for t in compatible_tables if t.status == "occupied"]
    
    # Estimate time until next table frees up
    table_turn_times: List[int] = []
    for t in occupied_tables:
        if t.seated_at:
            # ensure seated_at is timezone aware
            s_at = t.seated_at if t.seated_at.tzinfo else t.seated_at.replace(tzinfo=timezone.utc)
            elapsed_mins = max(0, int((now - s_at).total_seconds() / 60))
            remaining = max(5, baseline_turn - elapsed_mins)
            table_turn_times.append(remaining)
        else:
            table_turn_times.append(baseline_turn // 2)

    table_turn_times.sort()

    # Queue delay calculation: each compatible table turns over every (baseline_turn) minutes
    num_comp = max(1, len(compatible_tables))
    turnover_rate_per_min = num_comp / baseline_turn

    # Queue wait calculation
    parties_ahead_compatible = sum(
        1 for p in waiting_parties 
        if p.party_size <= party_size + 2 and p.party_size >= party_size - 1
    )
    
    if table_turn_times:
        soonest_free = table_turn_times[0]
    else:
        soonest_free = 10

    # Wait formula
    estimated_mins = int(soonest_free + (parties_ahead_compatible * (baseline_turn / num_comp)))
    
    # Clamp to sensible minimum if there are people waiting
    if len(waiting_parties) > 0 and estimated_mins < 5:
        estimated_mins = 5 + (len(waiting_parties) * 4)

    # Round to nearest 5 minutes
    estimated_mins = max(5, (round(estimated_mins / 5.0) * 5))

    confidence = "High" if len(compatible_tables) >= 3 else "Medium"

    reasoning = (
        f"{len(waiting_parties)} parties waiting in queue. "
        f"{len(compatible_tables)} compatible tables in section '{preference}'. "
        f"Average dining turnover for party of {party_size} is ~{baseline_turn} mins."
    )

    return WaitEstimateResponse(
        party_size=party_size,
        preference=preference,
        estimated_wait_minutes=estimated_mins,
        queue_position=queue_pos,
        confidence=confidence,
        reasoning=reasoning
    )
