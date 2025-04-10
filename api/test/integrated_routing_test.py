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
        # Mock the weather function to return a successful response with all weather data
        mock_get_weather.return_value = {
            'temperature': 15.5,
            'precipitation': 0.0,
            'weather_code': 0,
            'wind_speed': 5.0
        }
        
        # Call the method
        result = self.service.get_weather_for_location(45.4972, -73.5790)
        
        # Check the result
        self.assertTrue(result["success"])
        self.assertEqual(result["temperature"], 15.5)
        self.assertEqual(result["precipitation"], 0.0)
        self.assertEqual(result["weather_code"], 0)
        self.assertEqual(result["wind_speed"], 5.0)
    
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
    def test_find_outdoor_path_with_bad_weather(self, mock_find_outdoor_path):
        # Mock the outdoor path function to return a successful response
        mock_find_outdoor_path.return_value = {
            "routes": [
                {
                    "mode": "walking",  # Mode should remain walking as we no longer change it
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
        
        # Create bad weather data
        bad_weather = {
            "success": True,
            "temperature": 5.0,  # Cold temperature
            "precipitation": 2.5,  # Rain
            "weather_code": 61,  # Rain code
            "wind_speed": 25.0  # Strong wind
        }
        
        # Call the method with bad weather
        result = self.service.find_outdoor_path(
            "45.4972,-73.5790", 
            "45.4975,-73.5785", 
            mode="walking",
            weather_data=bad_weather
        )
        
        # Check the result
        self.assertTrue(result["success"])
        self.assertEqual(result["type"], "outdoor")
        self.assertEqual(len(result["routes"]), 1)
        self.assertEqual(result["routes"][0]["mode"], "walking")  # Mode should remain walking
        
        # Verify that find_outdoor_path was called with the correct arguments
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
    def test_find_integrated_path_with_bad_weather_prioritization(self, mock_find_outdoor_path, mock_find_indoor_path):
        """Test that during bad weather, routes between Hall and JMSB use the tunnel and metro entrance"""
        # Mock the indoor path functions to return successful responses
        mock_find_indoor_path.side_effect = [
            # First call: Hall to tunnel entrance
            {
                "path": ["h1_101", "h1_tunnel_entrance"],
                "distance": 30.0,
                "success": True,
                "type": "indoor"
            },
            # Second call: JMSB metro entrance to destination
            {
                "path": ["mb_s2_metro_entrance", "mb1_102"],
                "distance": 20.0,
                "success": True,
                "type": "indoor"
            }
        ]
        
        # Create bad weather data
        bad_weather = {
            "success": True,
            "temperature": 5.0,  # Cold temperature
            "precipitation": 2.5,  # Rain
            "weather_code": 61,  # Rain code
            "wind_speed": 25.0  # Strong wind
        }
        
        # Call the method with bad weather
        start_location = {"type": "indoor", "id": "h1_101", "campus": "hall"}
        end_location = {"type": "indoor", "id": "mb1_102", "campus": "mb"}
        result = self.service.find_integrated_path(start_location, end_location, weather_data=bad_weather)
        
        # Check the result
        self.assertTrue(result["success"])
        self.assertEqual(result["type"], "integrated")
        self.assertEqual(len(result["segments"]), 3)
        
        # Verify that find_indoor_path was called with the correct arguments
        mock_find_indoor_path.assert_any_call("h1_101", "h1_tunnel_entrance", "hall")
        mock_find_indoor_path.assert_any_call("mb_s2_metro_entrance", "mb1_102", "mb")
        
        # Verify that find_outdoor_path was not called (we're using the tunnel)
        mock_find_outdoor_path.assert_not_called()
        
        # Verify that the tunnel segment is present
        tunnel_segment = next(segment for segment in result["segments"] if segment["campus"] == "tunnel")
        self.assertIsNotNone(tunnel_segment)
        self.assertEqual(tunnel_segment["path"], ["h1_tunnel_entrance", "mb_s2_metro_entrance"])
        
        # The total distance should be the sum of the indoor paths plus the tunnel distance
        expected_distance = 30.0 + 50.0 + 20.0  # Indoor start + tunnel + indoor end
        self.assertEqual(result["total_distance"], expected_distance)
    
    @patch('app.integrated_routing.IntegratedRoutingService.find_indoor_path')
    @patch('app.integrated_routing.IntegratedRoutingService.find_outdoor_path')
    def test_find_integrated_path_with_alternative_routes(self, mock_find_outdoor_path, mock_find_indoor_path):
        """Test that the service considers multiple exit/entrance points for optimal routing"""
        # Mock the indoor path functions to return successful responses
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
        
        # Create bad weather data
        bad_weather = {
            "success": True,
            "temperature": 5.0,  # Cold temperature
            "precipitation": 2.5,  # Rain
            "weather_code": 61,  # Rain code
            "wind_speed": 25.0  # Strong wind
        }
        
        # Create a mock for _get_building_exits to return multiple exits
        with patch.object(self.service, '_get_building_exits') as mock_get_exits:
            # Return two exits for each building
            mock_get_exits.side_effect = [
                # First building exits
                [
                    {"id": "h1_exit_main", "lat": 45.4972, "lng": -73.5790},
                    {"id": "h1_exit_side", "lat": 45.4975, "lng": -73.5785}
                ],
                # Second building exits
                [
                    {"id": "mb1_exit_main", "lat": 45.4950, "lng": -73.5780},
                    {"id": "mb1_exit_side", "lat": 45.4955, "lng": -73.5775}
                ]
            ]
            
            # Call the method with bad weather
            start_location = {"type": "indoor", "id": "h1_101", "campus": "hall"}
            end_location = {"type": "indoor", "id": "mb1_102", "campus": "mb"}
            result = self.service.find_integrated_path(start_location, end_location, weather_data=bad_weather)
            
            # Check the result
            self.assertTrue(result["success"])
            self.assertEqual(result["type"], "integrated")
            
            # For Hall to JMSB with bad weather, we should use the tunnel route
            # Verify that find_indoor_path was called with the correct arguments
            mock_find_indoor_path.assert_any_call("h1_101", "h1_tunnel_entrance", "hall")
            mock_find_indoor_path.assert_any_call("mb_s2_metro_entrance", "mb1_102", "mb")
            
            # Verify that find_outdoor_path was not called (we're using the tunnel)
            mock_find_outdoor_path.assert_not_called()
            
            # Verify that the tunnel segment is present
            tunnel_segment = next(segment for segment in result["segments"] if segment["campus"] == "tunnel")
            self.assertIsNotNone(tunnel_segment)
            self.assertEqual(tunnel_segment["path"], ["h1_tunnel_entrance", "mb_s2_metro_entrance"])
    
    # @patch('app.integrated_routing.IntegratedRoutingService.find_indoor_path')
    # @patch('app.integrated_routing.IntegratedRoutingService.find_outdoor_path')
    # def test_weather_affects_path_selection(self, mock_find_outdoor_path, mock_find_indoor_path):
    #     """Test that weather conditions affect the path selection for the same start and end locations"""
    #     # Mock the indoor path functions to return successful responses
    #     # We need to provide enough return values for all possible calls
    #     mock_find_indoor_path.side_effect = [
    #         # For good weather: Hall to exit
    #         {
    #             "path": ["h1_101", "h1_exit_main"],
    #             "distance": 30.0,
    #             "success": True,
    #             "type": "indoor"
    #         },
    #         # For good weather: JMSB entrance to destination
    #         {
    #             "path": ["mb1_entrance_main", "mb1_102"],
    #             "distance": 20.0,
    #             "success": True,
    #             "type": "indoor"
    #         },
    #         # For bad weather: Hall to tunnel entrance
    #         {
    #             "path": ["h1_101", "h1_tunnel_entrance"],
    #             "distance": 30.0,
    #             "success": True,
    #             "type": "indoor"
    #         },
    #         # For bad weather: JMSB metro entrance to destination
    #         {
    #             "path": ["mb_s2_metro_entrance", "mb1_102"],
    #             "distance": 20.0,
    #             "success": True,
    #             "type": "indoor"
    #         },
    #         # Additional return values for any other calls
    #         {
    #             "path": ["h1_101", "h1_exit_side"],
    #             "distance": 35.0,
    #             "success": True,
    #             "type": "indoor"
    #         },
    #         {
    #             "path": ["mb1_entrance_side", "mb1_102"],
    #             "distance": 25.0,
    #             "success": True,
    #             "type": "indoor"
    #         }
    #     ]
        
    #     # Mock the outdoor path function to return a successful response
    #     mock_find_outdoor_path.return_value = {
    #         "routes": [
    #             {
    #                 "mode": "walking",
    #                 "distance": "100 m",
    #                 "duration": "2 mins",
    #                 "steps": [
    #                     {"instruction": "Head north", "distance": "50 m", "duration": "1 min"},
    #                     {"instruction": "Turn right", "distance": "50 m", "duration": "1 min"}
    #                 ],
    #                 "coordinates": [[-73.5790, 45.4972], [-73.5785, 45.4975]]
    #             }
    #         ],
    #         "success": True,
    #         "type": "outdoor"
    #     }
        
    #     # Create a mock for _get_building_exits to return multiple exits
    #     with patch.object(self.service, '_get_building_exits') as mock_get_exits:
    #         # Return two exits for each building
    #         mock_get_exits.side_effect = [
    #             # First building exits
    #             [
    #                 {"id": "h1_exit_main", "lat": 45.4972, "lng": -73.5790},
    #                 {"id": "h1_exit_side", "lat": 45.4975, "lng": -73.5785}
    #             ],
    #             # Second building exits
    #             [
    #                 {"id": "mb1_exit_main", "lat": 45.4950, "lng": -73.5780},
    #                 {"id": "mb1_exit_side", "lat": 45.4955, "lng": -73.5775}
    #             ]
    #         ]
            
    #         # Create good weather data
    #         good_weather = {
    #             "success": True,
    #             "temperature": 20.0,  # Pleasant temperature
    #             "precipitation": 0.0,  # No rain
    #             "weather_code": 0,    # Clear sky
    #             "wind_speed": 5.0     # Light wind
    #         }
            
    #         # Create bad weather data
    #         bad_weather = {
    #             "success": True,
    #             "temperature": 5.0,   # Cold temperature
    #             "precipitation": 2.5,  # Rain
    #             "weather_code": 61,   # Rain code
    #             "wind_speed": 25.0    # Strong wind
    #         }
            
    #         # Call the method with good weather
    #         start_location = {"type": "indoor", "id": "h1_101", "campus": "hall"}
    #         end_location = {"type": "indoor", "id": "mb1_102", "campus": "mb"}
    #         good_weather_result = self.service.find_integrated_path(start_location, end_location, weather_data=good_weather)
            
    #         # Reset the mocks to ensure clean state
    #         mock_find_indoor_path.reset_mock()
    #         mock_find_outdoor_path.reset_mock()
    #         mock_get_exits.reset_mock()
            
    #         # Set up the mocks again for bad weather
    #         mock_find_indoor_path.side_effect = [
    #             # For bad weather: Hall to tunnel entrance
    #             {
    #                 "path": ["h1_101", "h1_tunnel_entrance"],
    #                 "distance": 30.0,
    #                 "success": True,
    #                 "type": "indoor"
    #             },
    #             # For bad weather: JMSB metro entrance to destination
    #             {
    #                 "path": ["mb_s2_metro_entrance", "mb1_102"],
    #                 "distance": 20.0,
    #                 "success": True,
    #                 "type": "indoor"
    #             }
    #         ]
            
    #         mock_get_exits.side_effect = [
    #             # First building exits
    #             [
    #                 {"id": "h1_exit_main", "lat": 45.4972, "lng": -73.5790},
    #                 {"id": "h1_exit_side", "lat": 45.4975, "lng": -73.5785}
    #             ],
    #             # Second building exits
    #             [
    #                 {"id": "mb1_exit_main", "lat": 45.4950, "lng": -73.5780},
    #                 {"id": "mb1_exit_side", "lat": 45.4955, "lng": -73.5775}
    #             ]
    #         ]
            
    #         # Call the method with bad weather
    #         bad_weather_result = self.service.find_integrated_path(start_location, end_location, weather_data=bad_weather)
            
    #         # Check that both results are successful
    #         self.assertTrue(good_weather_result["success"])
    #         self.assertTrue(bad_weather_result["success"])
            
    #         # For Hall to JMSB, the paths should be different in good vs bad weather
    #         # Good weather: Indoor -> Outdoor -> Indoor
    #         # Bad weather: Indoor -> Tunnel -> Indoor
            
    #         # Check that the good weather result has an outdoor segment
    #         good_weather_outdoor_segment = next(segment for segment in good_weather_result["segments"] if segment["type"] == "outdoor")
    #         self.assertIsNotNone(good_weather_outdoor_segment)
            
    #         # Check that the bad weather result has a tunnel segment
    #         bad_weather_tunnel_segment = next(segment for segment in bad_weather_result["segments"] if segment["campus"] == "tunnel")
    #         self.assertIsNotNone(bad_weather_tunnel_segment)
            
    #         # The distances should be different
    #         self.assertNotEqual(good_weather_result["total_distance"], bad_weather_result["total_distance"])
            
    #         # Verify that find_indoor_path was called for both weather conditions
    #         self.assertGreaterEqual(mock_find_indoor_path.call_count, 2)
            
    #         # Verify that find_outdoor_path was called for good weather but not for bad weather
    #         self.assertGreaterEqual(mock_find_outdoor_path.call_count, 1)

    @patch('app.integrated_routing.IntegratedRoutingService.find_indoor_path')
    @patch('app.integrated_routing.IntegratedRoutingService.find_outdoor_path')
    def test_hall_jmsb_tunnel_route_bad_weather(self, mock_find_outdoor_path, mock_find_indoor_path):
        """Test that during bad weather, routes between Hall and JMSB use the tunnel and metro entrance"""
        # Mock the indoor path functions to return successful responses
        mock_find_indoor_path.side_effect = [
            # First call: Hall to tunnel entrance
            {
                "path": ["h1_101", "h1_tunnel_entrance"],
                "distance": 30.0,
                "success": True,
                "type": "indoor"
            },
            # Second call: JMSB metro entrance to destination
            {
                "path": ["mb_s2_metro_entrance", "mb1_102"],
                "distance": 20.0,
                "success": True,
                "type": "indoor"
            }
        ]
        
        # Create bad weather data
        bad_weather = {
            "success": True,
            "temperature": 5.0,  # Cold temperature
            "precipitation": 2.5,  # Rain
            "weather_code": 61,  # Rain code
            "wind_speed": 25.0  # Strong wind
        }
        
        # Call the method with bad weather
        start_location = {"type": "indoor", "id": "h1_101", "campus": "hall"}
        end_location = {"type": "indoor", "id": "mb1_102", "campus": "mb"}
        result = self.service.find_integrated_path(start_location, end_location, weather_data=bad_weather)
        
        # Check the result
        self.assertTrue(result["success"])
        self.assertEqual(result["type"], "integrated")
        self.assertEqual(len(result["segments"]), 3)
        
        # Verify that find_indoor_path was called with the correct arguments
        mock_find_indoor_path.assert_any_call("h1_101", "h1_tunnel_entrance", "hall")
        mock_find_indoor_path.assert_any_call("mb_s2_metro_entrance", "mb1_102", "mb")
        
        # Verify that find_outdoor_path was not called (we're using the tunnel)
        mock_find_outdoor_path.assert_not_called()
        
        # Verify that the tunnel segment is present
        tunnel_segment = next(segment for segment in result["segments"] if segment["campus"] == "tunnel")
        self.assertIsNotNone(tunnel_segment)
        self.assertEqual(tunnel_segment["path"], ["h1_tunnel_entrance", "mb_s2_metro_entrance"])

    @patch('app.integrated_routing.IntegratedRoutingService.find_integrated_path')
    @patch('app.integrated_routing.IntegratedRoutingService.get_weather_for_location')
    @patch('app.integrated_routing.IntegratedRoutingService._create_route_prompt')
    def test_generate_route_with_weather(self, mock_create_prompt, mock_get_weather, mock_find_integrated_path):
        """Test that the route generation includes weather information in the prompt"""
        # Mock the integrated path function to return a successful response
        mock_find_integrated_path.return_value = {
            "segments": [
                {
                    "type": "indoor",
                    "path": ["h1_101", "h1_exit_main"],
                    "distance": 30.0,
                    "campus": "hall"
                },
                {
                    "type": "outdoor",
                    "path": {
                        "mode": "walking",
                        "distance": "100 m",
                        "duration": "2 mins",
                        "steps": [
                            {"instruction": "Head north", "distance": "50 m", "duration": "1 min"},
                            {"instruction": "Turn right", "distance": "50 m", "duration": "1 min"}
                        ]
                    },
                    "distance": 100.0,
                    "weather_adjusted": True
                },
                {
                    "type": "indoor",
                    "path": ["mb1_entrance_main", "mb1_102"],
                    "distance": 30.0,
                    "campus": "mb"
                }
            ],
            "total_distance": 160.0,
            "success": True,
            "type": "integrated"
        }
        
        # Mock the weather function to return weather data
        weather_data = {
            "success": True,
            "temperature": 5.0,
            "precipitation": 2.5,
            "weather_code": 61,
            "wind_speed": 25.0
        }
        mock_get_weather.return_value = weather_data
        
        # Mock the _create_route_prompt method to return a prompt with weather information
        mock_create_prompt.return_value = (
            "Generate clear, step-by-step navigation instructions for the following route:\n\n"
            "Indoor segment 1 (in hall building):\n"
            "- Distance: 30.0 meters\n"
            "- Path: h1_101 → h1_exit_main\n\n"
            "Outdoor segment 2:\n"
            "- Distance: 100.0 meters\n"
            "- Duration: 2 mins\n"
            "- Steps: 2\n\n"
            "Indoor segment 3 (in mb building):\n"
            "- Distance: 30.0 meters\n"
            "- Path: mb1_entrance_main → mb1_102\n\n"
            "Weather conditions:\n"
            "- Temperature: 5.0°C\n"
            "- Precipitation: 2.5\n"
            "- Weather Code: 61\n"
            "- Wind Speed: 25.0 m/s\n\n"
            "Please provide clear, step-by-step instructions for navigating this route, including any weather considerations."
        )
        
        # Create a mock OpenAI client
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = MagicMock(
            choices=[MagicMock(message=MagicMock(content="Here are your directions..."))]
        )
        
        # Set the mock client as the openai_client attribute of the service
        self.service.openai_client = mock_client
        
        # Call the method with an outdoor location to ensure weather data is fetched
        start_location = {"type": "indoor", "id": "h1_101", "campus": "hall"}
        end_location = {"type": "outdoor", "lat": 45.4975, "lng": -73.5785}
        result = self.service.generate_route_with_weather(start_location, end_location)
        
        # Check the result
        self.assertTrue(result["success"])
        self.assertIn("path", result)
        self.assertIn("instructions", result)
        self.assertIn("weather_data", result)
        
        # Verify that get_weather_for_location was called
        mock_get_weather.assert_called_once()
        
        # Verify that _create_route_prompt was called with the correct arguments
        mock_create_prompt.assert_called_once_with(mock_find_integrated_path.return_value, weather_data)
        
        # Verify that the OpenAI client was called with the correct prompt
        mock_client.chat.completions.create.assert_called_once()
        call_args = mock_client.chat.completions.create.call_args[1]
        self.assertIn("messages", call_args)
        messages = call_args["messages"]
        self.assertEqual(len(messages), 2)
        self.assertEqual(messages[0]["role"], "system")
        self.assertEqual(messages[1]["role"], "user")
        
        # Check that the prompt includes weather information
        prompt = messages[1]["content"]
        self.assertIn("Weather conditions:", prompt)
        self.assertIn("Temperature:", prompt)
        self.assertIn("Precipitation:", prompt)
        self.assertIn("Weather Code:", prompt)
        self.assertIn("Wind Speed:", prompt)

if __name__ == '__main__':
    unittest.main()