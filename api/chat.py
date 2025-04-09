import os
from openai import OpenAI
from dotenv import load_dotenv
from app.aiapi import AINavigationAPI
import re
import json

class NavigationContext:
    def __init__(self):
        self.last_navigation = None
        self.last_start_room = None
        self.last_end_room = None

# Initialize global context
nav_context = NavigationContext()

def analyze_navigation_query(query: str) -> dict:
    """Use AI to analyze if the query is about navigation and extract destinations"""
    load_dotenv()
    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    
    prompt = f"""Analyze the following query and determine if it's asking for directions/navigation between locations.
If it is a navigation query, extract all locations in sequence in the format "hX_YYY" where X is the floor number and YYY is the room number.
If it's not a navigation query, set is_navigation to false.

Query: "{query}"

Respond in JSON format with the following structure:
{{
    "is_navigation": boolean,
    "locations": [string] or null,  # List of locations in sequence
    "explanation": string
}}

Examples:
1. For "how to go from H-196 to H-840":
{{
    "is_navigation": true,
    "locations": ["h1_196", "h8_840"],
    "explanation": "Query is asking for directions between two rooms"
}}

2. For "how to go from H-110 to H-196 then to H-840 and finally to H-109":
{{
    "is_navigation": true,
    "locations": ["h1_110", "h1_196", "h8_840", "h1_109"],
    "explanation": "Query is asking for directions through multiple rooms in sequence"
}}

3. For "what's the weather like":
{{
    "is_navigation": false,
    "locations": null,
    "explanation": "Query is not about navigation"
}}"""

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that analyzes queries to determine if they are about navigation and extracts locations in the correct format."},
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" }
        )
        
        result = json.loads(response.choices[0].message.content)
        print(f"AI Analysis Result: {result}")
        return result
        
    except Exception as e:
        print(f"Error in AI analysis: {str(e)}")
        return {
            "is_navigation": False,
            "locations": None,
            "explanation": f"Error analyzing query: {str(e)}"
        }

def is_navigation_query(query: str) -> bool:
    """Check if the query is asking for directions using AI"""
    result = analyze_navigation_query(query)
    return result["is_navigation"]

def extract_rooms(query: str) -> list:
    """Extract room numbers from the query using AI"""
    result = analyze_navigation_query(query)
    if result["is_navigation"]:
        return result["locations"]
    return None

def interpret_path(path_info: dict) -> str:
    """Convert path information into human-readable instructions using AI"""
    if not path_info or "error" in path_info:
        return path_info.get("error", "Could not find a path between these rooms.")
    
    path = path_info.get("path", [])
    distance = path_info.get("distance", 0)
    
    if not path:
        return "No path found between these rooms."
    
    load_dotenv()
    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    
    prompt = f"""Convert the following path information into clear, natural walking directions.
The path is a sequence of nodes representing a journey through a building.
Each node has a specific type and may indicate floor changes.

Path: {path}
Total distance: {distance} meters

Please provide:
1. Clear step-by-step instructions
2. Mention any floor changes and how to make them (elevator, stairs, escalator)
3. Include approximate walking time (assuming average walking speed of 1.4 m/s)
4. Make the instructions sound natural and conversational
5. Use the exact room identifiers (e.g., h1_109, h1_110) when referring to rooms

Example format:
"Here's how to get there:
1. Start at [starting point]
2. [First instruction]
3. [Second instruction]
...
It should take about X minutes to walk there."

Node types to watch for:
- elevator: indicates an elevator
- stairs: indicates stairs
- escalator: indicates an escalator
- hw: indicates a hallway
- room numbers: indicate specific rooms (use exact identifiers like h1_109)

Please provide the instructions in a clear, friendly tone."""

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful indoor navigation assistant that provides clear, natural walking directions."},
                {"role": "user", "content": prompt}
            ]
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        print(f"Error in path interpretation: {str(e)}")
        return "I encountered an error while generating the directions. Please try again."

def interpret_multiple_paths(paths_info: dict) -> str:
    """Convert multiple paths information into human-readable instructions"""
    if not paths_info or "error" in paths_info:
        return paths_info.get("error", "Could not find paths between the rooms.")
    
    paths = paths_info.get("paths", [])
    total_distance = paths_info.get("total_distance", 0)
    
    if not paths:
        return "No paths found between the rooms."
    
    load_dotenv()
    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    
    prompt = f"""Convert the following multiple paths information into clear, natural walking directions.
Each path represents a journey between two consecutive destinations.

Paths: {paths}
Total distance: {total_distance} meters

Please provide:
1. Clear step-by-step instructions for each segment
2. Mention any floor changes and how to make them (elevator, stairs, escalator)
3. Include approximate walking time for each segment and total time (assuming average walking speed of 1.4 m/s)
4. Make the instructions sound natural and conversational
5. Use the exact room identifiers (e.g., h1_109, h1_110) when referring to rooms

Example format:
"Here's your complete route:

First segment (X to Y):
1. [First instruction]
2. [Second instruction]
...
This segment should take about X minutes.

Second segment (Y to Z):
1. [First instruction]
2. [Second instruction]
...
This segment should take about Y minutes.

Total journey time: About Z minutes."

Node types to watch for:
- elevator: indicates an elevator
- stairs: indicates stairs
- escalator: indicates an escalator
- hw: indicates a hallway
- room numbers: indicate specific rooms (use exact identifiers like h1_109)

Please provide the instructions in a clear, friendly tone."""

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful indoor navigation assistant that provides clear, natural walking directions."},
                {"role": "user", "content": prompt}
            ]
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        print(f"Error in path interpretation: {str(e)}")
        return "I encountered an error while generating the directions. Please try again."

def handle_follow_up(query: str, context: NavigationContext) -> str:
    """Handle follow-up questions about the last navigation"""
    if not context.last_navigation:
        return "I don't have any previous navigation information. Please ask for directions first."
    
    query_lower = query.lower()
    
    if any(word in query_lower for word in ["how long", "time", "distance"]):
        distance = context.last_navigation.get("distance", 0)
        # Assuming average walking speed of 1.4 m/s
        time_minutes = (distance / 1.4) / 60
        return f"The distance is {distance:.1f} meters, which should take about {time_minutes:.1f} minutes to walk."
    
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
    client = OpenAI(
        api_key=os.getenv('OPENAI_API_KEY'),
        max_retries=3,
        timeout=30.0
    )

    # Check if the query is asking to list all tasks
    if any(keyword in query.lower() for keyword in ["list", "show", "what are", "what's", "what is"]):
        if not tasks:
            return "You don't have any tasks scheduled."
        
        formatted_tasks = []
        for task in tasks:
            task_time = ""
            if task.get('startTime'):
                time = task['startTime'].split('T')[1][:5] if 'T' in task['startTime'] else task['startTime']
                task_time = f" at {time}"
            
            location = f" at {task['address']}" if task.get('address') and task['address'] != 'No location available' else ""
            notes = f" ({task['notes']})" if task.get('notes') and task['notes'] != 'No additional details' else ""
            
            formatted_tasks.append(f"- {task['taskName']}{task_time}{location}{notes}")
        
        return "Here are your tasks:\n" + "\n".join(formatted_tasks)

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

        # Try multiple possible locations for tasks
        possible_paths = [
            Path(os.getcwd()) / '.expo' / 'async-storage' / 'tasks.json',
            Path(os.getcwd()).parent / 'app' / '.expo' / 'async-storage' / 'tasks.json',
            Path(os.getcwd()).parent / 'app' / 'services' / '.expo' / 'async-storage' / 'tasks.json',
            Path(os.getcwd()).parent / '.expo' / 'async-storage' / 'tasks.json'
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

def process_navigation_query(query: str) -> str:
    """Process a navigation query using AI analysis and path finding"""
    # First, analyze the query using AI
    analysis = analyze_navigation_query(query)
    
    if not analysis["is_navigation"]:
        return analysis["explanation"]
    
    locations = analysis["locations"]
    
    if not locations or len(locations) < 2:
        return "I couldn't identify the locations. Please try rephrasing your question."
    
    # Initialize the navigation API
    nav_api = AINavigationAPI()
    
    try:
        if len(locations) == 2:
            # Simple path between two points
            path_info = nav_api.find_shortest_path(locations[0], locations[1])
            return interpret_path(path_info)
        else:
            # Multiple destinations
            start = locations[0]
            destinations = locations[1:]
            paths_info = nav_api.find_multiple_destinations(start, destinations)
            return interpret_multiple_paths(paths_info)
        
    except Exception as e:
        print(f"Error in path finding: {str(e)}")
        return "I encountered an error while finding the path. Please try again."

def main():
    # Load environment variables
    load_dotenv()
    
    # Initialize OpenAI client
    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    
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
            
            # Process as a navigation query
            response = process_navigation_query(user_input)
            print("\nConcordia Assistant:", response)
            
        except Exception as e:
            print(f"\nError: {str(e)}")
            print("Please try again with a different query.")

if __name__ == "__main__":
    main() 
