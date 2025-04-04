import os
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from api.app.graph.Graph2 import Graph
from pathlib import Path

# import app.graph.Graph as Graph
# from collections import defaultdict

navigation_routes = Blueprint('indoorNavigation', __name__)

g = {}
accessibility_graph = {}


@navigation_routes.route('/indoorNavigation', methods=['GET'])
@cross_origin()
def indoor_navigation():
    start_id = request.args.get('startId')
    end_id = request.args.get('endId')
    destinations = request.args.getlist('destinations[]')
    campus = request.args.get('campus')
    accessibility = request.args.get('accessibility')
    current_directory = Path(os.getcwd())

    #    If we're not in the 'api' directory, prepend it to the path
    if 'api' not in current_directory.parts:
        current_directory = current_directory / 'api'

    file_path = current_directory / f'app/data/campus_jsons/{campus}'

    if os.path.exists(file_path) is False:
        return jsonify({"error": "Campus not found"}), 400

    if not start_id:
        return jsonify({"error": "Missing required parameter 'startId'"}), 400

    if not end_id and not destinations:
        return jsonify({"error": "Must provide either 'endId' or 'destinations[]'"}), 400

    if campus not in g:
        g[campus] = Graph()
        g[campus].load_from_json_folder(file_path)

    if accessibility and accessibility.lower() == 'true':
        if campus not in accessibility_graph:
            accessibility_graph[campus] = Graph()
            accessibility_graph[campus].graph = get_sub_graph(g[campus])
        graph_to_use = accessibility_graph[campus]

    else:
        graph_to_use = g[campus]

    if end_id:
        path = graph_to_use.find_shortest_path(start_id, end_id)
        if not path:
            return jsonify({"error": "Destination inaccessible from Start location"}), 404
        return jsonify({"path": path}), 200

    result = graph_to_use.find_paths_to_multiple_destinations(start_id, destinations)
    if not result["paths"]:
        return jsonify({"error": "No valid paths found"}), 404

    return jsonify(result), 200


def get_sub_graph(g):
    nx_graph = g.graph
    allowed_edges = set(nx_graph.edges())

    # Remove escalator and stairs edges
    for edge in nx_graph.edges():
        if "escalator" in edge[0] or "stairs" in edge[0] or "escalator" in edge[1] or "stairs" in edge[1]:
            allowed_edges.remove(edge)

    # Create a subgraph with allowed edges only
    return nx_graph.edge_subgraph(allowed_edges).copy()
