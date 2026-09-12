def test_create_table(client):
    response = client.post(
        "/api/tables",
        json={
            "table_number": "T01",
            "capacity": 4,
            "section": "Indoor",
            "status": "available",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] is not None
    assert data["table_number"] == "T01"
    assert data["capacity"] == 4
    assert data["status"] == "available"


def test_get_tables(client):
    client.post(
        "/api/tables",
        json={
            "table_number": "T01",
            "capacity": 2,
            "section": "Indoor",
        },
    )

    client.post(
        "/api/tables",
        json={
            "table_number": "T02",
            "capacity": 4,
            "section": "Patio",
        },
    )

    response = client.get("/api/tables")

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 2
    assert data[0]["table_number"] == "T01"
    assert data[1]["table_number"] == "T02"


def test_update_table_status(client):
    create_response = client.post(
        "/api/tables",
        json={
            "table_number": "T01",
            "capacity": 4,
            "section": "Indoor",
        },
    )

    table_id = create_response.json()["id"]

    response = client.patch(
        f"/api/tables/{table_id}/status",
        json={
            "status": "occupied",
            "current_party_name": "Alice",
            "waitlist_id": 123,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == table_id
    assert data["status"] == "occupied"
    assert data["current_party_name"] == "Alice"
    assert data["current_waitlist_id"] == 123
    assert data["seated_at"] is not None


def test_mark_table_ready(client):
    create_response = client.post(
        "/api/tables",
        json={
            "table_number": "T01",
            "capacity": 4,
        },
    )

    table_id = create_response.json()["id"]

    client.patch(
        f"/api/tables/{table_id}/status",
        json={
            "status": "occupied",
            "current_party_name": "Alice",
            "waitlist_id": 1,
        },
    )

    response = client.post(f"/api/tables/{table_id}/ready")

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "available"
    assert data["current_party_name"] is None
    assert data["current_waitlist_id"] is None
    assert data["seated_at"] is None


