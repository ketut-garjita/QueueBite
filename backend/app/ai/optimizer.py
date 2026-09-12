from datetime import datetime, timezone
from typing import List
from sqlmodel import Session, select
from app.models import Table, WaitlistEntry, TableRecommendation

def recommend_tables_for_party(
    session: Session,
    party_size: int,
    preference: str = "First Available"
) -> List[TableRecommendation]:
    """
    AI Table Optimizer:
    Evaluates all restaurant tables and calculates a suitability score based on:
    - Capacity efficiency (no oversized seat wastage)
    - Current availability status
    - Section preference alignment
    - Dining turnaround projections
    """
    tables = session.exec(select(Table)).all()
    recommendations: List[TableRecommendation] = []
    now = datetime.now(timezone.utc)

    for t in tables:
        # Cannot seat a party larger than table capacity
        if t.capacity < party_size:
            continue

        score = 0.0
        reasons = []

        # 1. Capacity Fit Score (Max 50 pts)
        seat_diff = t.capacity - party_size
        if seat_diff == 0:
            score += 50.0
            reasons.append(f"Perfect capacity fit ({t.capacity} seats for {party_size} guests)")
        elif seat_diff == 1:
            score += 35.0
            reasons.append(f"Good fit ({t.capacity} seats, 1 extra)")
        elif seat_diff == 2:
            score += 20.0
            reasons.append(f"Acceptable ({t.capacity} seats, 2 extra)")
        else:
            score += 5.0
            reasons.append(f"Oversized table ({t.capacity} seats for {party_size} guests)")

        # 2. Availability Status Score (Max 40 pts)
        if t.status == "available":
            score += 40.0
            reasons.append("Ready for immediate seating")
        elif t.status == "cleaning":
            score += 25.0
            reasons.append("Currently being bused/cleaned (ready in ~2 mins)")
        elif t.status == "occupied":
            if t.seated_at:
                s_at = t.seated_at if t.seated_at.tzinfo else t.seated_at.replace(tzinfo=timezone.utc)
                elapsed = int((now - s_at).total_seconds() / 60)
                expected_turn = 50 if t.capacity <= 2 else 70
                remaining = max(0, expected_turn - elapsed)
                if remaining <= 10:
                    score += 15.0
                    reasons.append(f"Occupied, but dining finish projected in ~{remaining} mins")
                else:
                    score += 5.0
                    reasons.append(f"Occupied (elapsed {elapsed} mins)")
            else:
                score += 0.0
                reasons.append("Occupied")
        else:
            score -= 10.0
            reasons.append(f"Status is {t.status}")

        # 3. Section Preference (Max 15 pts)
        if preference == "First Available" or preference == "":
            score += 10.0
        elif t.section.lower() == preference.lower():
            score += 15.0
            reasons.append(f"Matches preferred section '{t.section}'")
        else:
            reasons.append(f"Section is '{t.section}' (guest asked for '{preference}')")

        recommendations.append(TableRecommendation(
            table_id=t.id,
            table_number=t.table_number,
            capacity=t.capacity,
            section=t.section,
            status=t.status,
            score=round(score, 1),
            reason="; ".join(reasons)
        ))

    # Sort descending by score
    recommendations.sort(key=lambda x: x.score, reverse=True)
    return recommendations
