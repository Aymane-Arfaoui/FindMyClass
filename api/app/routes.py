from flask import Blueprint, session, jsonify

"""
This file contains the main routes for the API. It is used for testing purposes.
"""

main_routes = Blueprint('main', __name__)

@main_routes.route('/')
def home():
    return {"message": "Welcome to the API"}

@main_routes.route('/logged_in')
def logged_in():
    if 'user' not in session:
        return {"error": "User not logged in"}, 401

    user_info = session['user']
    return jsonify({
        "message": f"Welcome {user_info['name']}",
        "email": user_info['email'],
        "picture": user_info['picture']
    })
