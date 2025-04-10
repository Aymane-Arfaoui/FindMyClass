# FindMyClass Integrated Routing System

This system provides integrated indoor-outdoor routing for the FindMyClass application, considering weather conditions and using ChatGPT to generate human-readable instructions.

## Features

- **Indoor Routing**: Navigate between rooms within the same building using the Graph2.py implementation
- **Outdoor Routing**: Navigate between outdoor locations using the Google Maps API
- **Integrated Routing**: Seamlessly combine indoor and outdoor routing for complete journeys
- **Weather Consideration**: Adjust routes based on current weather conditions
- **AI-Powered Instructions**: Generate clear, step-by-step navigation instructions using ChatGPT

## API Endpoints

### Integrated Navigation

```
POST /integratedNavigation
```

Find a route that may include both indoor and outdoor segments, considering weather conditions.

**Request Body:**
```json
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
```

**Response:**
```json
{
    "path": {
        "type": "indoor" or "outdoor" or "integrated",
        "segments": [
            {
                "type": "indoor",
                "path": ["node1", "node2", ...],
                "distance": 50.0,
                "campus": "hall"
            },
            {
                "type": "outdoor",
                "path": {...},
                "distance": 100.0,
                "weather_adjusted": true
            }
        ],
        "total_distance": 150.0,
        "success": true
    },
    "instructions": "Step-by-step navigation instructions...",
    "weather_data": {
        "temperature": 15.5,
        "success": true
    },
    "success": true
}
```

### Weather Information

```
GET /weather?lat=45.4972&lng=-73.5790
```

Get weather data for a specific location.

**Response:**
```json
{
    "temperature": 15.5,
    "success": true
}
```

## How It Works

1. **Location Extraction**: The system extracts indoor and outdoor locations from user queries
2. **Weather Check**: For routes involving outdoor segments, the system checks the current weather
3. **Path Finding**: 
   - For indoor-to-indoor routes in the same building: Uses the Graph2.py implementation
   - For indoor-to-indoor routes in different buildings: Combines indoor paths with outdoor segments
   - For outdoor-to-outdoor routes: Uses the Google Maps API
   - For mixed indoor-outdoor routes: Combines the appropriate path types
4. **Weather Adjustment**: Adjusts route preferences based on weather conditions (e.g., avoiding outdoor segments in cold weather)
5. **Instruction Generation**: Uses ChatGPT to generate clear, step-by-step navigation instructions

## Setup

1. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Set up environment variables in `.env.local`:
   ```
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   OPENAI_API_KEY=your_openai_api_key
   ```

3. Run the API server:
   ```
   python run.py
   ```

## Testing

Run the tests with:
```
python -m pytest test/integrated_routing_test.py
```

## Integration with Frontend

The frontend can use the `/integratedNavigation` endpoint to get routes that include both indoor and outdoor segments. The response includes detailed instructions and weather information that can be displayed to the user. 