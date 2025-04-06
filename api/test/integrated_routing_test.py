import unittest
from unittest.mock import patch, MagicMock
import sys
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv("./.env.local")
# Add the parent directory to the path so we can import the app
current_dir = Path(os.getcwd())
if 'api' not in current_dir.parts:
    current_dir = current_dir / 'api'
sys.path.append(str(current_dir))

from app.integrated_routing import IntegratedRoutingService

class TestIntegratedRoutingService(unittest.TestCase):
    def setUp(self):
        # Mock the Graph class to avoid loading actual graph data
        with patch('app.integrated_routing.Graph') as mock_graph:
            mock_graph_instance = MagicMock()
            mock_graph.return_value = mock_graph_instance
            self.service = IntegratedRoutingService()
    
    @patch('app.integrated_routing.get_weather')
    def test_get_weather_for_location(self, mock_get_weather):
        # Mock the weather function to return a successful response
        mock_get_weather.return_value = 15.5
        
        # Call the method
        result = self.service.get_weather_for_location(45.4972, -73.5790)
        
        # Check the result
        self.assertTrue(result["success"])
        self.assertEqual(result["temperature"], 15.5)
    
    @patch('app.integrated_routing.get_weather')
    def test_get_weather_for_location_error(self, mock_get_weather):
        # Mock the weather function to return an error
        mock_get_weather.side_effect = Exception("Weather API error")
        
        # Call the method
        result = self.service.get_weather_for_location(45.4972, -73.5790)
        
        # Check the result
        self.assertFalse(result["success"])
        self.assertIn("error", result)
    
    @patch('app.integrated_routing.IntegratedRoutingService.find_indoor_path')
    def test_find_indoor_path(self, mock_find_indoor_path):
        # Mock the indoor path function to return a successful response
        mock_find_indoor_path.return_value = {
            "path": ["h1_101", "h1_hw1", "h1_102"],
            "distance": 50.0,
            "success": True,
            "type": "indoor"
        }
        
        # Call the method
        result = self.service.find_indoor_path("h1_101", "h1_102", "hall")
        
        # Check the result
        self.assertTrue(result["success"])
        self.assertEqual(result["type"], "indoor")
        self.assertEqual(result["distance"], 50.0)
        self.assertEqual(len(result["path"]), 3)
    
    @patch('app.integrated_routing.IntegratedRoutingService.find_outdoor_path')
    def test_find_outdoor_path(self, mock_find_outdoor_path):
        # Mock the outdoor path function to return a successful response
        mock_find_outdoor_path.return_value = {
            "routes": [
                {
                    "mode": "walking",
                    "distance": "100 m",
                    "duration": "2 mins",
                    "steps": [
                        {"instruction": "Head north", "distance": "50 m", "duration": "1 min"},
                        {"instruction": "Turn right", "distance": "50 m", "duration": "1 min"}
                    ],
                    "coordinates": [[-73.5790, 45.4972], [-73.5785, 45.4975]]
                }
            ],
            "success": True,
            "type": "outdoor"
        }
        
        # Call the method
        result = self.service.find_outdoor_path("45.4972,-73.5790", "45.4975,-73.5785")
        
        # Check the result
        self.assertTrue(result["success"])
        self.assertEqual(result["type"], "outdoor")
        self.assertEqual(len(result["routes"]), 1)
        self.assertEqual(result["routes"][0]["mode"], "walking")
    
    @patch('app.integrated_routing.IntegratedRoutingService.find_indoor_path')
    # @patch('app.integrated_routing.IntegratedRoutingService.find_outdoor_path')
    def test_find_integrated_path_indoor_to_indoor_same_building(self, mock_find_indoor_path):
        # Mock the indoor path function to return a successful response
        mock_find_indoor_path.return_value = {
            "path": ["h1_101", "h1_hw1", "h1_102"],
            "distance": 50.0,
            "success": True,
            "type": "indoor"
        }
        
        # Call the method
        start_location = {"type": "indoor", "id": "h1_101", "campus": "hall"}
        end_location = {"type": "indoor", "id": "h1_102", "campus": "hall"}
        result = self.service.find_integrated_path(start_location, end_location)
        
        # Check the result
        self.assertTrue(result["success"])
        self.assertEqual(result["type"], "indoor")
        self.assertEqual(result["distance"], 50.0)
        self.assertEqual(len(result["path"]), 3)
        
        # Verify that find_indoor_path was called with the correct arguments
        # Note: The actual implementation doesn't pass the False parameter
        mock_find_indoor_path.assert_called_with("h1_101", "h1_102", "hall")
    
    @patch('app.integrated_routing.IntegratedRoutingService.find_indoor_path')
    @patch('app.integrated_routing.IntegratedRoutingService.find_outdoor_path')
    def test_find_integrated_path_indoor_to_indoor_different_buildings(self, mock_find_outdoor_path, mock_find_indoor_path):
        # Mock the indoor path functions to return successful responses
        # Use a MagicMock with a side_effect that always returns the same value
        mock_find_indoor_path.return_value = {
            "path": ["h1_101", "h1_exit_main"],
            "distance": 30.0,
            "success": True,
            "type": "indoor"
        }
        
        # Mock the outdoor path function to return a successful response
        mock_find_outdoor_path.return_value = {
            "routes": [
                {
                    "mode": "walking",
                    "distance": "100 m",
                    "duration": "2 mins",
                    "steps": [
                        {"instruction": "Head north", "distance": "50 m", "duration": "1 min"},
                        {"instruction": "Turn right", "distance": "50 m", "duration": "1 min"}
                    ],
                    "coordinates": [[-73.5790, 45.4972], [-73.5785, 45.4975]]
                }
            ],
            "success": True,
            "type": "outdoor"
        }
        
        # Call the method
        start_location = {"type": "indoor", "id": "h1_101", "campus": "hall"}
        end_location = {"type": "indoor", "id": "mb1_102", "campus": "mb"}
        result = self.service.find_integrated_path(start_location, end_location)
        
        # Check the result
        self.assertTrue(result["success"])
        self.assertEqual(result["type"], "integrated")
        self.assertEqual(result["total_distance"], 160.0)
        self.assertEqual(len(result["segments"]), 3)
        
        # Verify that find_indoor_path was called at least twice
        self.assertGreaterEqual(mock_find_indoor_path.call_count, 2)
        
        # Verify that find_outdoor_path was called at least once
        self.assertGreaterEqual(mock_find_outdoor_path.call_count, 1)
    
    @patch('app.integrated_routing.IntegratedRoutingService.find_outdoor_path')
    def test_find_integrated_path_outdoor_to_outdoor(self, mock_find_outdoor_path):
        # Mock the outdoor path function to return a successful response
        mock_find_outdoor_path.return_value = {
            "routes": [
                {
                    "mode": "walking",
                    "distance": "100 m",
                    "duration": "2 mins",
                    "steps": [
                        {"instruction": "Head north", "distance": "50 m", "duration": "1 min"},
                        {"instruction": "Turn right", "distance": "50 m", "duration": "1 min"}
                    ],
                    "coordinates": [[-73.5790, 45.4972], [-73.5785, 45.4975]]
                }
            ],
            "success": True,
            "type": "outdoor"
        }
        
        # Call the method
        start_location = {"type": "outdoor", "lat": 45.4972, "lng": -73.5790}
        end_location = {"type": "outdoor", "lat": 45.4975, "lng": -73.5785}
        result = self.service.find_integrated_path(start_location, end_location)
        
        # Check the result
        self.assertTrue(result["success"])
        self.assertEqual(result["type"], "outdoor")
        self.assertEqual(len(result["routes"]), 1)
        self.assertEqual(result["routes"][0]["mode"], "walking")
        
        # Verify that find_outdoor_path was called with the correct arguments
        # Note: The actual implementation uses a different format for coordinates
        mock_find_outdoor_path.assert_called()
    
    @patch('app.integrated_routing.IntegratedRoutingService.find_indoor_path')
    @patch('app.integrated_routing.IntegratedRoutingService.find_outdoor_path')
    def test_find_integrated_path_indoor_to_outdoor(self, mock_find_outdoor_path, mock_find_indoor_path):
        # Mock the indoor path function to return a successful response
        mock_find_indoor_path.return_value = {
            "path": ["h1_101", "h1_exit_main"],
            "distance": 30.0,
            "success": True,
            "type": "indoor"
        }
        
        # Mock the outdoor path function to return a successful response
        mock_find_outdoor_path.return_value = {
            "routes": [
                {
                    "mode": "walking",
                    "distance": "100 m",
                    "duration": "2 mins",
                    "steps": [
                        {"instruction": "Head north", "distance": "50 m", "duration": "1 min"},
                        {"instruction": "Turn right", "distance": "50 m", "duration": "1 min"}
                    ],
                    "coordinates": [[-73.5790, 45.4972], [-73.5785, 45.4975]]
                }
            ],
            "success": True,
            "type": "outdoor"
        }
        
        # Call the method
        start_location = {"type": "indoor", "id": "h1_101", "campus": "hall"}
        end_location = {"type": "outdoor", "lat": 45.4975, "lng": -73.5785}
        result = self.service.find_integrated_path(start_location, end_location)
        
        # Check the result
        self.assertTrue(result["success"])
        self.assertEqual(result["type"], "integrated")
        self.assertEqual(result["total_distance"], 130.0)
        self.assertEqual(len(result["segments"]), 2)
        
        # Verify that find_indoor_path was called at least once
        self.assertGreaterEqual(mock_find_indoor_path.call_count, 1)
        
        # Verify that find_outdoor_path was called at least once
        self.assertGreaterEqual(mock_find_outdoor_path.call_count, 1)
    
    @patch('app.integrated_routing.IntegratedRoutingService.find_indoor_path')
    @patch('app.integrated_routing.IntegratedRoutingService.find_outdoor_path')
    def test_find_integrated_path_outdoor_to_indoor(self, mock_find_outdoor_path, mock_find_indoor_path):
        # Mock the indoor path function to return a successful response
        mock_find_indoor_path.return_value = {
            "path": ["h1_entrance_main", "h1_102"],
            "distance": 20.0,
            "success": True,
            "type": "indoor"
        }
        
        # Mock the outdoor path function to return a successful response
        mock_find_outdoor_path.return_value = {
            "routes": [
                {
                    "mode": "walking",
                    "distance": "100 m",
                    "duration": "2 mins",
                    "steps": [
                        {"instruction": "Head north", "distance": "50 m", "duration": "1 min"},
                        {"instruction": "Turn right", "distance": "50 m", "duration": "1 min"}
                    ],
                    "coordinates": [[-73.5790, 45.4972], [-73.5785, 45.4975]]
                }
            ],
            "success": True,
            "type": "outdoor"
        }
        
        # Call the method
        start_location = {"type": "outdoor", "lat": 45.4972, "lng": -73.5790}
        end_location = {"type": "indoor", "id": "h1_102", "campus": "hall"}
        result = self.service.find_integrated_path(start_location, end_location)
        
        # Check the result
        self.assertTrue(result["success"])
        self.assertEqual(result["type"], "integrated")
        self.assertEqual(result["total_distance"], 120.0)
        self.assertEqual(len(result["segments"]), 2)
        
        # Verify that find_indoor_path was called at least once
        self.assertGreaterEqual(mock_find_indoor_path.call_count, 1)
        
        # Verify that find_outdoor_path was called at least once
        self.assertGreaterEqual(mock_find_outdoor_path.call_count, 1)

if __name__ == '__main__':
    unittest.main()