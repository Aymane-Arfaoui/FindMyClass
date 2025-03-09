import os
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import app.graph.Graph as Graph


navigation_routes = Blueprint('indoorNavigation', __name__)

g = None

@navigation_routes.route('/indoorNavigation', methods=['GET'])
@cross_origin()
def indoor_navigation():
    global g
    start_id = request.args.get('startId')
    end_id = request.args.get('endId')

    if not start_id or not end_id:
        return jsonify({"error": "Missing required parameters 'startId' and 'endId'"}), 400

    if g is None:
        for root, dirs, files in os.walk('app/data'):
            for file in files:
                if file.endswith('.json'):
                    g = Graph.load_graph_from_json(g, os.path.join(root, file))

    path = g.find_shortest_path(start_id, end_id)

    return jsonify({"path": path})
