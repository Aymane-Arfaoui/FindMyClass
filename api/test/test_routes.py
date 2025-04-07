import pytest
from flask import Flask, json
from unittest.mock import patch, MagicMock
from api.app.routes import api

@pytest.fixture
def client():
    app = Flask(__name__)
    app.register_blueprint(api)
    return app.test_client()

# ------------------ Health Check ------------------

def test_health_check(client):
    response = client.get('/health')
    assert response.status_code == 200
    assert response.json['service'] == 'navigation'
    assert response.json['status'] == 'healthy'

# ------------------ Task Query ------------------

@patch("api.app.routes.handle_task_query", return_value="Test response")
def test_task_query_response(mock_task, client):
    payload = {
        "query": "What tasks do I have today?",
        "tasks": [{"taskName": "Test"}]
    }
    response = client.post('/chat/tasks', json=payload)
    assert response.status_code == 200
    assert "Test response" in response.json['response']

# ------------------ Navigation Query ------------------

@patch("api.app.routes.is_navigation_query", return_value=True)
@patch("api.app.routes.extract_rooms", return_value=("h1_101", "h1_102"))
@patch("api.app.routes.nav_api.find_shortest_path", return_value={"path": ["h1_101", "h1_102"], "distance": 10})
@patch("api.app.routes.interpret_path", return_value="Go from H-101 to H-102")
def test_navigation_query_success(mock_interpret, mock_path, mock_extract, mock_nav, client):
    payload = {"query": "From H101 to H102"}
    response = client.post('/chat/tasks', json=payload)
    assert response.status_code == 200
    assert "H-102" in response.json['response']

# ------------------ Edge/Error Handling ------------------

def test_non_json_request(client):
    response = client.post('/chat/tasks', data="Not JSON", content_type='text/plain')
    assert response.status_code == 400
    assert response.json['error'] == 'Request must be JSON'

def test_missing_query_field(client):
    response = client.post('/chat/tasks', json={"tasks": []})
    assert response.status_code == 400
    assert response.json['error'] == 'Query is required'

@patch("api.app.routes.is_navigation_query", return_value=True)
@patch("api.app.routes.extract_rooms", return_value=(None, None))
def test_navigation_query_missing_rooms(mock_extract, mock_nav, client):
    payload = {"query": "How do I get somewhere?"}
    response = client.post('/chat/tasks', json=payload)
    assert "couldn't identify the rooms" in response.json['response'].lower()

@patch("api.app.routes.is_navigation_query", return_value=True)
@patch("api.app.routes.extract_rooms", return_value=("h1_101", "h1_102"))
@patch("api.app.routes.nav_api.find_shortest_path", side_effect=Exception("Path error"))
def test_navigation_query_path_finding_exception(mock_path, mock_extract, mock_nav, client):
    payload = {"query": "From H101 to H102"}
    response = client.post('/chat/tasks', json=payload)
    assert "error finding path" in response.json['response'].lower()


@patch("api.app.routes.is_navigation_query", side_effect=Exception("Simulated crash"))
def test_generic_server_error(mock_nav_check, client):
    payload = {"query": "Anything", "tasks": []}
    response = client.post('/chat/tasks', json=payload)
    assert response.status_code == 200
    assert "error" in response.json['response'].lower()

