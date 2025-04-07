import os
from flask import Blueprint, request, jsonify
from flask_cors import CORS, cross_origin
from .graph.Graph2 import Graph
from pathlib import Path
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from .chat import handle_task_query, is_task_query, extract_rooms, interpret_path
from .aiapi import AINavigationAPI

# import app.graph.Graph as Graph
# from collections import defaultdict

navigation_routes = Blueprint('navigation', __name__)
CORS(navigation_routes)  # Enable CORS for all routes in this blueprint
ai_nav = AINavigationAPI()

g = {}
accessibility_graph = {}

def validate_query(data):
    """
    Helper function to validate query data from requests.
    
    Args:
        data (dict): The request data containing the query
        
    Returns:
        tuple: (query, error_response)
            - query: The validated query string if valid, None otherwise
            - error_response: JSON response with error if invalid, None if valid
    """
    if not data:
        return None, (jsonify({"error": "No data provided"}), 400)
        
    query = data.get('query')
    if not query:
        return None, (jsonify({"error": "No query provided"}), 400)
        
    return query, None

@navigation_routes.route('/indoorNavigation', methods=['GET'])
@cross_origin()
def indoor_navigation():
    start_id = request.args.get('startId')
    end_id = request.args.get('endId')
    destinations = request.args.getlist('destinations[]')
    campus = request.args.get('campus')
    accessibility = request.args.get('accessibility')
    current_directory = Path(os.getcwd())

    #    If we're not in the 'api' directory, prepend it to the path
    if 'api' not in current_directory.parts:
        current_directory = current_directory / 'api'

    file_path = current_directory / f'app/data/campus_jsons/{campus}'

    if os.path.exists(file_path) is False:
        return jsonify({"error": "Campus not found"}), 400

    if not start_id:
        return jsonify({"error": "Missing required parameter 'startId'"}), 400

    if not end_id and not destinations:
        return jsonify({"error": "Must provide either 'endId' or 'destinations[]'"}), 400

    if campus not in g:
        g[campus] = Graph()
        g[campus].load_from_json_folder(file_path)

    if accessibility and accessibility.lower() == 'true':
        if campus not in accessibility_graph:
            accessibility_graph[campus] = Graph()
            accessibility_graph[campus].graph = get_sub_graph(g[campus])
        graph_to_use = accessibility_graph[campus]

    else:
        graph_to_use = g[campus]

    if end_id:
        path = graph_to_use.find_shortest_path(start_id, end_id)
        if not path:
            return jsonify({"error": "Destination inaccessible from Start location"}), 404
        return jsonify({"path": path}), 200

    result = graph_to_use.find_paths_to_multiple_destinations(start_id, destinations)
    if not result["paths"]:
        return jsonify({"error": "No valid paths found"}), 404

    return jsonify(result), 200


def get_sub_graph(g):
    nx_graph = g.graph
    allowed_edges = set(nx_graph.edges())

    # Remove escalator and stairs edges
    for edge in nx_graph.edges():
        if "escalator" in edge[0] or "stairs" in edge[0] or "escalator" in edge[1] or "stairs" in edge[1]:
            allowed_edges.remove(edge)

    # Create a subgraph with allowed edges only
    return nx_graph.edge_subgraph(allowed_edges).copy()

@navigation_routes.route('/chat/tasks', methods=['POST'])
@cross_origin()
def process_task_chat():
    try:
        data = request.get_json()
        print('Received request data:', data)  # Debug log
        
        query, error_response = validate_query(data)
        if error_response:
            return error_response
            
        tasks = data.get('tasks', [])
        
        print('Processing query:', query)  # Debug log
        print('With tasks:', tasks)  # Debug log
        
        if not is_task_query(query):
            return jsonify({
                "response": "I can help you with your tasks! Try asking about deadlines, priorities, or specific tasks."
            })
            
        response = handle_task_query(query, tasks)
        print('Generated response:', response)  # Debug log
        
        return jsonify({"response": response})
        
    except Exception as e:
        print(f"Error in process_task_chat: {str(e)}")  # Debug log
        return jsonify({"error": "Failed to process chat request"}), 500

@navigation_routes.route('/chat/navigation', methods=['POST'])
@cross_origin()
def process_navigation_chat():
    try:
        data = request.get_json()
        print('NAVIGATION ROUTE: Received request data:', data)
        
        query, error_response = validate_query(data)
        if error_response:
            return error_response
            
        print('NAVIGATION ROUTE: Processing navigation query:', query)
        
        # Special handling for "How to go from H 109 to H 110" format
        import re
        go_pattern = r'how to go from h\s*(\d{3})\s+to\s+h\s*(\d{3})'
        go_match = re.search(go_pattern, query.lower())
        
        if go_match:
            print('NAVIGATION ROUTE: Detected direct "how to go from" pattern')
            start_num = go_match.group(1)
            end_num = go_match.group(2)
            
            # Get floor numbers
            start_floor = start_num[0]
            end_floor = end_num[0]
            
            # Format for the navigation system
            start_room = f"h{start_floor}_{start_num}"
            end_room = f"h{end_floor}_{end_num}"
            
            print(f'NAVIGATION ROUTE: Directly extracted: {start_room} to {end_room}')
            
            # Find the shortest path
            path_info = ai_nav.find_shortest_path(start_room, end_room)
            print(f'NAVIGATION ROUTE: Path info: {path_info}')
            
            # Interpret the path
            response = interpret_path(path_info)
            print(f'NAVIGATION ROUTE: Generated response: {response}')
            
            return jsonify({"response": response})
        
        # Fall back to regular extraction
        start_room, end_room = extract_rooms(query)
        print(f'NAVIGATION ROUTE: Extracted rooms: {start_room}, {end_room}')
        
        if not start_room or not end_room:
            return jsonify({
                "response": "I couldn't identify the rooms in your query. Please specify them clearly (e.g., 'How do I get from H-109 to H-110?')"
            })
        
        # Find the shortest path
        path_info = ai_nav.find_shortest_path(start_room, end_room)
        print(f'NAVIGATION ROUTE: Path info: {path_info}')
        
        # Interpret the path
        response = interpret_path(path_info)
        print(f'NAVIGATION ROUTE: Generated response: {response}')
        
        return jsonify({"response": response})
        
    except Exception as e:
        print(f"NAVIGATION ROUTE: Error in process_navigation_chat: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to process navigation request", "details": str(e)}), 500

@navigation_routes.route('/health', methods=['GET'])
@cross_origin()
def health_check():
    return jsonify({"status": "healthy", "service": "navigation"})
