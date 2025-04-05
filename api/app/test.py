from flask import Blueprint, jsonify
from flask_cors import cross_origin


test_routes = Blueprint('test', __name__)

@test_routes.route('/test', methods=['GET'])
@cross_origin()
def test():
    return jsonify({"message": "This is a test route"})



