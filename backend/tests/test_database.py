from sqlmodel import Session, select

from app.models import (
    Restaurant,
    Table,
    WaitlistEntry,
    TableTurnHistory,
    NotificationLog,
)


def test_database_tables_exist(test_engine):
    with Session(test_engine) as session:
        restaurant = Restaurant(name="Test Restaurant")
        session.add(restaurant)
        session.commit()
        session.refresh(restaurant)

        assert restaurant.id is not None

        table = Table(
            table_number="T01",
            capacity=4,
            section="Indoor",
        )
        session.add(table)
        session.commit()
        session.refresh(table)

        assert table.id is not None


def test_database_can_store_waitlist_entry(test_engine):
    with Session(test_engine) as session:
        entry = WaitlistEntry(
            customer_name="Test Guest",
            phone="08123456789",
            party_size=2,
        )

        session.add(entry)
        session.commit()
        session.refresh(entry)

        assert entry.id is not None
        assert entry.customer_name == "Test Guest"
        assert entry.status == "waiting"
        assert entry.estimated_wait_minutes == 15