import pytest
from flask import url_for


def test_users_page_structure(auth_client):
    """Test the structure of the users page."""
    response = auth_client.get("/users")
    assert response.status_code == 200

    # Check for key elements
    assert b"Users & Sharing" in response.data
    assert b"users-page" in response.data
    assert b"users-grid" in response.data

    # Check for the tabs
    assert b"tab-btn" in response.data
    assert b"shared-todos" in response.data
    assert b"shared-events" in response.data

    # Check for empty states (since we just added them)
    assert b"No shared todos" in response.data
    assert b"No shared events" in response.data
    assert b"No shared items" in response.data


def test_users_page_access_control(client):
    """Test that the users page is protected."""
    response = client.get("/users")
    assert response.status_code == 302  # Redirect to login
    assert "/login" in response.headers["Location"]
