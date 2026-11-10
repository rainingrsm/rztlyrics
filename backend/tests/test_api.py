"""Проверяют только работающий каркас; успешный рендер эти тесты не подтверждают."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_is_explicitly_scaffold() -> None:
    assert client.get("/api/v1/health").json() == {"status": "ok", "stage": "scaffold"}


def test_business_endpoint_never_fakes_success() -> None:
    response = client.post("/api/v1/projects")
    assert response.status_code == 501
    assert response.json()["error"]["code"] == "NOT_IMPLEMENTED"


def test_validation_has_common_error_envelope() -> None:
    response = client.put("/api/v1/projects/not-a-uuid/lyrics", json={"lines": []})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_line_error_field_matches_frontend_contract() -> None:
    response = client.put(
        "/api/v1/projects/00000000-0000-0000-0000-000000000001/lyrics",
        json={"lines": [{"id": "one", "text": "Текст", "start_ms": -1, "end_ms": 1000}]},
    )
    assert response.status_code == 422
    assert response.json()["error"]["field"] == "lines[0].start_ms"


def test_contract_exposes_expected_routes() -> None:
    response = client.get("/api/openapi.json")
    assert response.status_code == 200
    paths = response.json()["paths"]
    assert "/api/v1/projects/{project_id}/renders" in paths
    assert "/api/v1/jobs/{job_id}/video" in paths
