import React, {useState} from "react";
import {
    ActivityIndicator,
    Animated,
    Image,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {theme} from "@/constants/theme";
import { useNavigation } from "@react-navigation/native";
import PropTypes from "prop-types";
import {wp} from "@/helpers/common";

const DEFAULT_IMAGE_URL = "https://www.kpmb.com/wp-content/uploads/2016/06/0004_N76_300dpi-scaled.jpg";


function hasIndoorMap(buildingName = "") {
    const lower = buildingName.toLowerCase();
    let buildingKey = null;

    if (lower.includes("hall building")) {
        buildingKey = "Hall";
    } else if (lower.includes("john molson") || lower.includes("mb ")) {
        buildingKey = "MB";
    } else if (lower.includes("cc") || lower.includes("central building")) {
        buildingKey = "CC";
    }

    return buildingKey;
}


function BuildingDetailsPanel({
                                  selectedBuilding,
                                  buildingDetails,
                                  panHandlers,
                                  panelY,
                                  onClose,
                                  onDirectionPress,
                                  currentLocation,
                                  mode,
                                  GOOGLE_PLACES_API_KEY,
                                  loading
                              }) {
    const buildingKey = hasIndoorMap(selectedBuilding?.name);
    const navigation = useNavigation();

    const [modalVisible, setModalVisible] = useState(false);

    const [classroomModalVisible, setClassroomModalVisible] = useState(false);
    const [classroomNumber, setClassroomNumber] = useState("");
    const handleDirectionPress = () => {
        if (buildingKey) {
            setModalVisible(true);
        } else {
            onDirectionPress(currentLocation, selectedBuilding, mode, false);
        }
    };

    const handleModalResponse = (wantsClassroom) => {
        setModalVisible(false);
        // if (wantsClassroom !== null) {
        //     onDirectionPress(currentLocation, selectedBuilding, mode, wantsClassroom);
        // }

        if (wantsClassroom === true) {
            setClassroomModalVisible(true); // Show classroom selection modal
        } else if (wantsClassroom === false) {
            onDirectionPress(currentLocation, selectedBuilding, mode, false);
        }

    };


    const handleClassroomSelection = () => {
        setClassroomModalVisible(false);
        if (classroomNumber) {
            const CLASSROOM_CONSTANT = classroomNumber; // Save to a constant (or pass it directly)
            onDirectionPress(currentLocation, selectedBuilding, mode, true, CLASSROOM_CONSTANT);
        }
    };


    return (
        <Animated.View
            {...panHandlers}
            style={[styles.bottomPanel, {transform: [{translateY: panelY}]}]}
        >
            <TouchableOpacity
                testID={'close-button'}
                onPress={onClose}
                style={styles.closeButton}
                activeOpacity={0.7}
            >
                <Ionicons name="close-circle" size={32} color={theme.colors.dark}/>
            </TouchableOpacity>

            <View style={styles.dragBar}/>

            {loading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} testID={'loading-indicator'}/>
            ) : (
                <>
                    <Text style={styles.buildingName}>
                        {selectedBuilding?.name || "Loading..."}
                    </Text>

                    {buildingDetails && (
                        <>
                            {buildingDetails.photos && buildingDetails.photos.length > 0 ? (
                                <Image
                                    source={{
                                        uri: `https://places.googleapis.com/v1/${buildingDetails.photos[0].name}/media?maxWidthPx=1200&maxHeightPx=1200&key=${GOOGLE_PLACES_API_KEY}`,
                                    }}
                                    style={styles.buildingImage}
                                    resizeMode="cover"
                                    testID={'building-image'}
                                />
                            ) : (
                                <Image
                                    source={{uri: DEFAULT_IMAGE_URL}}
                                    style={styles.buildingImage}
                                    resizeMode="cover"
                                    testID={'default-image'}
                                />
                            )}

                            <Text style={styles.buildingDetails}>
                                {buildingDetails.formattedAddress || "No address available"}
                            </Text>
                        </>
                    )}


                    {!buildingKey && (

                    // <TouchableOpacity style={styles.directionButton}
                    //                   testID={'direction-button'}
                    //                   onPress={(_event) => onDirectionPress(currentLocation, selectedBuilding, mode)}>
                    //     <Ionicons name="navigate-circle" size={22} color={theme.colors.white}/>
                    //     <Text style={styles.directionButtonText}>Get Directions</Text>
                    // </TouchableOpacity>

                        <TouchableOpacity
                        style={styles.directionButton}
                        testID={'direction-button'}
                        onPress={handleDirectionPress}
                        >
                            <Ionicons name="navigate-circle" size={22} color={theme.colors.white} />
                            <Text style={styles.directionButtonText}>Get Directions</Text>
                        </TouchableOpacity>

                    )}

                    {buildingKey && (
                        // <TouchableOpacity style={styles.directionButton}
                        //                   testID={'direction-button'}
                        //                   onPress={(_event) => onDirectionPress(currentLocation, selectedBuilding, mode)}>
                        //     <Ionicons name="navigate-circle" size={22} color={theme.colors.white}/>
                        //     <Text style={styles.directionButtonText}>Get Directions</Text>
                        // </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.directionButton}
                            testID={'direction-button'}
                            onPress={handleDirectionPress}
                        >
                            <Ionicons name="navigate-circle" size={22} color={theme.colors.white} />
                            <Text style={styles.directionButtonText}>Get Directions</Text>
                        </TouchableOpacity>
                    )}

                    <Modal
                        animationType="fade"
                        transparent={true}
                        visible={modalVisible}
                        onRequestClose={() => setModalVisible(false)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalText}>
                                    Would you like to go to a specific classroom in the {buildingKey} building?
                                </Text>
                                <View style={styles.modalButtonContainer}>
                                    <View style={styles.yesNoButtons}>
                                        <TouchableOpacity
                                            style={[styles.modalButton, styles.yesButton]}
                                            onPress={() => handleModalResponse(true)}
                                        >
                                            <Ionicons name="map" size={18} color={theme.colors.white} />
                                            <Text style={styles.modalButtonText}> Yes</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.modalButton, styles.noButton]}
                                            onPress={() => handleModalResponse(false)}
                                        >
                                            <Ionicons name="navigate-circle" size={18} color={theme.colors.white} />
                                            <Text style={styles.modalButtonText}> No</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.cancelButton]}
                                        onPress={() => handleModalResponse(null)}
                                    >
                                        <Ionicons name="arrow-undo" size={18} color={theme.colors.white} />
                                        <Text style={styles.modalButtonText}> Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>


                    <Modal
                        animationType="fade"
                        transparent={true}
                        visible={classroomModalVisible}
                        onRequestClose={() => setClassroomModalVisible(false)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalText}>
                                    Enter the classroom number in {buildingKey}:
                                </Text>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="e.g., H-920"
                                    value={classroomNumber}
                                    onChangeText={setClassroomNumber}
                                />
                                <View style={styles.modalButtonContainer}>
                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.yesButton]}
                                        onPress={handleClassroomSelection}
                                    >
                                        <Text style={styles.modalButtonText}>Confirm</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.cancelButton]}
                                        onPress={() => setClassroomModalVisible(false)}
                                    >
                                        <Text style={styles.modalButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>


                    {buildingKey && (
                        <TouchableOpacity
                            testID={'indoor-map-button'}
                            style={styles.indoorMapButton}
                            onPress={() => {
                                navigation.navigate("MapScreen", { buildingKey });
                            }}
                        >
                            <Ionicons name="map" size={22} color={theme.colors.white} />
                            <Text style={styles.indoorMapButtonText}>Indoor Map</Text>
                        </TouchableOpacity>
                    )}
                </>
            )}
        </Animated.View>
    );
}

BuildingDetailsPanel.propTypes={
    selectedBuilding: PropTypes.any,
    buildingDetails:PropTypes.any,
    panHandlers:PropTypes.any,
    panelY:PropTypes.any,
    onClose:PropTypes.func,
    onDirectionPress:PropTypes.func,
    currentLocation:PropTypes.any,
    mode:PropTypes.string,
    GOOGLE_PLACES_API_KEY:PropTypes.string,
    loading:PropTypes.bool,

}

export default BuildingDetailsPanel;

const styles = StyleSheet.create({
    bottomPanel: {
        position: "absolute",
        bottom: 0,
        width: "100%",
        backgroundColor: theme.colors.white,
        padding: 20,
        paddingBottom: 25,
        borderTopLeftRadius: theme.radius.xxl,
        borderTopRightRadius: theme.radius.xxl,
        shadowColor: theme.colors.dark,
        shadowOffset: {width: 0, height: -3},
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 8,
    },
    closeButton: {
        position: "absolute",
        top: -15,
        right: 2,
        backgroundColor: theme.colors.white,
        borderRadius: 20,
        padding: 5,
        shadowColor: theme.colors.dark,
        shadowOffset: {width: 0, height: 3},
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 6,
        zIndex: 10,
    },
    dragBar: {
        width: 40,
        height: 5,
        backgroundColor: "#B0B0B0",
        borderRadius: 3,
        alignSelf: "center",
        marginBottom: 15,
        marginTop: -5,
        opacity: 0.6,
    },
    buildingName: {
        fontSize: 20,
        fontWeight: "bold",
        color: theme.colors.dark,
        marginBottom: 10,
        textAlign: "center",
    },
    buildingDetails: {
        fontSize: 14,
        color: theme.colors.textLight,
        textAlign: "center",
        marginBottom: 8,
    },
    buildingImage: {
        width: "100%",
        height: 180,
        borderRadius: 15,
        marginBottom: 12,
        backgroundColor: "#f0f0f0",
        alignSelf: "center",
    },

    directionButton: {
        flexDirection: "row",
        marginTop: 12,
        backgroundColor: theme.colors.primary,
        paddingVertical: 14,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
    },
    directionButtonText: {
        color: theme.colors.white,
        fontSize: 16,
        fontWeight: "bold",
        marginLeft: 8,
    },
    indoorMapButton: {
        flexDirection: "row",
        marginTop: 12,
        backgroundColor: theme.colors.blueDark,
        paddingVertical: 14,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: theme.colors.dark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 6,
    },
    indoorMapButtonText: {
        color: theme.colors.white,
        fontSize: 16,
        fontWeight: "bold",
        marginLeft: 8,
    },


    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        width: wp(100),
    },
    modalContent: {
        backgroundColor: theme.colors.white,
        padding: 20,
        borderRadius: 10,
        alignItems: "center",
        elevation: 5,
        width: wp(90),
        minHeight: 200,

    },
    modalText: {
        fontSize: 18,
        color: theme.colors.dark,
        marginBottom: 20,
        textAlign: "center",
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
    },
    modalButton: {
        flex: 1,
        paddingVertical: 10,
        marginHorizontal: 5,
        borderRadius: 5,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
    },
    yesButton: {
        backgroundColor: theme.colors.blueDark,
    },
    noButton: {
        backgroundColor: theme.colors.primary,
    },
    cancelButton: {
        backgroundColor: theme.colors.textLight,
    },
    modalButtonText: {
        color: theme.colors.white,
        fontSize: 18,
        fontWeight: "bold",
    },
    modalButtonContainer: {
        width: "100%",
        height: 100,
    },
    yesNoButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    textInput: {
        width: "100%",
        padding: 10,
        borderWidth: 1,
        borderColor: theme.colors.textLight,
        borderRadius: 5,
        marginBottom: 20,
        fontSize: 16,
    },
});