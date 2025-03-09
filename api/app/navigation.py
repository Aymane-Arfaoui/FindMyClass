from flask import Blueprint, request, jsonify
from flask_cors import cross_origin

import graph.Graph as Graph
navigation_routes = Blueprint('indoor_navigation', __name__)

g = None
import os

@navigation_routes.route('/indoor_navigation', methods=['GET'])
@cross_origin()
def indoor_navigation():
    if g is None:

        g = Graph.load_graph_from_json(None, 'api/app/graph/graph.json')

    return jsonify(h_building_first_floor)




