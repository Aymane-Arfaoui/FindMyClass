import string
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import os

import graph.Graph as Graph
navigation_routes = Blueprint('indoor_navigation', __name__)

g = None


@navigation_routes.route('/indoor_navigation', methods=['GET'])
@cross_origin()
def indoor_navigation(startId:string, endId:string):
    if g is None:
        for root, dirs, files in os.walk('api/app/data'):
            for file in files:
                if file.endswith('.json'):
                    g = Graph.load_graph_from_json(g, os.path.join(root, file))
        

    g.




