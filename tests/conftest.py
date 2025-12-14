import pytest
import os
import sys
import tempfile

# Add the project root to the path so we can import todo_app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from todo_app.app import app, init_db, get_db


@pytest.fixture
def client():
    db_fd, db_path = tempfile.mkstemp()
    app.config["TESTING"] = True
    app.config["DATABASE"] = db_path

    # Override the DATABASE global in app.py for the duration of the test
    # This is a bit hacky because app.py uses a global variable for the DB path
    # A better approach in app.py would be to use app.config['DATABASE']
    import todo_app.app

    todo_app.app.DATABASE = db_path

    with app.test_client() as client:
        with app.app_context():
            init_db()
        yield client

    os.close(db_fd)
    os.unlink(db_path)


@pytest.fixture
def auth_client(client):
    # Register and login a user
    client.post(
        "/register",
        data={
            "username": "testuser",
            "email": "test@example.com",
            "password": "password123",
        },
    )
    client.post("/login", data={"username": "testuser", "password": "password123"})
    return client
