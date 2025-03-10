import os
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import app.graph.Graph as Graph
from collections import defaultdict

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
        g[campus] = Graph.Graph()
        for root, dirs, files in os.walk(f'app/data/campus_jsons/{campus}'):
            for file in files:
                if file.endswith('.json'):
                    g[campus] = Graph.load_graph_from_json(g[campus], os.path.join(root, file))

    path = g[campus].find_shortest_path(start_id, end_id)

    if not path:
        return jsonify({"error": "Destination inaccessible from Start location"}), 204

    return jsonify({"path": path}), 200
