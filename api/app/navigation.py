from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
from app.aiapi import AINavigationAPI
from chat import interpret_path

# Initialize Blueprint
navigation_routes = Blueprint('navigation_routes', __name__)

# Initialize navigation API
nav_api = AINavigationAPI()

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