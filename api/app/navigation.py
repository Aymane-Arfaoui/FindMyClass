import os
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from app.graph.Graph2 import Graph
from pathlib import Path

# import app.graph.Graph as Graph
# from collections import defaultdict

navigation_routes = Blueprint('indoorNavigation', __name__)

g = {}


@navigation_routes.route('/indoorNavigation', methods=['GET'])
@cross_origin()
def indoor_navigation():
    start_id = request.args.get('startId')
    end_id = request.args.get('endId')
    destinations = request.args.getlist('destinations[]')
    campus = request.args.get('campus')
    file_path = Path(f'app/data/campus_jsons/{campus}')

    if os.path.exists(file_path) is False:
        return jsonify({"error": "Campus not found"}), 400

    if not start_id:
        return jsonify({"error": "Missing required parameter 'startId'"}), 400

    if not end_id and not destinations:
        return jsonify({"error": "Must provide either 'endId' or 'destinations[]'"}), 400

    if campus not in g:
        g[campus] = Graph()
        g[campus].load_from_json_folder(file_path)

    if end_id:
        path = g[campus].find_shortest_path(start_id, end_id)
        if not path:
            return jsonify({"error": "Destination inaccessible from Start location"}), 204
        return jsonify({"path": path}), 200

    result = g[campus].find_paths_to_multiple_destinations(start_id, destinations)
    if not result["paths"]:
        return jsonify({"error": "No valid paths found"}), 204

    return jsonify(result), 200
