import pytest
from flask import Flask, jsonify
from unittest.mock import patch
from api.app.navigation import navigation_routes

# Create a simple test Flask app to test the routes
@pytest.fixture
def app():
    app = Flask(__name__)
    app.register_blueprint(navigation_routes)
    return app

@pytest.fixture
def client(app):
    return app.test_client()


# Test for missing required parameters (startId, endId)
def test_missing_parameters(client):
    response = client.get('/indoorNavigation?startId=&endId=&campus=hall')
    assert response.status_code == 400
    assert b"Missing required parameters" in response.data

# Test for invalid campus (campus not found)
def test_invalid_campus(client):
    with patch('os.path.exists', return_value=False):
        response = client.get('/indoorNavigation?startId=start1&endId=end1&campus=invalidCampus')
    assert response.status_code == 400
    assert b"Campus not found" in response.data

# Test for valid campus but no path found
def test_no_path_found(client):
    response = client.get('/indoorNavigation?startId=start1&endId=end1&campus=hall')
    assert response.status_code == 404
    assert b"Destination inaccessible from Start location" in response.data

# Test for valid parameters and path found
def test_valid_navigation(client):
    response = client.get('/indoorNavigation?startId=h2_209&endId=h8_803&campus=hall')
    assert response.status_code == 200
    assert b"h2_209" in response.data
    assert b"h2_escalator_to_h4" in response.data
    assert b"h8_escalator_from_h7" in response.data
    assert b"h8_803" in response.data

# Test for accessibility graph subgraph
def test_accessibility_graph(client):
    response = client.get('/indoorNavigation?startId=h2_209&endId=h8_803&campus=hall&accessibility=true')
    assert response.status_code == 200
    assert b"h2_209" in response.data
    assert b"h2_elevator" in response.data
    assert b"h8_elevator" in response.data
    assert b"h8_803" in response.data


