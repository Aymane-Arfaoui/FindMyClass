import pytest
from flask import Flask, jsonify
from unittest.mock import patch, MagicMock
from api.app.navigation import navigation_routes
import json

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
    assert b"Missing required parameter 'startId'" in response.data

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


# Test for multiple destinations
def test_multiple_destinations(client):
    response = client.get('/indoorNavigation?startId=h2_209&destinations[]=h8_803&destinations[]=h4_405&campus=hall')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'paths' in data
    assert isinstance(data['paths'], list)

# Test for no valid paths to multiple destinations
def test_no_valid_paths_multiple_destinations(client):
    response = client.get('/indoorNavigation?startId=invalid_start&destinations[]=invalid_dest1&destinations[]=invalid_dest2&campus=hall')
    assert b"No path found or invalid destination" in response.data

# Test health check endpoint
def test_health_check(client):
    response = client.get('/health')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'healthy'
    assert data['service'] == 'navigation'


def test_process_task_chat_no_query(client):
    test_data = {'tasks': []}
    response = client.post('/chat/tasks', json=test_data)
    assert response.status_code == 400
    assert b"No query provided" in response.data

def test_process_task_chat_invalid_query(client):
    test_data = {
        'query': 'Hello there',
        'tasks': []
    }
    response = client.post('/chat/tasks', json=test_data)
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'I can help you with your tasks!' in data['response']

# Test navigation chat endpoint with direct pattern
def test_process_navigation_chat_direct_pattern(client):
    test_data = {'query': 'how to go from h 109 to h 110'}
    with patch('api.app.navigation.ai_nav.find_shortest_path') as mock_find_path:
        mock_find_path.return_value = {'path': ['h1_109', 'h1_110']}
        response = client.post('/chat/navigation', json=test_data)
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'response' in data
        mock_find_path.assert_called_with('h1_109', 'h1_110')

# Test navigation chat endpoint with room extraction
def test_process_navigation_chat_room_extraction(client):
    test_data = {'query': 'How do I get from H-109 to H-110?'}
    with patch('api.app.navigation.extract_rooms', return_value=('h1_109', 'h1_110')):
        with patch('api.app.navigation.ai_nav.find_shortest_path') as mock_find_path:
            mock_find_path.return_value = {'path': ['h1_109', 'h1_110']}
            response = client.post('/chat/navigation', json=test_data)
            assert response.status_code == 200
            data = json.loads(response.data)
            assert 'response' in data

# Test navigation chat endpoint with no rooms found
def test_process_navigation_chat_no_rooms(client):
    test_data = {'query': 'Hello there'}
    response = client.post('/chat/navigation', json=test_data)
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'I couldn\'t identify the rooms' in data['response']

# Test navigation chat endpoint error handling
def test_process_navigation_chat_error(client):
    test_data = {'query': 'How do I get from H-109 to H-110?'}
    with patch('api.app.navigation.ai_nav.find_shortest_path', side_effect=Exception('Test error')):
        response = client.post('/chat/navigation', json=test_data)
        assert response.status_code == 500
        data = json.loads(response.data)
        assert 'Failed to process navigation request' in data['error']

# Test get_sub_graph function
def test_get_sub_graph():
    from api.app.navigation import get_sub_graph
    from networkx import Graph

    # Create a test graph
    test_graph = Graph()
    test_graph.add_edge('node1', 'node2')
    test_graph.add_edge('node1', 'stairs_node')
    test_graph.add_edge('node2', 'escalator_node')

    # Mock the input graph
    mock_g = MagicMock()
    mock_g.graph = test_graph

    # Call the function
    result = get_sub_graph(mock_g)

    # Check that stairs and escalator edges are removed
    assert ('node1', 'node2') in result.edges()
    assert ('node1', 'stairs_node') not in result.edges()
    assert ('node2', 'escalator_node') not in result.edges()

# Test with different campus values
@pytest.mark.parametrize("campus", ["hall", "mb", "cc"])
def test_different_campuses(client, campus):
    with patch('os.path.exists', return_value=True):
        response = client.get(f'/indoorNavigation?startId=start1&endId=end1&campus={campus}')
        assert response.status_code in [200, 404]  # Either valid response or no path found

# Test with different accessibility values
@pytest.mark.parametrize("accessibility", ["true", "false", "TRUE", "FALSE", "True", "False"])
def test_accessibility_parameter_casing(client, accessibility):
    response = client.get(f'/indoorNavigation?startId=h2_209&endId=h8_803&campus=hall&accessibility={accessibility}')
    assert response.status_code == 200

# Test with invalid accessibility value
def test_invalid_accessibility_parameter(client):
    response = client.get('/indoorNavigation?startId=h2_209&endId=h8_803&campus=hall&accessibility=invalid')
    assert response.status_code == 200
