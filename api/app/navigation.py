from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
import requests
from app.aiapi import AINavigationAPI
from datetime import datetime
import re
import traceback
from chat import handle_task_query, is_task_query, extract_rooms, interpret_path, chat_history

# Initialize Blueprint
navigation_routes = Blueprint('navigation_routes', __name__)

# Initialize navigation API
nav_api = AINavigationAPI()

def fetch_building_coordinates(location):
    """Helper to fetch building coordinates, mirroring frontend logic"""
    try:
        # Define the building name to code mapping (mirroring buildingsMapping.js)
        building_name_to_code_map = {
            "Hall Building": "H",
            "John Molson School of Business": "MB",
            "Sir George Williams Campus": "SGW",
            # Add other mappings as needed
        }

        # Parse the location string (e.g., "Sir George Williams Campus - Hall Building Rm 520")
        if not location:
            print("PLAN_ROUTE: Invalid location string")
            return None, None

        location_parts = location.split(' - ')
        if len(location_parts) < 2:
            print(f"PLAN_ROUTE: Invalid location format: {location}")
            return None, None

        building_name = location_parts[1].split('Rm')[0].strip()
        if not building_name:
            print(f"PLAN_ROUTE: Building name could not be extracted from location: {location}")
            return None, None

        building_code = building_name_to_code_map.get(building_name)
        if not building_code:
            print(f"PLAN_ROUTE: Unknown building name: {building_name}")
            return None, None

        print(f"PLAN_ROUTE: Mapped {building_name} to building code: {building_code}")

        # Cache could be implemented here if needed, but for simplicity, we'll fetch each time
        API_BASE_URL = 'http://127.0.0.1:3001/api/buildinglist'
        response = requests.get(API_BASE_URL)
        response.raise_for_status()  # Raise an exception for bad status codes

        buildings = response.json()
        print(f"PLAN_ROUTE: Fetched building list: {buildings}")

        building = next((b for b in buildings if b["Building"] == building_code), None)
        if not building:
            print(f"PLAN_ROUTE: Building code {building_code} not found in building list")
            return None, None

        coordinates = {
            "latitude": float(building["Latitude"]),
            "longitude": float(building["Longitude"])
        }
        print(f"PLAN_ROUTE: Coordinates for {building_name} (code: {building_code}): {coordinates}")
        return coordinates["latitude"], coordinates["longitude"]

    except Exception as e:
        print(f"PLAN_ROUTE: Error fetching building coordinates for {location}: {e}")
        return None, None

def estimate_walking_time(lat1, lon1, lat2, lon2):
    """Estimate walking time between two coordinates (in minutes)"""
    # Simplified distance calculation (Haversine formula could be used for accuracy)
    # Assume 1 degree ~ 111 km, and walking speed of 5 km/h
    distance_km = ((lat2 - lat1) ** 2 + (lon2 - lon1) ** 2) ** 0.5 * 111
    walking_speed_kmh = 5  # Average walking speed
    time_hours = distance_km / walking_speed_kmh
    time_minutes = time_hours * 60
    return round(time_minutes, 1)

@navigation_routes.route('/navigation/shortestpath', methods=['POST'])
@cross_origin()
def find_shortest_path():
    try:
        data = request.get_json()
        print('NAVIGATION: Received request data:', data)

        start_room = data.get('start_room')
        end_room = data.get('end_room')
        accessibility = data.get('accessibility', False)

        if not start_room or not end_room:
            return jsonify({"error": "Start and end rooms are required"}), 400

        path_info = nav_api.find_shortest_path(start_room, end_room, accessibility)
        print('NAVIGATION: Generated path:', path_info)

        return jsonify(path_info)

    except Exception as e:
        print(f"NAVIGATION: Error in find_shortest_path: {str(e)}")
        return jsonify({"error": "Failed to find shortest path"}), 500

@navigation_routes.route('/navigation/multipledestinations', methods=['POST'])
@cross_origin()
def find_multiple_destinations():
    try:
        data = request.get_json()
        print('MULTI_DEST: Received request data:', data)

        start_room = data.get('start_room')
        destinations = data.get('destinations', [])
        accessibility = data.get('accessibility', False)

        if not start_room or not destinations:
            return jsonify({"error": "Start room and at least one destination are required"}), 400

        path_info = nav_api.find_multiple_destinations(start_room, destinations, accessibility)
        print('MULTI_DEST: Generated path:', path_info)

        return jsonify(path_info)

    except Exception as e:
        print(f"MULTI_DEST: Error in find_multiple_destinations: {str(e)}")
        return jsonify({"error": "Failed to find path for multiple destinations"}), 500

@navigation_routes.route('/chat/navigation', methods=['POST'])
@cross_origin()
def process_navigation_query():
    try:
        data = request.get_json()
        print('CHAT_NAV: Received request data:', data)

        start_room = data.get('start_room')
        end_room = data.get('end_room')
        accessibility = data.get('accessibility', False)

        if not start_room or not end_room:
            return jsonify({"error": "Start and end rooms are required"}), 400

        path_info = nav_api.find_shortest_path(start_room, end_room, accessibility)
        print('CHAT_NAV: Generated path:', path_info)

        # Interpret the path and add to chat history
        response = interpret_path(path_info)
        chat_message = {
            "id": f"nav-{datetime.now().timestamp()}",
            "text": response,
            "isUser": False,
            "timestamp": datetime.now().isoformat()
        }
        chat_history.add_message(chat_message)

        return jsonify({"response": response})

    except Exception as e:
        print(f"CHAT_NAV: Error in process_navigation_query: {str(e)}")
        return jsonify({"error": "Failed to process navigation query"}), 500

@navigation_routes.route('/chat/tasks', methods=['POST'])
@cross_origin()
def process_task_query():
    try:
        data = request.get_json()
        print('CHAT_TASKS: Received request data:', data)

        query = data.get('query')
        tasks = data.get('tasks', [])

        if not query:
            return jsonify({"error": "Query is required"}), 400

        if not is_task_query(query):
            response = "I can help you with your tasks! Try asking about deadlines, priorities, or specific tasks."
            chat_message = {
                "id": f"task-{datetime.now().timestamp()}",
                "text": response,
                "isUser": False,
                "timestamp": datetime.now().isoformat()
            }
            chat_history.add_message(chat_message)
            return jsonify({"response": response})

        response = handle_task_query(query, tasks)
        print('CHAT_TASKS: Generated response:', response)

        # Add the response to chat history
        chat_message = {
            "id": f"task-{datetime.now().timestamp()}",
            "text": response,
            "isUser": False,
            "timestamp": datetime.now().isoformat()
        }
        chat_history.add_message(chat_message)

        return jsonify({"response": response})

    except Exception as e:
        print(f"CHAT_TASKS: Error in process_task_query: {str(e)}")
        return jsonify({"error": "Failed to process task query"}), 500

@navigation_routes.route('/chat/plan_route', methods=['POST'])
@cross_origin()
def process_plan_route():
    try:
        data = request.get_json()
        print('PLAN_ROUTE: Received request data:', data)

        if not data or 'tasks' not in data:
            return jsonify({"error": "No tasks provided"}), 400

        tasks = data.get('tasks', [])
        print('PLAN_ROUTE: Processing tasks:', tasks)

        if not tasks:
            return jsonify({"error": "No tasks provided"}), 400

        # Add "Working on your route plan..." message
        working_message = {
            "id": f"working-{datetime.now().timestamp()}",
            "text": "Working on your route plan...",
            "isUser": False,
            "timestamp": datetime.now().isoformat()
        }
        chat_history.add_message(working_message)

        # Normalize and sort tasks by start time
        for task in tasks:
            if task.get("startTime"):
                try:
                    time_str = task["startTime"]
                    is_pm = "PM" in time_str
                    time_str = time_str.replace(" AM", "").replace(" PM", "")
                    dt = datetime.strptime(time_str, "%Y-%m-%dT%H:%M:00")
                    if is_pm and dt.hour < 12:
                        dt = dt.replace(hour=dt.hour + 12)
                    elif not is_pm and dt.hour == 12:
                        dt = dt.replace(hour=0)
                    task["startTime"] = dt
                except ValueError as e:
                    print(f"PLAN_ROUTE: Error parsing time {task['startTime']}: {e}")
                    task["startTime"] = None
            else:
                task["startTime"] = None

        tasks.sort(key=lambda x: x["startTime"] if x["startTime"] else datetime.max)
        print('PLAN_ROUTE: Tasks sorted by start time:', [(t["taskName"], t["startTime"]) for t in tasks])

        # Extract locations and coordinates
        locations = []
        for task in tasks:
            address = task.get("address", "")
            task_name = task.get("taskName", "Unnamed Task")
            start_time = task["startTime"].strftime("%Y-%m-%d %I:%M %p") if task["startTime"] else "All day"

            print(f'PLAN_ROUTE: Processing task: {task_name}, address: {address}')

            building_name = address
            room_number = None

            room_match = re.search(r'Rm\s*([A-Za-z0-9.]+)', address)
            if room_match:
                room_number = room_match.group(1)
                building_name = address.split("Rm")[0].strip("- ")
                print(f'PLAN_ROUTE: Extracted room number: {room_number}, building name: {building_name}')
            else:
                print('PLAN_ROUTE: No room number found in address')

            if "John Molson School of Business" in building_name:
                building_name = "John Molson School of Business"
            elif "Hall Building" in building_name:
                building_name = "Hall Building"
            elif "Sir George Williams Campus" in building_name:
                building_name = "Sir George Williams Campus"
            print(f'PLAN_ROUTE: Normalized building name: {building_name}')

            lat, lon = fetch_building_coordinates(address)
            if lat is None or lon is None:
                print(f'PLAN_ROUTE: Failed to fetch coordinates for {address}')
                return jsonify({"error": f"Could not fetch coordinates for {address}"}), 400

            print(f'PLAN_ROUTE: Coordinates for {address}: lat={lat}, lon={lon}')

            locations.append({
                "task_name": task_name,
                "building_name": building_name,
                "room_number": room_number,
                "start_time": start_time,
                "lat": lat,
                "lon": lon
            })

        if len(locations) < 2:
            return jsonify({"error": "Need at least two locations to plan a route"}), 400

        print('PLAN_ROUTE: Locations extracted:', locations)

        instructions = ["Here’s your optimized route plan based on walking time:"]
        total_walking_time = 0

        for i in range(len(locations) - 1):
            start_loc = locations[i]
            end_loc = locations[i + 1]

            start_name = f"{start_loc['task_name']} at {start_loc['building_name']}"
            if start_loc["room_number"]:
                start_name += f" (Room {start_loc['room_number']})"
            end_name = f"{end_loc['task_name']} at {end_loc['building_name']}"
            if end_loc["room_number"]:
                end_name += f" (Room {end_loc['room_number']})"

            print(f'PLAN_ROUTE: Planning route from {start_name} to {end_name}')

            if (start_loc["building_name"] == "Hall Building" and
                    end_loc["building_name"] == "Hall Building" and
                    start_loc["room_number"] and end_loc["room_number"]):
                start_room = f"h5_{start_loc['room_number']}"
                end_room = f"h5_{end_loc['room_number']}"
                print(f'PLAN_ROUTE: Indoor navigation - Start: {start_room}, End: {end_room}')

                path_info = nav_api.find_shortest_path(start_room, end_room)
                print(f'PLAN_ROUTE: Path info: {path_info}')

                if "error" in path_info:
                    instructions.append(f"Could not find a path from {start_name} to {end_name}.")
                    continue

                distance = path_info.get("distance", 0)
                walking_time = (distance / 1.4) / 60
                total_walking_time += walking_time

                instructions.append(f"\nFrom {start_name} at {start_loc['start_time']}:")
                instructions.append(f"- Walk to {end_name} (arrive by {end_loc['start_time']})")
                instructions.append(f"- Indoor walking time: {walking_time:.1f} minutes")
                instructions.append(f"- Distance: {distance:.1f} meters")
            else:
                walking_time = estimate_walking_time(
                    start_loc["lat"], start_loc["lon"],
                    end_loc["lat"], end_loc["lon"]
                )
                total_walking_time += walking_time

                instructions.append(f"\nFrom {start_name} at {start_loc['start_time']}:")
                instructions.append(f"- Walk to {end_name} (arrive by {end_loc['start_time']})")
                instructions.append(f"- Estimated walking time: {walking_time:.1f} minutes")

        instructions.append(f"\nTotal walking time: {total_walking_time:.1f} minutes")
        response = "\n".join(instructions)
        print('PLAN_ROUTE: Generated response:', response)

        # Add the response to chat history
        route_message = {
            "id": f"route-{datetime.now().timestamp()}",
            "text": response,
            "isUser": False,
            "timestamp": datetime.now().isoformat()
        }
        chat_history.add_message(route_message)

        return jsonify({"response": response})

    except Exception as e:
        print(f"PLAN_ROUTE: Detailed error: {str(e)}")
        print("PLAN_ROUTE: Traceback:")
        traceback.print_exc()
        return jsonify({"error": "Failed to process route planning request"}), 500

@navigation_routes.route('/chat/history', methods=['GET'])
@cross_origin()
def get_chat_history():
    """Endpoint to retrieve the chat history"""
    try:
        history = chat_history.get_messages()
        return jsonify({"messages": history})
    except Exception as e:
        print(f"CHAT_HISTORY: Error retrieving chat history: {str(e)}")
        return jsonify({"error": "Failed to retrieve chat history"}), 500

@navigation_routes.route('/chat/history/clear', methods=['POST'])
@cross_origin()
def clear_chat_history():
    """Endpoint to clear the chat history"""
    try:
        chat_history.clear_history()
        return jsonify({"message": "Chat history cleared"})
    except Exception as e:
        print(f"CHAT_HISTORY: Error clearing chat history: {str(e)}")
        return jsonify({"error": "Failed to clear chat history"}), 500

@navigation_routes.route('/chat/add_message', methods=['POST'])
@cross_origin()
def add_chat_message():
    try:
        data = request.get_json()
        print('ADD_MESSAGE: Received request data:', data)

        message = data.get('message')
        if not message:
            return jsonify({"error": "Message is required"}), 400

        chat_history.add_message(message)
        return jsonify({"message": "Message added successfully"})

    except Exception as e:
        print(f"ADD_MESSAGE: Error in add_chat_message: {str(e)}")
        return jsonify({"error": "Failed to add message"}), 500