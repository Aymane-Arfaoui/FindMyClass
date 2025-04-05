import json
import os
import re
from datetime import datetime
import requests
import traceback

from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
from dotenv import load_dotenv
from openai import OpenAI
from app.aiapi import AINavigationAPI

# Initialize Blueprint
chat_routes = Blueprint('chat_routes', __name__)

class ChatHistory:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ChatHistory, cls).__new__(cls)
            cls._instance.messages = []
            cls._instance.preferences = {}
            cls._instance.last_route_tasks = []
            cls._instance.load_history()
        return cls._instance

    def load_history(self):
        try:
            if os.path.exists("chat_history.json"):
                with open("chat_history.json", "r") as f:
                    data = json.load(f)
                    self.messages = data.get("messages", [])
                    self.preferences = data.get("preferences", {})
                    self.last_route_tasks = data.get("last_route_tasks", [])
            if not self.messages:
                self.messages = [
                    {
                        "id": "1",
                        "text": "Hi! I can help with your tasks and schedule, or provide indoor directions. What would you like to know?",
                        "isUser": False,
                        "timestamp": datetime.datetime.now().isoformat()
                    }
                ]
                self.save_history()
        except Exception as e:
            print(f"Error loading chat history: {e}")
            self.messages = [
                {
                    "id": "1",
                    "text": "Hi! I can help with your tasks and schedule, or provide indoor directions. What would you like to know?",
                    "isUser": False,
                    "timestamp": datetime.datetime.now().isoformat()
                }
            ]
            self.preferences = {}
            self.last_route_tasks = []
            self.save_history()

    def save_history(self):
        try:
            with open("chat_history.json", "w") as f:
                json.dump({
                    "messages": self.messages,
                    "preferences": self.preferences,
                    "last_route_tasks": self.last_route_tasks
                }, f, indent=2)
        except Exception as e:
            print(f"Error saving chat history: {e}")

    def add_message(self, message):
        self.messages.append(message)
        self.save_history()

    def clear_history(self):
        self.messages = [
            {
                "id": "1",
                "text": "Hi! I can help with your tasks and schedule, or provide indoor directions. What would you like to know?",
                "isUser": False,
                "timestamp": datetime.datetime.now().isoformat()
            }
        ]
        self.preferences = {}
        self.last_route_tasks = []
        self.save_history()

    def get_messages(self):
        return self.messages

    def get_preferences(self):
        return self.preferences

    def update_preferences(self, new_preferences):
        self.preferences.update(new_preferences)
        self.save_history()

    def set_last_route_tasks(self, tasks):
        self.last_route_tasks = tasks
        self.save_history()

    def get_last_route_tasks(self):
        return self.last_route_tasks

chat_history = ChatHistory()

# Navigation and Route Planning Helpers
def fetch_building_coordinates(location):
    try:
        building_name_to_code_map = {
            "Hall Building": "H",
            "John Molson School of Business": "MB",
            "Sir George Williams Campus": "SGW",
        }

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

        API_BASE_URL = 'http://127.0.0.1:3001/api/buildinglist'
        response = requests.get(API_BASE_URL)
        response.raise_for_status()

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
    distance_km = ((lat2 - lat1) ** 2 + (lon2 - lon1) ** 2) ** 0.5 * 111
    walking_speed_kmh = 5
    time_hours = distance_km / walking_speed_kmh
    time_minutes = time_hours * 60
    return round(time_minutes, 1)

def parse_feedback(query):
    query_lower = query.lower()
    preferences = {}

    if "avoid outdoor" in query_lower or "skip outdoor" in query_lower:
        preferences["avoid_outdoor"] = True
    elif "include outdoor" in query_lower or "use outdoor" in query_lower:
        preferences["avoid_outdoor"] = False

    return preferences

def generate_route_plan(tasks, preferences, nav_api):
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
            return None, f"Could not fetch coordinates for {address}"

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
        return None, "Need at least two locations to plan a route"

    print('PLAN_ROUTE: Locations extracted:', locations)

    instructions = ["Here’s your optimized route plan based on walking time:"]
    total_walking_time = 0

    avoid_outdoor = preferences.get("avoid_outdoor", False)

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

            path_info = nav_api.find_shortest_path(start_room, end_room, accessibility=avoid_outdoor)
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
            if avoid_outdoor:
                instructions.append("- Note: Outdoor paths avoided as per your preference.")

    instructions.append(f"\nTotal walking time: {total_walking_time:.1f} minutes")
    response = "\n".join(instructions)
    return response, None

# Navigation and Chat Logic
class NavigationContext:
    def __init__(self):
        self.last_navigation = None
        self.last_start_room = None
        self.last_end_room = None

nav_context = NavigationContext()

def is_navigation_query(query: str) -> bool:
    navigation_keywords = [
        "how do i get", "how to get", "where is", "directions to",
        "path to", "route to", "way to", "navigate to", "go from",
        "to", "from", "how long", "time", "distance"
    ]
    query_lower = query.lower()

    print(f"CHAT.PY: Checking navigation query: '{query_lower}'")

    direct_pattern = r'how to go from h\s*\d{3} to h\s*\d{3}'
    is_direct_match = bool(re.search(direct_pattern, query_lower))
    print(f"CHAT.PY: Direct match: {is_direct_match}")

    room_pattern = r'h\s*[-_ ]?\s*(\d{3})'
    room_matches = re.findall(room_pattern, query_lower)
    has_room_numbers = len(room_matches) > 0
    multiple_rooms = len(room_matches) >= 2
    print(f"CHAT.PY: Room matches: {room_matches}")
    print(f"CHAT.PY: Has room numbers: {has_room_numbers}")
    print(f"CHAT.PY: Multiple rooms: {multiple_rooms}")

    has_nav_keywords = any(keyword in query_lower for keyword in navigation_keywords)
    print(f"CHAT.PY: Has navigation keywords: {has_nav_keywords}")

    is_nav_query = is_direct_match or multiple_rooms or (has_room_numbers and has_nav_keywords)
    print(f"CHAT.PY: Final decision - Is navigation query: {is_nav_query}")

    return is_nav_query

def extract_rooms(query: str) -> tuple:
    query_lower = query.lower()
    print(f"CHAT.PY: Extracting rooms from: '{query_lower}'")

    direct_pattern = r'(?:from\s+)?h\s*[-_ ]?\s*(\d{3})(?:\s+to|\s+and)\s+h\s*[-_ ]?\s*(\d{3})'
    direct_match = re.search(direct_pattern, query_lower)

    if direct_match:
        start_room_num = direct_match.group(1)
        end_room_num = direct_match.group(2)

        start_floor = start_room_num[0]
        end_floor = end_room_num[0]

        start_room = f"h{start_floor}_{start_room_num}"
        end_room = f"h{end_floor}_{end_room_num}"

        print(f"CHAT.PY: Extracted rooms (direct pattern): {start_room} to {end_room}")
        return start_room, end_room

    go_pattern = r'how to go from h\s*[-_ ]?\s*(\d{3})\s+to\s+h\s*[-_ ]?\s*(\d{3})'
    go_match = re.search(go_pattern, query_lower)

    if go_match:
        start_room_num = go_match.group(1)
        end_room_num = go_match.group(2)

        start_floor = start_room_num[0]
        end_floor = end_room_num[0]

        start_room = f"h{start_floor}_{start_room_num}"
        end_room = f"h{end_floor}_{end_room_num}"

        print(f"CHAT.PY: Extracted rooms (go pattern): {start_room} to {end_room}")
        return start_room, end_room

    room_pattern = r'h\s*[-_ ]?\s*(\d{3})'
    rooms = re.findall(room_pattern, query_lower)

    if len(rooms) >= 2:
        start_floor = rooms[0][0]
        end_floor = rooms[1][0]

        start_room = f"h{start_floor}_{rooms[0]}"
        end_room = f"h{end_floor}_{rooms[1]}"

        print(f"CHAT.PY: Extracted rooms (generic pattern): {start_room} to {end_room}")
        return start_room, end_room

    print("CHAT.PY: Could not extract rooms from query")
    return None, None

def interpret_path(path_info: dict) -> str:
    if not path_info or "error" in path_info:
        return path_info.get("error", "Could not find a path between these rooms.")

    path = path_info.get("path", [])
    distance = path_info.get("distance", 0)

    if not path:
        return "No path found between these rooms."

    instructions = ["Here's how to get to your destination:"]

    for i in range(len(path) - 1):
        current = path[i]
        next_node = path[i + 1]

        current_parts = current.split('_')
        next_parts = next_node.split('_')

        current_building = current_parts[0][0].upper()
        current_floor = current_parts[0][1]
        next_building = next_parts[0][0].upper()
        next_floor = next_parts[0][1]

        current_is_hallway = len(current_parts) > 1 and current_parts[1].startswith('hw')
        next_is_hallway = len(next_parts) > 1 and next_parts[1].startswith('hw')
        current_is_elevator = 'elevator' in current
        next_is_elevator = 'elevator' in next_node
        current_is_stairs = 'stairs' in current
        next_is_stairs = 'stairs' in next_node
        current_is_escalator = 'escalator' in current
        next_is_escalator = 'escalator' in next_node

        if current_is_elevator and next_is_elevator:
            instructions.append(f"Take the elevator from floor {current_floor} to floor {next_floor}")
        elif current_is_stairs and next_is_stairs:
            instructions.append(f"Take the stairs from floor {current_floor} to floor {next_floor}")
        elif current_is_escalator and next_is_escalator:
            instructions.append(f"Take the escalator from floor {current_floor} to floor {next_floor}")
        elif current_is_hallway and next_is_hallway:
            instructions.append(f"Continue through the hallway on floor {current_floor}")
        elif current_is_hallway:
            room_num = next_parts[-1]
            if next_is_elevator:
                instructions.append(f"Look for the elevator along the hallway")
            elif next_is_stairs:
                instructions.append(f"Look for the stairs along the hallway")
            elif next_is_escalator:
                instructions.append(f"Look for the escalator along the hallway")
            else:
                instructions.append(f"Look for room {next_building}-{room_num} along the hallway")
        elif next_is_hallway:
            current_num = current_parts[-1]
            if current_is_elevator:
                instructions.append(f"Exit the elevator and enter the hallway")
            elif current_is_stairs:
                instructions.append(f"Exit the stairs and enter the hallway")
            elif current_is_escalator:
                instructions.append(f"Exit the escalator and enter the hallway")
            else:
                instructions.append(f"Exit room {current_building}-{current_num} and enter the hallway")
        else:
            current_num = current_parts[-1]
            next_num = next_parts[-1]
            if current_is_elevator:
                instructions.append(f"Exit the elevator and go to room {next_building}-{next_num}")
            elif current_is_stairs:
                instructions.append(f"Exit the stairs and go to room {next_building}-{next_num}")
            elif current_is_escalator:
                instructions.append(f"Exit the escalator and go to room {next_building}-{next_num}")
            else:
                instructions.append(f"Go from room {current_building}-{current_num} to room {next_building}-{next_num}")

    instructions.append(f"\nTotal distance: {distance:.1f} meters")
    return "\n".join(instructions)

def handle_follow_up(query: str, context: NavigationContext) -> str:
    if not context.last_navigation:
        return "I don't have any previous navigation information. Please ask for directions first."

    query_lower = query.lower()

    if any(word in query_lower for word in ["how long", "time", "distance"]):
        distance = context.last_navigation.get("distance", 0)
        time_minutes = (distance / 1.4) / 60
        return f"The distance is {distance:.1f} meters, which should take about {time_minutes:.1f} minutes to walk."

    return "I'm not sure what you're asking about. Could you please rephrase your question?"

def is_task_query(query):
    task_keywords = ["task", "tasks", "schedule", "deadline", "priority", "due", "what are my"]
    query_lower = query.lower()
    return any(keyword in query_lower for keyword in task_keywords)

def is_feedback_query(query):
    feedback_keywords = [
        "avoid outdoor", "skip outdoor", "include outdoor", "use outdoor",
        "fix", "change", "adjust", "update", "modify", "better", "different"
    ]
    query_lower = query.lower()
    return any(keyword in query_lower for keyword in feedback_keywords)

def handle_task_query(query, tasks):
    load_dotenv()
    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

    if not tasks:
        return "You don't have any tasks scheduled. Would you like to add a new task?"

    tasks_description = "Here are the user's current tasks:\n"
    for task in tasks:
        task_time = ""
        if task.get('startTime'):
            time = task['startTime'].split('T')[1][:5] if 'T' in task['startTime'] else task['startTime']
            task_time = f" at {time}"

        location = f" at {task['address']}" if task.get('address') and task['address'] != 'No location available' else ""
        notes = f" ({task['notes']})" if task.get('notes') and task['notes'] != 'No additional details' else ""

        tasks_description += f"- {task['taskName']}{task_time}{location}{notes}\n"

    prompt = f"""As an AI assistant, you're helping the user with their tasks and schedule. Here's their question:
"{query}"

{tasks_description}

Focus on directly answering the user's question without any preamble like "Based on your tasks" or "You have the following tasks". 
Just answer directly and conversationally as if continuing a chat.

If they're asking about tasks, provide relevant information about times, locations, and details.
If they ask something unrelated to tasks, still give a helpful response while being aware of their schedule context."""

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful AI assistant focused on task and schedule management. Respond directly without introductory phrases."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=300
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error in OpenAI call: {e}")
        return "I encountered an error while processing your request. Please try again."

# Flask Routes
nav_api = AINavigationAPI()

@chat_routes.route('/chat/navigation', methods=['POST'])
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

@chat_routes.route('/chat/tasks', methods=['POST'])
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

@chat_routes.route('/chat/plan_route', methods=['POST'])
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

        working_message = {
            "id": f"working-{datetime.now().timestamp()}",
            "text": "Working on your route plan...",
            "isUser": False,
            "timestamp": datetime.now().isoformat()
        }
        chat_history.add_message(working_message)

        preferences = chat_history.get_preferences()
        response, error = generate_route_plan(tasks, preferences, nav_api)
        if error:
            return jsonify({"error": error}), 400

        print('PLAN_ROUTE: Generated response:', response)

        route_message = {
            "id": f"route-{datetime.now().timestamp()}",
            "text": response,
            "isUser": False,
            "timestamp": datetime.now().isoformat()
        }
        chat_history.add_message(route_message)

        chat_history.set_last_route_tasks(tasks)

        return jsonify({"response": response})

    except Exception as e:
        print(f"PLAN_ROUTE: Detailed error: {str(e)}")
        print("PLAN_ROUTE: Traceback:")
        traceback.print_exc()
        return jsonify({"error": "Failed to process route planning request"}), 500

@chat_routes.route('/chat/feedback', methods=['POST'])
@cross_origin()
def process_feedback():
    try:
        data = request.get_json()
        print('FEEDBACK: Received request data:', data)

        query = data.get('query')
        tasks = data.get('tasks', [])

        if not query:
            return jsonify({"error": "Feedback query is required"}), 400

        new_preferences = parse_feedback(query)
        if not new_preferences:
            response = "What would you like to change about your route?"
            chat_message = {
                "id": f"feedback-{datetime.now().timestamp()}",
                "text": response,
                "isUser": False,
                "timestamp": datetime.now().isoformat()
            }
            chat_history.add_message(chat_message)
            return jsonify({"response": response})

        chat_history.update_preferences(new_preferences)
        preferences = chat_history.get_preferences()
        print('FEEDBACK: Updated preferences:', preferences)

        if not tasks:
            response = "I need your tasks to regenerate the route plan. Please provide your tasks or plan a new route."
        else:
            response, error = generate_route_plan(tasks, preferences, nav_api)
            if error:
                return jsonify({"error": error}), 400

            confirmation = "I’ve updated your route based on your feedback."
            if preferences.get("avoid_outdoor"):
                confirmation = "I’ve skipped outdoor paths. Here’s your new route:"
            response = f"{confirmation}\n\n{response}"

        print('FEEDBACK: Generated response:', response)

        feedback_message = {
            "id": f"feedback-{datetime.now().timestamp()}",
            "text": response,
            "isUser": False,
            "timestamp": datetime.now().isoformat()
        }
        chat_history.add_message(feedback_message)

        return jsonify({"response": response})

    except Exception as e:
        print(f"FEEDBACK: Detailed error: {str(e)}")
        print("FEEDBACK: Traceback:")
        traceback.print_exc()
        return jsonify({"error": "Failed to process feedback"}), 500

@chat_routes.route('/chat/history', methods=['GET'])
@cross_origin()
def get_chat_history():
    try:
        history = chat_history.get_messages()
        return jsonify({"messages": history})
    except Exception as e:
        print(f"CHAT_HISTORY: Error retrieving chat history: {str(e)}")
        return jsonify({"error": "Failed to retrieve chat history"}), 500

@chat_routes.route('/chat/history/clear', methods=['POST'])
@cross_origin()
def clear_chat_history():
    print("Received request to clear chat history")
    try:
        chat_history.clear_history()
        return jsonify({"message": "Chat history cleared"})
    except Exception as e:
        print(f"CHAT_HISTORY: Error clearing chat history: {str(e)}")
        return jsonify({"error": "Failed to clear chat history"}), 500

@chat_routes.route('/chat/add_message', methods=['POST'])
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