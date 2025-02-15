import React, {useEffect, useRef, useState} from 'react';
import {Animated, PanResponder, StatusBar, StyleSheet, View} from 'react-native';
import Map from '../components/Map';
import {fetchRoutes} from '../services/routeService';
import {getUserLocation} from '../services/userService';
import BuildingDetailsPanel from "@/components/BuildingDetailsPanel";
import {theme} from "@/constants/theme";
import MapButtons from "@/components/MapButtons";
import MainSearchBar from "@/components/MainSearchBar";
import LiveLocationButton from '@/components/LiveLocationButton';
import { GOOGLE_PLACES_API_KEY } from '@env';

import { type } from '@testing-library/react-native/build/user-event/type';



export default function Homemap(){
    const [buildingDetails, setBuildingDetails] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [routes, setRoutes] = useState([]);
    const [fastestRoute, setFastestRoute] = useState(null);
    const [loading, setLoading] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [centerCoordinate, setCenterCoordinate] = useState([-73.5789, 45.4960]);
    const [transitMode, setTransitMode] = useState('Walk');
    const cameraRef = useRef(null);

    const panelY = useRef(new Animated.Value(500)).current;

    useEffect(() => {
        let isMounted = true; // Flag to prevent state updates after unmount
      
        // Fetch user location initially
        const fetchInitialLocation = async () => {
          try {
            const location = await getUserLocation();
            if (isMounted) {
              setCurrentLocation({
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: [location.lng, location.lat],
                },
              });
              setCenterCoordinate([location.lng, location.lat]);
            }
          } catch (error) {
            console.error("Error fetching user location:", error);
          }
        };
      
        fetchInitialLocation();
      
        // Set up interval to poll user location every 5 seconds
        const interval = setInterval(async () => {
          try {
            const location = await getUserLocation();
            if (isMounted) {
              setCurrentLocation({
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: [location.lng, location.lat],
                },
              });
            }
          } catch (error) {
            console.error("Error fetching user location in interval:", error);
          }
        }, 5000);
      
        // Cleanup function
        return () => {
          clearInterval(interval);
          isMounted = false; // Prevent further updates
        };
      }, [selectedLocation, transitMode]); // Empty dependency array ensures this runs once on mount
        


    //     useEffect(() => {
            
    //         const initialize = async () => {
    //             try {
    //               const location = await getUserLocation();
    //               setCurrentLocation(location);
    //               if (dest) {
    //                 await fetchRoutesData(location, dest, transitMode);
    //               }
    //             } catch (error) {
    //               console.error('Error initializing location/routes:', error);
    //             } finally {
    //               setLoading(false);
    //             }
    //     },[dest, transitMode]);
    
    //     initialize();
    
    //     const interval = setInterval(async () => {
    //       const location = await getUserLocation();
    //       setCurrentLocation(location);
    //     }, 5000);
    
    //     return () => clearInterval(interval);
    //   }, [dest, transitMode]);


      

    const handleDirectionPress = async (origin, dest, mode) => {
        setLoading(true);

        if (!origin || !dest) {
            // console.error("entered handleDirectionPress");    
            // console.error("Origin:", origin);
            // console.error("Destination:", dest);
            // console.error("Mode:", mode);
            console.error("Invalid origin or destination");
            setLoading(false);
            return;
        }
      
        
      
        try {
          // Extract coordinates for origin
          const originCoords = origin.geometry?.coordinates;
      
          // Extract coordinates for destination
          let destCoords;
          if (dest.geometry?.type === "Point") {
            // If destination is a point
            destCoords = dest.geometry.coordinates;
          } else if (dest.geometry?.type === "Polygon") {
            // If destination is a polygon, use its centroid or textPosition
            destCoords = dest.properties?.textPosition || getCentroid(dest.geometry.coordinates[0]);
          }
      
          if (!originCoords || !destCoords) {
            console.error("Could not extract coordinates for origin or destination");
            return;
          }
      
        //   console.log("Origin:", originCoords);
        //   console.log("Destination:", destCoords);
      
          // Fetch routes between origin and destination
          await fetchRoutesData(originCoords, destCoords, mode);
        } catch (error) {
          console.error("Error in handleDirectionPress:", error.message);
        } finally {
          setLoading(false);
        }
        // console.log("entered handleDirectionPress");
        // console.log("Selected Location:", selectedLocation);
        // console.log("User Location:", currentLocation);
        // console.log("Routes:", routes);
        // console.log("exit handledirectionpress");
      };

    const fetchRoutesData = async (origin, destination, mode) => {
        fetchRoutes(origin, destination, mode).then((routesData) => {
            if(Array.isArray(routesData) && routesData.length > 0){
                // console.log("Routes data:", routesData);
                routesData.sort((a, b) => parseInt(a.duration) - parseInt(b.duration));
                routesData = routesData.slice(0, 3);
                setRoutes(routesData);
                setFastestRoute(routesData[0]);
            }
            else{
                setRoutes([]);
                setFastestRoute(null);
            }
        }).catch((error)=> {
            console.error("Error fetching routes:", error);
            setRoutes([]);
            setFastestRoute(null);
        }) 
    }

        


    const handleBuildingPress = async (building = null, lng = null, lat = null) => {
        setLoading(true);
        // console.log("Building: ", building);
        if (building) {
            // setSelectedBuilding(building);

            const [buildingLng, buildingLat] = building.textPosition || [lng, lat];
            const offsetLat = (buildingLat || lat) - 0.0010;
            setSelectedLocation(
                {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [buildingLng || lng, buildingLat || lat],
                    },
                }
            );


                const {name} = building;

                
                fetch(
                    `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
                        name
                    )}&inputtype=textquery&fields=place_id&locationbias=circle:2000@${buildingLat || lat},${buildingLng || lng}&key=${GOOGLE_PLACES_API_KEY}`
                )
                .then((response) => response.json())
                .then((data) => {
                    if (data.candidates.length > 0) {
                        const placeId = data.candidates[0].place_id;
    
                        fetch(
                            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,formatted_address,opening_hours,photos&key=${GOOGLE_PLACES_API_KEY}`
                        ).then((detailsResponse) => detailsResponse.json()).then((detailsData) => {
                            if (detailsData.result) {
                                setBuildingDetails(detailsData.result);
                            } else {
                                setBuildingDetails(null);
                            }
                        }).catch((error) => {
                            console.error("Error fetching building details:", error);
                            setBuildingDetails(null);
                        });

                    } else {
                        setBuildingDetails(null);
                    }
                }).catch((error) => {
                    console.error("Error fetching building details:", error);
                    setBuildingDetails(null);
                });
                
        } else if (lng !== null && lat !== null) {
            const offsetLat = lat - 0.0010;

            // setSelectedLocation({
            //     type: "Feature",
            //     geometry: {
            //         type: "Point",
            //         coordinates: [lng, offsetLat],
            //     },
            // });

            fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_PLACES_API_KEY}`)
            .then((response) => response.json())
            .then((data) => {
                if (data.results.length > 0) {
                    const placeDetails = data.results[0];
                    setBuildingDetails(placeDetails);
                    setSelectedLocation({
                        type: "Feature",
                        geometry: {
                            type: "Point",
                            coordinates: [lng, lat],
                        },
                    });
                } else {
                    setBuildingDetails(null);
                    setSelectedLocation(null);
                    setRoutes([]);
                    setFastestRoute(null);
                }
            }).catch((error) => {
                console.error("Error fetching building details:", error);
                setBuildingDetails(null);
            });
            // console.log("Building:", building);
            // console.log("Selected Location:", selectedLocation);
            // console.log("User Location:", currentLocation);
            // console.log("Routes:", routes);
            // console.log("lng:", lng);
            // console.log("lat:", lat);
        }


        Animated.timing(panelY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start();
        setLoading(false);  
    };


    const handleClosePanel = () => {
        Animated.timing(panelY, {
            toValue: 500,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setBuildingDetails(null);
            setRoutes([]);
            setFastestRoute(null);
            panelY.setValue(500);
        });
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (event, gesture) => {
                if (gesture.dy > 0) {
                    panelY.setValue(gesture.dy);
                }
            },
            onPanResponderRelease: (event, gesture) => {
                if (gesture.dy > 100) {
                    handleClosePanel();
                } else {
                    Animated.spring(panelY, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;


    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="dark-content"/>
            <Map
                onBuildingPress={handleBuildingPress}
                selectedLocation={selectedLocation}
                userLocation={currentLocation}
                routes={routes}
                selectedRoute={fastestRoute}
                onMapPress={handleClosePanel}
                cameraRef={cameraRef}
                centerCoordinate={centerCoordinate}
            />

            <View style={styles.searchOverlay}>
                <MainSearchBar
                    onLocationSelect={setSelectedLocation}
                    onBuildingPress={handleBuildingPress}
                />
            </View>
            <View style={styles.mapButtonsContainer}>
                <MapButtons
                    onPress={(location) => {
                        setSelectedLocation(location);
                        handleClosePanel();
                    }}
                />
            </View>
            <LiveLocationButton onPress={setSelectedLocation}/>


            {selectedLocation && (
                <BuildingDetailsPanel
                    currentLocation={currentLocation}
                    selectedBuilding={selectedLocation}
                    buildingDetails={buildingDetails}
                    loading={loading}
                    panelY={panelY}
                    panHandlers={panResponder.panHandlers}
                    onClose={handleClosePanel}
                    onDirectionPress={handleDirectionPress}
                    GOOGLE_PLACES_API_KEY={GOOGLE_PLACES_API_KEY}
                    mode={transitMode}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingTop: StatusBar.currentHeight || 0,
        position: 'relative',
    },
    searchOverlay: {
        position: 'absolute',
        top: 80,
        left: 10,
        right: 10,
        zIndex: 10,
    },
    infoBox: {
        position: 'absolute',
        bottom: 20,
        left: 10,
        right: 10,
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5
    },
    mapButtonsContainer: {
        position: 'absolute',
        bottom: 820,
        left: 10,
        right: 10,
        zIndex: 5,
        alignItems: 'center',
    },
    header: {fontSize: 18, fontWeight: "bold"},
    routeCard: {padding: 10, borderBottomWidth: 1, borderBottomColor: '#ddd'},
    routeMode: {fontSize: 16, fontWeight: "bold"},
    noRoutes: {textAlign: "center", color: "gray", marginTop: 10}
});


const getCentroid = (polygon) => {
    let x = 0, y = 0, n = polygon.length;
  
    polygon.forEach(([lng, lat]) => {
      x += lng;
      y += lat;
    });
  
    return [x / n, y / n];
  };