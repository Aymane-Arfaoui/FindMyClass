import requests

def get_weather(latitude, longitude):
    try:
        response = requests.get(f"https://api.open-meteo.com/v1/forecast?latitude={latitude}&longitude={longitude}&current=temperature_2m,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m")
        response.raise_for_status()  # Raises an HTTPError for bad responses
        data = response.json()
        
        try:
            return {
                'temperature': data['current']['temperature_2m'],
                'precipitation': data['current']['precipitation'], 
                'weather_code': data['current']['weather_code'],
                'wind_speed': data['current']['wind_speed_10m']
            }
        except KeyError as e:
            raise ValueError(f"Missing expected data in API response: {str(e)}")
            
    except requests.RequestException as e:
        raise Exception(f"Failed to fetch weather data: {str(e)}")
    except ValueError as e:
        raise Exception(f"Error parsing weather data: {str(e)}")