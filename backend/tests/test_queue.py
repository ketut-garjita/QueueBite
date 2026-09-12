### POST /api/queue

{
    "customer_name": "Test Guest",
    "phone": "08123456789",
    "party_size": 2,
    "preference": "First Available"
}


def test_list_queue(client):
    client.post(
        "/api/queue",
        json={
            "customer_name": "Alice",
            "phone": "08111111111",
            "party_size": 2,
        },
    )

    response = client.get("/api/queue")

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["customer_name"] == "Alice"
    assert data[0]["status"] == "waiting"


def test_get_nonexistent_queue_entry(client):
    response = client.get("/api/queue/9999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Queue entry not found"
