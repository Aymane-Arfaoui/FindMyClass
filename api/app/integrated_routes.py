from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from .integrated_routing import IntegratedRoutingService

integrated_routes = Blueprint('integratedNavigation', __name__)
routing_service = IntegratedRoutingService()

@integrated_routes.route('/integratedNavigation', methods=['POST'])
@cross_origin()
def integrated_navigation():
    """
    Find a route that may include both indoor and outdoor segments, considering weather conditions
    
    Expected JSON payload:
    {
        "start": {
            "type": "indoor" or "outdoor",
            "id": "room_id" (for indoor),
            "campus": "building_name" (for indoor),
            "lat": latitude (for outdoor),
            "lng": longitude (for outdoor)
        },
        "end": {
            "type": "indoor" or "outdoor",
            "id": "room_id" (for indoor),
            "campus": "building_name" (for indoor),
            "lat": latitude (for outdoor),
            "lng": longitude (for outdoor)
        },
        "consider_weather": true/false (optional, defaults to true)
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        start_location = data.get("start")
        end_location = data.get("end")
        consider_weather = data.get("consider_weather", True)
        
        if not start_location or not end_location:
            return jsonify({"error": "Missing start or end location"}), 400
        
        # Validate location types
        if start_location.get("type") not in ["indoor", "outdoor"] or end_location.get("type") not in ["indoor", "outdoor"]:
            return jsonify({"error": "Location type must be 'indoor' or 'outdoor'"}), 400
        
        # Validate required fields based on type
        if start_location["type"] == "indoor":
            if not start_location.get("id") or not start_location.get("campus"):
                return jsonify({"error": "Indoor locations require 'id' and 'campus' fields"}), 400
        else:
            if "lat" not in start_location or "lng" not in start_location:
                return jsonify({"error": "Outdoor locations require 'lat' and 'lng' fields"}), 400
        
        if end_location["type"] == "indoor":
            if not end_location.get("id") or not end_location.get("campus"):
                return jsonify({"error": "Indoor locations require 'id' and 'campus' fields"}), 400
        else:
            if "lat" not in end_location or "lng" not in end_location:
                return jsonify({"error": "Outdoor locations require 'lat' and 'lng' fields"}), 400
        
        # Generate route with weather consideration
        result = routing_service.generate_route_with_weather(start_location, end_location)
        
        if not result["success"]:
            return jsonify({"error": result.get("error", "Failed to find a route")}), 404
        
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@integrated_routes.route('/weather', methods=['GET'])
@cross_origin()
def get_weather():
    """Get weather data for a location"""
    try:
        lat = request.args.get('lat')
        lng = request.args.get('lng')
        
        if not lat or not lng:
            return jsonify({"error": "Missing latitude or longitude"}), 400
        
        try:
            lat = float(lat)
            lng = float(lng)
        except ValueError:
            return jsonify({"error": "Invalid latitude or longitude"}), 400
        
        weather_data = routing_service.get_weather_for_location(lat, lng)
        
        if not weather_data["success"]:
            return jsonify({"error": weather_data.get("error", "Failed to get weather data")}), 500
        
        return jsonify(weather_data), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500 