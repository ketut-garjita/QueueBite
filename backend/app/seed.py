from datetime import datetime, timezone, timedelta
from sqlmodel import Session, select
from app.models import Restaurant, Table, WaitlistEntry, TableTurnHistory, NotificationLog

def seed_demo_data(session: Session, force: bool = False):
    existing_restaurant = session.exec(select(Restaurant)).first()
    if existing_restaurant and not force:
        return

    # Clear existing data if force reset
    if force:
        for model in [NotificationLog, TableTurnHistory, WaitlistEntry, Table, Restaurant]:
            for item in session.exec(select(model)).all():
                session.delete(item)
        session.commit()

    now = datetime.now(timezone.utc)

    # 1. Create Restaurant Profile
    restaurant = Restaurant(
        name="The Rustic Olive",
        cuisine="Italian Mediterranean",
        address="104 Olive Grove Way, San Francisco, CA",
        average_turn_minutes_2p=45,
        average_turn_minutes_4p=65,
        average_turn_minutes_large=85
    )
    session.add(restaurant)
    session.commit()

    # 2. Create Tables (12 tables across 3 sections)
    tables = [
        # Indoor Dining
        Table(table_number="1", capacity=2, section="Indoor", status="available"),
        Table(table_number="2", capacity=2, section="Indoor", status="available"),
        Table(
            table_number="3", capacity=4, section="Indoor", status="occupied",
            current_party_name="Garcia Party", seated_at=now - timedelta(minutes=42)
        ),
        Table(
            table_number="4", capacity=4, section="Indoor", status="occupied",
            current_party_name="Miller Family", seated_at=now - timedelta(minutes=15)
        ),
        Table(table_number="5", capacity=6, section="Indoor", status="available"),
        Table(table_number="6", capacity=6, section="Indoor", status="available"),

        # Patio
        Table(table_number="7", capacity=2, section="Patio", status="cleaning"),
        Table(
            table_number="8", capacity=4, section="Patio", status="occupied",
            current_party_name="Chen Party", seated_at=now - timedelta(minutes=58)
        ),
        Table(table_number="9", capacity=4, section="Patio", status="available"),
        Table(table_number="10", capacity=4, section="Patio", status="available"),

        # Bar Lounge
        Table(
            table_number="11", capacity=2, section="Bar Lounge", status="occupied",
            current_party_name="Dave & Amy", seated_at=now - timedelta(minutes=28)
        ),
        Table(table_number="12", capacity=4, section="Bar Lounge", status="available"),
    ]
    for t in tables:
        session.add(t)
    session.commit()

    # 3. Create Waiting Parties
    queue_entries = [
        WaitlistEntry(
            customer_name="Sophia Loren",
            phone="415-555-0192",
            party_size=2,
            preference="Patio",
            notes="Window or quiet outdoor table if possible",
            status="notified",
            joined_at=now - timedelta(minutes=20),
            estimated_wait_minutes=15,
            notified_at=now - timedelta(minutes=2)
        ),
        WaitlistEntry(
            customer_name="Marcus Thorne",
            phone="415-555-0144",
            party_size=4,
            preference="Indoor",
            notes="Celebrating 10th anniversary",
            status="waiting",
            joined_at=now - timedelta(minutes=14),
            estimated_wait_minutes=15
        ),
        WaitlistEntry(
            customer_name="Aisha Khan",
            phone="415-555-0187",
            party_size=6,
            preference="First Available",
            notes="Need 1 high chair",
            status="waiting",
            joined_at=now - timedelta(minutes=8),
            estimated_wait_minutes=25
        ),
        WaitlistEntry(
            customer_name="Liam O'Connor",
            phone="415-555-0112",
            party_size=2,
            preference="Bar Lounge",
            notes="Quick dinner before a movie",
            status="waiting",
            joined_at=now - timedelta(minutes=2),
            estimated_wait_minutes=10
        ),
    ]
    for qe in queue_entries:
        session.add(qe)
    session.commit()

    # 4. Create Simulated SMS Notification Logs
    notifications = [
        NotificationLog(
            entry_id=queue_entries[0].id,
            recipient_name="Sophia Loren",
            recipient_phone="415-555-0192",
            message="QueueBite: Hi Sophia Loren! You're on the waitlist at The Rustic Olive. Party of 2. Est. wait: ~15 mins.",
            sent_at=now - timedelta(minutes=20)
        ),
        NotificationLog(
            entry_id=queue_entries[0].id,
            recipient_name="Sophia Loren",
            recipient_phone="415-555-0192",
            message="🎉 Table Ready! Hi Sophia Loren, your table at The Rustic Olive is now ready! Please head to the host stand within the next 10 minutes.",
            sent_at=now - timedelta(minutes=2)
        ),
        NotificationLog(
            entry_id=queue_entries[1].id,
            recipient_name="Marcus Thorne",
            recipient_phone="415-555-0144",
            message="QueueBite: Hi Marcus Thorne! You're on the waitlist at The Rustic Olive. Party of 4. Est. wait: ~15 mins.",
            sent_at=now - timedelta(minutes=14)
        ),
        NotificationLog(
            entry_id=queue_entries[2].id,
            recipient_name="Aisha Khan",
            recipient_phone="415-555-0187",
            message="QueueBite: Hi Aisha Khan! You're on the waitlist at The Rustic Olive. Party of 6. Est. wait: ~25 mins.",
            sent_at=now - timedelta(minutes=8)
        ),
    ]
    for n in notifications:
        session.add(n)

    # 5. Historical Table Turn records for ML calibration
    sample_turns = [
        TableTurnHistory(table_number="1", party_size=2, duration_minutes=42, seated_at=now - timedelta(hours=3), completed_at=now - timedelta(hours=2, minutes=18)),
        TableTurnHistory(table_number="3", party_size=4, duration_minutes=68, seated_at=now - timedelta(hours=3, minutes=10), completed_at=now - timedelta(hours=2, minutes=2)),
        TableTurnHistory(table_number="5", party_size=6, duration_minutes=82, seated_at=now - timedelta(hours=4), completed_at=now - timedelta(hours=2, minutes=38)),
        TableTurnHistory(table_number="7", party_size=2, duration_minutes=48, seated_at=now - timedelta(hours=2), completed_at=now - timedelta(hours=1, minutes=12)),
    ]
    for st in sample_turns:
        session.add(st)

    session.commit()
