import os
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from app.graph.Graph import Graph

# import app.graph.Graph as Graph
# from collections import defaultdict

navigation_routes = Blueprint('indoorNavigation', __name__)

g = {}

@navigation_routes.route('/indoorNavigation', methods=['GET'])
@cross_origin()
def indoor_navigation():
    
    start_id = request.args.get('startId')
    end_id = request.args.get('endId')
    campus = request.args.get('campus')

    if os.path.exists(f'app/data/campus_jsons/{campus}') is False:
        return jsonify({"error": "Campus not found"}), 400

    if not start_id or not end_id:
        return jsonify({"error": "Missing required parameters 'startId' and 'endId'"}), 400

    if campus not in g:
        g[campus] = Graph()
        g[campus].load_from_json_folder(f'app/data/campus_jsons/{campus}')
        

    path = g[campus].find_shortest_path(start_id, end_id)

    if not path:
        return jsonify({"error": "Destination inaccessible from Start location"}), 204

    return jsonify({"path": path}), 200
