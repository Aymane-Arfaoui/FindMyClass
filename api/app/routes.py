from flask import Blueprint, request, jsonify
from flask_cors import CORS
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from chat import handle_task_query, is_task_query, SAMPLE_TASKS, is_navigation_query, extract_rooms, interpret_path
from app.aiapi import AINavigationAPI

api = Blueprint('api', __name__)
CORS(api)  # Enable CORS for all routes in this blueprint

# Initialize the Navigation API
nav_api = AINavigationAPI()

@api.route('/chat/tasks', methods=['POST'])
def process_task_chat():
    try:
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400
            
        data = request.get_json()
        if data is None:
            return jsonify({'error': 'Invalid JSON data'}), 400
            
        query = data.get('query')
        tasks = data.get('tasks', [])
        
        if not query:
            return jsonify({'error': 'Query is required'}), 400
            
        print(f"API ROUTE: Received query: {query}")  # Debug print
        print(f"API ROUTE: Received tasks: {tasks}")  # Debug print
        
        # Use sample tasks if none are provided
        if not tasks:
            print("API ROUTE: No tasks received, using sample tasks")
            tasks = SAMPLE_TASKS
            print(f"API ROUTE: Sample tasks: {tasks}")
        
        # Debug output for navigation detection
        is_nav_query = is_navigation_query(query)
        print(f"API ROUTE: Is navigation query: {is_nav_query}")
        
        # Check if it's a navigation query
        if is_nav_query:
            print("API ROUTE: Navigation query detected")
            start_room, end_room = extract_rooms(query)
            print(f"API ROUTE: Extracted rooms: {start_room}, {end_room}")
            
            if not start_room or not end_room:
                return jsonify({
                    'response': "I couldn't identify the rooms in your query. Please specify them clearly (e.g., 'How do I get from H-820 to H-110?')"
                })
                
            print(f"API ROUTE: Extracted rooms: {start_room} to {end_room}")
            
            try:
                path_info = nav_api.find_shortest_path(start_room, end_room)
                print(f"API ROUTE: Path info: {path_info}")
                response = interpret_path(path_info)
                print(f"API ROUTE: Navigation response: {response}")
            except Exception as path_error:
                print(f"API ROUTE: Error finding path: {str(path_error)}")
                response = f"Error finding path: {str(path_error)}"
            
            return jsonify({
                'response': response
            })
        
        # Process as a task query
        print("API ROUTE: Processing as task query")
        response = handle_task_query(query, tasks)
        
        return jsonify({
            'response': response
        })
    except Exception as e:
        return jsonify({
            'response': "I encountered an error while processing your request. Please try again."
        })

@api.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'service': 'navigation',
        'status': 'healthy'
    }) 