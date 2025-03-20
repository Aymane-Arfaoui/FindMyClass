import React, {useEffect, useState} from "react";
import {Modal, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {theme} from "@/constants/theme";
import DatePicker from "react-native-date-picker";
import GooglePlacesAutocomplete from "@/components/GooglePlacesAutocomplete";

const EditList = ({isVisible, onClose, taskData}) => {
    const [taskName, setTaskName] = useState("");
    const [notes, setNotes] = useState("");
    const [address, setAddress] = useState("");
    const [date, setDate] = useState(new Date());
    const [startTime, setStartTime] = useState(null);
    const [endTime, setEndTime] = useState(null);
    const [isEditingAddress, setIsEditingAddress] = useState(false);
    const [openDatePicker, setOpenDatePicker] = useState(false);
    const [openStartTimePicker, setOpenStartTimePicker] = useState(false);
    const [openEndTimePicker, setOpenEndTimePicker] = useState(false);
    const [allDayEvent, setAllDayEvent] = useState(false);

    useEffect(() => {
        if (taskData) {
            setTaskName(taskData.taskName || "");
            setNotes(taskData.notes || "");
            setAddress(taskData.address || "");
            setDate(taskData.date ? new Date(taskData.date) : new Date());

            if (taskData.startTime === "All Day" || !taskData.endTime === "All Day") {
                setAllDayEvent(true);
                setStartTime(null);
                setEndTime(null);
            } else {
                setAllDayEvent(false);
                setStartTime(new Date(taskData.startTime));
                setEndTime(new Date(taskData.endTime));
            }
        }
    }, [taskData]);

    const handleUpdateEvent = () => {
        // Future implementation for updating task
    };

    const formatTime = (time) => time ? time.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"}) : "N/A";

    return (
        <Modal animationType="slide" transparent visible={isVisible} onRequestClose={onClose}>
            <View style={styles.modalContainer}>
                <View style={styles.bottomSheet}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close-circle" size={32} color="#333"/>
                    </TouchableOpacity>
                    <Text style={styles.headerText}>Edit Task</Text>

                    <TextInput
                        style={styles.input}
                        value={taskName}
                        onChangeText={setTaskName}
                        placeholder="Task Name"
                    />

                    {isEditingAddress ? (
                        <GooglePlacesAutocomplete
                            address={address}
                            onAddressSelect={(newAddress) => {
                                setAddress(newAddress);
                                setIsEditingAddress(false);
                            }}
                            autoFocus={true}
                        />
                    ) : (
                        <TouchableOpacity onPress={() => setIsEditingAddress(true)} style={styles.input}>
                            <Text style={[styles.inputText, !address && styles.placeholderText]}>
                                {address || "Enter Address"}
                            </Text>
                        </TouchableOpacity>

                    )}


                    <Text style={styles.label}>Date</Text>
                    <TouchableOpacity onPress={() => setOpenDatePicker(true)} style={styles.inputButton}>
                        <Text style={styles.inputText}>{date.toDateString()}</Text>
                    </TouchableOpacity>
                    <DatePicker
                        modal
                        open={openDatePicker}
                        date={date}
                        mode="date"
                        onConfirm={(selectedDate) => {
                            setOpenDatePicker(false);
                            setDate(selectedDate);
                        }}
                        onCancel={() => setOpenDatePicker(false)}
                    />

                    {/* All Day Toggle */}
                    <View style={styles.allDayContainer}>
                        <TouchableOpacity onPress={() => setAllDayEvent(!allDayEvent)} style={styles.allDayToggle}>
                            <Text style={styles.label}>All Day Event</Text>
                            <Switch
                                value={allDayEvent}
                                onValueChange={(value) => {
                                    setAllDayEvent(value);
                                    if (value) {
                                        setStartTime(null);
                                        setEndTime(null);
                                    } else {
                                        setStartTime(new Date());
                                        setEndTime(new Date(new Date().getTime() + 60 * 60 * 1000));
                                    }
                                }}
                                trackColor={{false: theme.colors.gray, true: theme.colors.primary}}
                                thumbColor={allDayEvent ? theme.colors.white : theme.colors.darkGray}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Start & End Time (Hidden if All Day is selected) */}
                    {!allDayEvent && (
                        <>
                            <Text style={styles.label}>Start Time</Text>
                            <TouchableOpacity onPress={() => setOpenStartTimePicker(true)} style={styles.inputButton}>
                                <Text style={styles.inputText}>{formatTime(startTime)}</Text>
                            </TouchableOpacity>
                            <DatePicker
                                modal
                                open={openStartTimePicker}
                                date={startTime || new Date()}
                                mode="time"
                                onConfirm={(selectedTime) => {
                                    setOpenStartTimePicker(false);
                                    setStartTime(selectedTime);
                                }}
                                onCancel={() => setOpenStartTimePicker(false)}
                            />

                            <Text style={styles.label}>End Time</Text>
                            <TouchableOpacity onPress={() => setOpenEndTimePicker(true)} style={styles.inputButton}>
                                <Text style={styles.inputText}>{formatTime(endTime)}</Text>
                            </TouchableOpacity>
                            <DatePicker
                                modal
                                open={openEndTimePicker}
                                date={endTime || new Date()}
                                mode="time"
                                onConfirm={(selectedTime) => {
                                    setOpenEndTimePicker(false);
                                    setEndTime(selectedTime);
                                }}
                                onCancel={() => setOpenEndTimePicker(false)}
                            />
                        </>
                    )}

                    <Text style={styles.label}>Notes</Text>
                    <TextInput
                        style={styles.textArea}
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Add notes"
                        multiline
                    />

                    <TouchableOpacity style={styles.saveButton} onPress={handleUpdateEvent}>
                        <Text style={styles.saveButtonText}>Update Event</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    bottomSheet: {
        backgroundColor: theme.colors.white,
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    closeButton: {
        alignSelf: "flex-end",
    },
    headerText: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 15,
        textAlign: "center",
    },
    input: {
        borderWidth: 1,
        borderColor: theme.colors.gray,
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        fontSize: 16,
    },
    inputButton: {
        borderWidth: 1,
        borderColor: theme.colors.gray,
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        backgroundColor: theme.colors.gray,
        alignItems: "center",
    },
    inputText: {
        fontSize: 16,
    },
    textArea: {
        borderWidth: 1,
        borderColor: theme.colors.gray,
        borderRadius: 10,
        padding: 12,
        height: 100,
        marginBottom: 10,
        fontSize: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 5,
    },
    saveButton: {
        flexDirection: "row",
        marginTop: 12,
        backgroundColor: theme.colors.primary,
        paddingVertical: 14,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
    },
    saveButtonText: {
        color: theme.colors.white,
        fontSize: 16,
        fontWeight: "bold",
    },
    allDayToggle: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    allDayContainer: {
        marginBottom: 10,
    },
    placeholderText: {
        color: theme.colors.gray,
    }
});

export default EditList;
