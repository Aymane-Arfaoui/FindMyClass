import pytest
import json
from api.app.service import app
import requests
from unittest.mock import patch, Mock


@pytest.fixture
def client():
    with app.test_client() as client:
        yield client


def mock_requests_get_success(*args, **kwargs):
    mock_response = requests.Response()
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
    mock_response = requests.Response()
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


def mock_request_exception_with_response(*args, **kwargs):
    mock_response = Mock()
    mock_response.status_code = 403
    mock_response.text = 'Forbidden'
    exception = requests.exceptions.RequestException()
    exception.response = mock_response
    raise exception


@patch('requests.get', side_effect=mock_request_exception_with_response)
def test_get_building_list_request_exception_with_status_code(mock_get, client):
    response = client.get('/api/buildinglist')
    assert response.status_code == 403
    data = json.loads(response.data)
    assert 'error' in data
    assert data['error'] == 'Forbidden'


def mock_request_exception_without_response(*args, **kwargs):
    exception = requests.exceptions.RequestException("Something went wrong")
    exception.response = None  # Simulate no response attached
    raise exception


@patch('requests.get', side_effect=mock_request_exception_without_response)
def test_get_building_list_request_exception_without_response(mock_get, client):
    response = client.get('/api/buildinglist')
    assert response.status_code == 500
    data = json.loads(response.data)
    assert 'error' in data
    assert data['error'] == 'Failed to fetch building list'
