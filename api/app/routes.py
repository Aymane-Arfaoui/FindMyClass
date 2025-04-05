from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from chat import handle_task_query, is_task_query, is_navigation_query, extract_rooms, interpret_path, nav_api

api = Blueprint('api', __name__)

@api.route('/chat/tasks', methods=['POST'])
@cross_origin()
def process_task_chat():
    try:
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400

        data = request.json
        query = data.get('query')
        tasks = data.get('tasks', [])

        if not query:
            return jsonify({'error': 'Query is required'}), 400

        print(f"API ROUTE: Received query: {query}")
        print(f"API ROUTE: Received tasks: {tasks}")

        # Check if it's a navigation query
        if is_navigation_query(query):
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
        print(f"API ROUTE: Generated response: {response}")

        return jsonify({
            'response': response
        })
    except Exception as e:
        print(f"API ROUTE: Error processing chat: {str(e)}")
        return jsonify({
            'response': "I encountered an error while processing your request. Please try again."
        })

@api.route('/health', methods=['GET'])
@cross_origin()
def health_check():
    return jsonify({
        'service': 'navigation',
        'status': 'healthy'
    })