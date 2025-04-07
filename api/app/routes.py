from flask import Blueprint, request, jsonify
from flask_cors import CORS
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from chat import handle_task_query, is_task_query, SAMPLE_TASKS, is_navigation_query, extract_rooms, interpret_path
from app.aiapi import AINavigationAPI
from datetime import datetime

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

@api.route('/chat/route-planning', methods=['POST'])
def plan_route():
    try:
        data = request.get_json()
        if not data or 'tasks' not in data:
            return jsonify({'error': 'No tasks provided'}), 400

        tasks = data['tasks']
        if not tasks:
            return jsonify({'error': 'Empty task list'}), 400

        # Sort tasks by start time if not already sorted
        tasks.sort(key=lambda x: x.get('startTime', ''))

        # Generate route instructions
        route_instructions = []
        for i, task in enumerate(tasks):
            task_name = task.get('taskName', 'Unknown')
            address = task.get('address', '')
            start_time = task.get('startTime', '')
            is_classroom = task.get('isClassroom', False)

            # Format the time
            time_str = ''
            if start_time:
                try:
                    dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
                    time_str = dt.strftime('%I:%M %p')
                except:
                    time_str = 'Time not specified'

            # Create the instruction
            if i == 0:
                instruction = f"1. Start at {task_name} ({address}) at {time_str}"
            else:
                prev_task = tasks[i-1]
                prev_address = prev_task.get('address', '')
                
                # Special handling for connected buildings
                if is_classroom and prev_task.get('isClassroom', False):
                    if ('MB' in prev_address and 'Hall' in address) or ('Hall' in prev_address and 'MB' in address):
                        instruction = f"{i+1}. Take the tunnel from {prev_address} to {address} for {task_name} at {time_str}"
                    else:
                        instruction = f"{i+1}. Go to {address} for {task_name} at {time_str}"
                else:
                    instruction = f"{i+1}. Head to {address} for {task_name} at {time_str}"

            route_instructions.append(instruction)

        # Create the response message
        response = "Here's your optimized route:\n\n"
        response += "\n".join(route_instructions)
        
        if len(tasks) > 1:
            response += "\n\nNote: This route is optimized based on your task schedule. For classroom locations, I've included specific navigation hints between connected buildings."

        return jsonify({'response': response})

    except Exception as e:
        print(f"Error in route planning: {str(e)}")
        return jsonify({'error': 'Failed to plan route'}), 500

@api.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'service': 'navigation',
        'status': 'healthy'
    }) 