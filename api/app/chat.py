import os
from openai import OpenAI
from dotenv import load_dotenv
from app.aiapi import AINavigationAPI
from app.integrated_routing import IntegratedRoutingService
import re

class NavigationContext:
    def __init__(self):
        self.last_navigation = None
        self.last_start_room = None
        self.last_end_room = None
        self.last_weather_data = None
        self.last_start_location = None
        self.last_end_location = None

# Initialize global context
nav_context = NavigationContext()
routing_service = IntegratedRoutingService()

def is_navigation_query(query: str) -> bool:
    """Check if the query is asking for directions"""
    navigation_keywords = [
        "how do i get", "how to get", "where is", "directions to",
        "path to", "route to", "way to", "navigate to", "go from",
        "to", "from", "how long", "time", "distance"
    ]
    query_lower = query.lower()
    
    # Debug output
    print(f"CHAT.PY: Checking navigation query: '{query_lower}'")
    
    # Check for direct patterns like "how to go from H 109 to H 110"
    direct_pattern = r'how to go from h\s*\d{3} to h\s*\d{3}'
    is_direct_match = bool(re.search(direct_pattern, query_lower))
    print(f"CHAT.PY: Direct match: {is_direct_match}")
    
    # Check for room numbers (H-109, H 110, etc.)
    room_pattern = r'h\s*[-_ ]?\s*\d{3}'
    room_matches = re.findall(room_pattern, query_lower)
    has_room_numbers = len(room_matches) > 0
    multiple_rooms = len(room_matches) >= 2
    print(f"CHAT.PY: Room matches: {room_matches}")
    print(f"CHAT.PY: Has room numbers: {has_room_numbers}")
    print(f"CHAT.PY: Multiple rooms: {multiple_rooms}")
    
    # Check for navigation keywords
    has_nav_keywords = any(keyword in query_lower for keyword in navigation_keywords)
    print(f"CHAT.PY: Has navigation keywords: {has_nav_keywords}")
    
    # The query is a navigation query if:
    # 1. It directly matches our pattern, OR
    # 2. It mentions multiple rooms, OR
    # 3. It has room numbers AND navigation keywords
    is_nav_query = is_direct_match or multiple_rooms or (has_room_numbers and has_nav_keywords)
    print(f"CHAT.PY: Final decision - Is navigation query: {is_nav_query}")
    
    return is_nav_query

def extract_rooms(query: str) -> tuple:
    """Extract room numbers from the query"""
    query_lower = query.lower()
    print(f"CHAT.PY: Extracting rooms from: '{query_lower}'")
    
    # Try different patterns
    
    # Pattern 1: Direct "from H109 to H110" pattern
    direct_pattern = r'(?:from\s+)?h\s*[-_ ]?\s*(\d{3})(?:\s+to|\s+and)\s+h\s*[-_ ]?\s*(\d{3})'
    direct_match = re.search(direct_pattern, query_lower)
    
    if direct_match:
        start_room_num = direct_match.group(1)
        end_room_num = direct_match.group(2)
        
        # Get floor numbers (first digit of the room number)
        start_floor = start_room_num[0]
        end_floor = end_room_num[0]
        
        # Format room IDs for the navigation system
        start_room = f"h{start_floor}_{start_room_num}"
        end_room = f"h{end_floor}_{end_room_num}"
        
        print(f"CHAT.PY: Extracted rooms (direct pattern): {start_room} to {end_room}")
        return start_room, end_room
    
    # Pattern 2: "How to go from H 109 to H 110" pattern
    go_pattern = r'how to go from h\s*[-_ ]?\s*(\d{3})\s+to\s+h\s*[-_ ]?\s*(\d{3})'
    go_match = re.search(go_pattern, query_lower)
    
    if go_match:
        start_room_num = go_match.group(1)
        end_room_num = go_match.group(2)
        
        # Get floor numbers (first digit of the room number)
        start_floor = start_room_num[0]
        end_floor = end_room_num[0]
        
        # Format room IDs for the navigation system
        start_room = f"h{start_floor}_{start_room_num}"
        end_room = f"h{end_floor}_{end_room_num}"
        
        print(f"CHAT.PY: Extracted rooms (go pattern): {start_room} to {end_room}")
        return start_room, end_room
    
    # Pattern 3: Just find all room numbers and use the first two
    room_pattern = r'h\s*[-_ ]?\s*(\d{3})'
    rooms = re.findall(room_pattern, query_lower)
    
    if len(rooms) >= 2:
        # Get floor numbers from room numbers
        start_floor = rooms[0][0]  # First digit is floor number
        end_floor = rooms[1][0]    # First digit is floor number
        
        # Format room IDs for the navigation system
        start_room = f"h{start_floor}_{rooms[0]}"
        end_room = f"h{end_floor}_{rooms[1]}"
        
        print(f"CHAT.PY: Extracted rooms (generic pattern): {start_room} to {end_room}")
        return start_room, end_room
    
    print("CHAT.PY: Could not extract rooms from query")
    return None, None

def extract_building_names(query: str) -> tuple:
    """Extract building names from the query for cross-building navigation"""
    query_lower = query.lower()
    
    # Define building mappings
    building_mappings = {
        "hall": ["hall", "h building", "h-b", "h building"],
        "mb": ["mb", "jmsb", "john molson", "john molson school of business"],
        "cc": ["cc", "concordia campus", "campus"]
    }
    
    # Check for building names in the query
    start_building = None
    end_building = None
    
    for building, aliases in building_mappings.items():
        for alias in aliases:
            if alias in query_lower:
                # If we find a building name, check if it's the start or end building
                if "from" in query_lower and query_lower.index(alias) < query_lower.index("from"):
                    start_building = building
                elif "to" in query_lower and query_lower.index(alias) > query_lower.index("to"):
                    end_building = building
    
    # If we couldn't determine the buildings, default to "hall" for both
    if not start_building:
        start_building = "hall"
    if not end_building:
        end_building = "hall"
    
    return start_building, end_building

def interpret_path(path_info: dict) -> str:
    """Convert path information into human-readable instructions"""
    if not path_info or "error" in path_info:
        return path_info.get("error", "Could not find a path between these rooms.")
    
    # Handle integrated path with segments
    if path_info.get("type") == "integrated":
        segments = path_info.get("segments", [])
        total_distance = path_info.get("total_distance", 0)
        
        if not segments:
            return "No path found between these locations."
        
        instructions = ["Here's how to get to your destination:"]
        
        for i, segment in enumerate(segments):
            segment_type = segment.get("type")
            
            if segment_type == "indoor":
                path = segment.get("path", [])
                distance = segment.get("distance", 0)
                campus = segment.get("campus", "unknown")
                
                if campus == "tunnel":
                    instructions.append(f"Take the tunnel connecting the buildings ({distance:.1f} meters)")
                else:
                    # Format indoor path
                    for j in range(len(path) - 1):
                        current = path[j]
                        next_node = path[j + 1]
                        
                        # Extract building, floor, and room/hallway info
                        current_parts = current.split('_')
                        next_parts = next_node.split('_')
                        
                        # Get building and floor info
                        current_building = current_parts[0][0].upper()  # 'h' from 'h1'
                        current_floor = current_parts[0][1]            # '1' from 'h1'
                        next_building = next_parts[0][0].upper()
                        next_floor = next_parts[0][1]
                        
                        # Check node types
                        current_is_hallway = len(current_parts) > 1 and current_parts[1].startswith('hw')
                        next_is_hallway = len(next_parts) > 1 and next_parts[1].startswith('hw')
                        current_is_elevator = 'elevator' in current
                        next_is_elevator = 'elevator' in next_node
                        current_is_stairs = 'stairs' in current
                        next_is_stairs = 'stairs' in next_node
                        current_is_escalator = 'escalator' in current
                        next_is_escalator = 'escalator' in next_node
                        
                        # Handle special nodes
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
            
            elif segment_type == "outdoor":
                path = segment.get("path", {})
                distance = segment.get("distance", 0)
                weather_adjusted = segment.get("weather_adjusted", False)
                
                # Add outdoor navigation instructions
                instructions.append(f"Go outside and follow the path ({distance:.1f} meters)")
                
                # Add weather warning if applicable
                if weather_adjusted:
                    instructions.append("Note: The route has been adjusted due to weather conditions.")
                
                # Add steps from Google Maps if available
                if "steps" in path:
                    for step in path["steps"]:
                        instructions.append(f"- {step['instruction']} ({step['distance']}, {step['duration']})")
        
        instructions.append(f"\nTotal distance: {total_distance:.1f} meters")
        return "\n".join(instructions)
    
    # Handle simple indoor path
    path = path_info.get("path", [])
    if not path:
        return "No path found between these rooms."

    instructions = ["Here's how to get to your destination:"]
    for i in range(len(path) - 1):
        current = parse_node(path[i])
        next_node = parse_node(path[i + 1])
        instructions.append(describe_transition(current, next_node))

        instructions.append(f"\nTotal distance: {path_info.get('distance', 0):.1f} meters")

    return "\n".join(instructions)


def handle_follow_up(query: str, context: NavigationContext) -> str:
    """Handle follow-up questions about the last navigation"""
    if not context.last_navigation:
        return "I don't have any previous navigation information. Please ask for directions first."
    
    query_lower = query.lower()
    
    if any(word in query_lower for word in ["how long", "time", "distance"]):
        if context.last_navigation.get("type") == "integrated":
            total_distance = context.last_navigation.get("total_distance", 0)
        else:
            total_distance = context.last_navigation.get("distance", 0)
        
        # Assuming average walking speed of 1.4 m/s
        time_minutes = (total_distance / 1.4) / 60
        return f"The distance is {total_distance:.1f} meters, which should take about {time_minutes:.1f} minutes to walk."
    
    if "weather" in query_lower and context.last_weather_data:
        if context.last_weather_data["success"]:
            temp = context.last_weather_data["temperature"]
            precip = context.last_weather_data["precipitation"]
            wind = context.last_weather_data["wind_speed"]
            
            weather_desc = f"The current temperature is {temp}°C"
            if precip > 0:
                weather_desc += f" with precipitation of {precip}mm"
            if wind > 10:
                weather_desc += f" and wind speed of {wind} m/s"
            
            return f"{weather_desc}. This may affect your route if you need to go outside."
        else:
            return "I couldn't retrieve the weather data for your route."
    
    return "I'm not sure what you're asking about. Could you please rephrase your question?"

def is_task_query(query: str) -> bool:
    """Check if the query is about tasks"""
    task_keywords = [
        "task", "todo", "to do", "deadline", "due", "schedule",
        "remind", "reminder", "assignment", "project"
    ]
    query_lower = query.lower()
    return any(keyword in query_lower for keyword in task_keywords)

def handle_task_query(query, tasks):
    """Handle any query with the given tasks context."""
    # Load environment variables and initialize OpenAI client
    load_dotenv()
    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

    # Format tasks for OpenAI
    tasks_description = "Here are the user's current tasks:\n"
    for task in tasks:
        task_time = ""
        if task.get('startTime'):
            time = task['startTime'].split('T')[1][:5] if 'T' in task['startTime'] else task['startTime']
            task_time = f" at {time}"
        
        location = f" at {task['address']}" if task.get('address') and task['address'] != 'No location available' else ""
        notes = f" ({task['notes']})" if task.get('notes') and task['notes'] != 'No additional details' else ""
        
        tasks_description += f"- {task['taskName']}{task_time}{location}{notes}\n"

    # Create the prompt for OpenAI
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

def get_tasks_from_storage():
    """Get tasks from AsyncStorage or filesystem"""
    try:
        import json
        import os
        from pathlib import Path

        EXPO_DIRECTORY = '.expo'
        TASK_DIRECTORY = 'tasks.json'
        # Try multiple possible locations for tasks
        possible_paths = [
            Path(os.getcwd()) / EXPO_DIRECTORY / 'async-storage' / TASK_DIRECTORY,
            Path(os.getcwd()).parent / 'app' / EXPO_DIRECTORY / 'async-storage' / TASK_DIRECTORY,
            Path(os.getcwd()).parent / 'app' / 'services' / EXPO_DIRECTORY / 'async-storage' / TASK_DIRECTORY,
            Path(os.getcwd()).parent / EXPO_DIRECTORY / 'async-storage' / TASK_DIRECTORY
        ]

        for storage_file in possible_paths:
            if storage_file.exists():
                print(f"Found tasks at: {storage_file}")  # Debug print
                with open(storage_file, 'r') as f:
                    tasks = json.load(f)
                    return tasks

        print("No tasks file found in any location")  # Debug print
        return []
    except Exception as e:
        print(f"Error reading tasks from storage: {e}")
        return []

SAMPLE_TASKS = [
    {
        "id": "task1",
        "taskName": "Test 1",
        "startTime": "2025-04-04T17:33:00",
        "address": "Concordia University, Boulevard De Maisonneuve Ouest, Montreal, QC, Canada",
        "notes": "No additional details"
    },
    {
        "id": "task2",
        "taskName": "Test 2", 
        "startTime": "2025-04-04T17:35:00",
        "address": "Concordia University, Boulevard De Maisonneuve Ouest, Montreal, QC, Canada",
        "notes": "This is a test"
    }
]


def handle_exit(user_input):
    if user_input.lower() == 'exit':
        print("Goodbye!")
        return True
    return False

def handle_help(user_input):
    if user_input.lower() == 'help':
        print("\nAvailable commands:")
        print("- Ask for directions (e.g., 'How do I get to H-820?')")
        print("- Ask about tasks (e.g., 'What tasks do I have today?')")
        print("- 'exit' to quit")
        print("- 'help' for this menu")
        return True
    return False

def handle_task_query_if_applicable(user_input):
    if is_task_query(user_input):
        tasks = get_tasks_from_storage()
        if not tasks:
            print("No tasks found in storage, using sample tasks")
            tasks = SAMPLE_TASKS
        print(f"Using {len(tasks)} tasks")
        response = handle_task_query(user_input, tasks)
        print("\nConcordia Assistant:", response)
        return True
    return False

def handle_navigation_query_if_applicable(user_input, nav_api):
    if is_navigation_query(user_input):
        start_room, end_room = extract_rooms(user_input)
        if not start_room or not end_room:
            print("\nConcordia Assistant: I couldn't identify the rooms in your query. Please specify them clearly (e.g., 'How do I get from H-820 to H-110?')")
            return True
        path_info = nav_api.find_shortest_path(start_room, end_room)
        nav_context.last_navigation = path_info
        nav_context.last_start_room = start_room
        nav_context.last_end_room = end_room
        response = interpret_path(path_info)
        print("\nConcordia Assistant:", response)
        return True
    return False

def handle_follow_up_if_applicable(user_input):
    if nav_context.last_navigation:
        response = handle_follow_up(user_input, nav_context)
        print("\n Concordia Assistant:", response)
        return True
    return False

def print_default_prompt():
    print("\nConcordia Assistant: I can help you with navigation and tasks. Try asking:")
    print("- 'How do I get to H-820?'")
    print("- 'What tasks do I have today?'")
    print("- Type 'help' for more options")


def main():
    load_dotenv()
    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    nav_api = AINavigationAPI()
    routing_service = IntegratedRoutingService()
    print("Welcome to the Concordia Indoor Navigation and Task Assistant!")
    print("I can help you find your way around campus and manage your tasks.")
    print("Type 'exit' to quit")
    print("Type 'help' for available commands")

    while True:
        try:
            user_input = input("\nYou: ").strip()
            
            if user_input.lower() == 'exit':
                print("Goodbye!")
                break
            elif user_input.lower() == 'help':
                print("\nAvailable commands:")
                print("- Ask for directions (e.g., 'How do I get to H-820?')")
                print("- Ask about tasks (e.g., 'What tasks do I have today?')")
                print("- 'exit' to quit")
                print("- 'help' for this menu")
                continue
            
            # Check if it's a task query
            if is_task_query(user_input):
                # Get tasks from AsyncStorage
                tasks = get_tasks_from_storage()
                if not tasks:
                    print("No tasks found in storage, using sample tasks") # Debug print
                    tasks = SAMPLE_TASKS
                
                print(f"Using {len(tasks)} tasks") # Debug print
                response = handle_task_query(user_input, tasks)
                print("\nConcordia Assistant:", response)
                continue
            
            # Check if it's a navigation query
            if is_navigation_query(user_input):
                start_room, end_room = extract_rooms(user_input)
                start_building, end_building = extract_building_names(user_input)
                
                if not start_room or not end_room:
                    print("\nConcordia Assistant: I couldn't identify the rooms in your query. Please specify them clearly (e.g., 'How do I get from H-820 to H-110?')")
                    continue
                
                # Create location objects for integrated routing
                start_location = {
                    "type": "indoor",
                    "id": start_room,
                    "campus": start_building
                }
                
                end_location = {
                    "type": "indoor",
                    "id": end_room,
                    "campus": end_building
                }
                
                # Get weather data for the route
                weather_data = None
                if start_building != end_building:
                    # For cross-building routes, get weather data
                    # Use the midpoint between buildings for weather data
                    start = routing_service.get_entrance_for_building(start_building)
                    end = routing_service.get_entrance_for_building(end_building)
                    mid_lat = (start.get("lat") + end.get("lat")) / 2
                    mid_lng = (start.get("lng") + end.get("lng")) / 2
                    weather_data = routing_service.get_weather_for_location(mid_lat, mid_lng)
                    nav_context.last_weather_data = weather_data
                    path_info = routing_service.find_integrated_path(start_location, end_location, weather_data=weather_data)

                else:
                    # Use simple indoor navigation for same-building routes
                    print("simple path navigation used.")
                    path_info = nav_api.find_shortest_path(start_room, end_room, campus=start_building)
                
                nav_context.last_navigation = path_info
                nav_context.last_start_location = start_location
                nav_context.last_end_location = end_location
            
                response = interpret_path(path_info)
                print("\nConcordia Assistant:", response)
                continue
            
            # Handle follow-up questions about the last navigation
            if nav_context.last_navigation:
                response = handle_follow_up(user_input, nav_context)
                print("\nConcordia Assistant:", response)
                continue
            
            print("\nConcordia Assistant: I can help you with navigation and tasks. Try asking:")
            print("- 'How do I get to H-820?'")
            print("- 'What tasks do I have today?'")
            print("- Type 'help' for more options")
            
        except Exception as e:
            print(f"\nError: {str(e)}")
            print("Please try again with a different query.")


if __name__ == "__main__":
    main() 
