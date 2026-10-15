"""
API-level tests using FastAPI's TestClient (no server, no external services).
"""
import importlib

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client(tmp_path, monkeypatch):
    # main.py loads jobs/reviews from ./storage at import time;
    # run from a temp dir so tests never touch real data
    monkeypatch.chdir(tmp_path)
    import main
    importlib.reload(main)
    return TestClient(main.app)


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_unknown_job_returns_404(client):
    response = client.get("/jobs/does-not-exist")
    assert response.status_code == 404
