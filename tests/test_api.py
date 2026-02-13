import os
import sys
from pathlib import Path

# Ensure src is importable
ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))

from fastapi.testclient import TestClient
import app as app_module

client = TestClient(app_module.app)


def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    assert "Basketball" in data


def test_signup_success_and_duplicate_cleanup():
    activity = "Basketball"
    email = "testuser@example.com"

    participants = app_module.activities[activity]["participants"]
    # Ensure clean start
    if email in participants:
        participants.remove(email)

    # Sign up should succeed
    res = client.post(f"/activities/{activity}/signup?email={email}")
    assert res.status_code == 200
    assert email in app_module.activities[activity]["participants"]

    # Duplicate signup should be rejected
    res2 = client.post(f"/activities/{activity}/signup?email={email}")
    assert res2.status_code == 400

    # Cleanup
    if email in app_module.activities[activity]["participants"]:
        app_module.activities[activity]["participants"].remove(email)


def test_signup_nonexistent_activity():
    res = client.post("/activities/NoSuchActivity/signup?email=a@b.com")
    assert res.status_code == 404
