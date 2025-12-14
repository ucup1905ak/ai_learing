import pytest
from flask import url_for


def test_dashboard_access(auth_client):
    """Test that the dashboard is accessible after login."""
    response = auth_client.get("/dashboard")
    assert response.status_code == 200
    assert b"TaskFlow" in response.data
    assert b"Dashboard" in response.data
    assert b"sidebar" in response.data


def test_calendar_page_structure(auth_client):
    """Test the structure of the calendar page."""
    response = auth_client.get("/calendar")
    assert response.status_code == 200

    # Check for key elements
    assert b"Calendar" in response.data
    assert b"calendar-page" in response.data
    assert b"calendar-grid" in response.data

    # Check for the new CSS class usage (if any specific ones were added,
    # though mostly we changed the CSS file content, not the HTML classes yet.
    # We can check for the existence of the buttons with btn classes)
    assert b"btn btn-primary" in response.data
    assert b"btn btn-secondary" in response.data

    # Check for the event form template
    assert b"event-form-template" in response.data


def test_css_loading(auth_client):
    """Test that CSS files are linked correctly."""
    response = auth_client.get("/dashboard")
    assert response.status_code == 200
    assert b"css/style.css" in response.data

    response = auth_client.get("/calendar")
    assert response.status_code == 200
    assert b"css/calendar.css" in response.data


def test_login_page_structure(client):
    """Test the login page structure."""
    response = client.get("/login")
    assert response.status_code == 200
    assert b"Login" in response.data
    assert b"username" in response.data
    assert b"password" in response.data
