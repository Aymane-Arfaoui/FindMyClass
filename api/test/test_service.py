import pytest
import json
from api.app.service import app  # Make sure this import matches your file structure
import requests
from requests.models import Response
from unittest.mock import patch

@pytest.fixture
def client():
    with app.test_client() as client:
        yield client

def mock_requests_get_success(*args, **kwargs):
    mock_response = Response()
    mock_response.status_code = 200
    mock_response._content = b'{"buildings": [{"id": 1, "name": "Building 1"}]}'
    return mock_response

@patch('requests.get', side_effect=mock_requests_get_success)
def test_get_building_list_success(mock_get, client):
    response = client.get('/api/buildinglist')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'buildings' in data
    assert len(data['buildings']) == 1
    assert data['buildings'][0]['name'] == 'Building 1'


def mock_failed_requests_get(*args, **kwargs):
    mock_response = Response()
    mock_response.status_code = 500
    mock_response._content = b'{"error": "Internal Server Error"}'
    return mock_response

@patch('requests.get', side_effect=mock_failed_requests_get)
def test_get_building_list_api_error(mock_get, client):
    response = client.get('/api/buildinglist')
    assert response.status_code == 500
    data = json.loads(response.data)
    assert 'error' in data
    assert data['error'] == 'Internal Server Error'