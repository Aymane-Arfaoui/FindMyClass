import React, {useEffect, useState} from "react";
import {Modal, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {theme} from "@/constants/theme";
import DatePicker from "react-native-date-picker";
import GooglePlacesAutocomplete from "@/components/GooglePlacesAutocomplete";

const CreateTask = ({isVisible, onClose}) => {
    const now = new Date();
    const [taskName, setTaskName] = useState("");
    const [notes, setNotes] = useState("");
    const [address, setAddress] = useState("");
    const [date, setDate] = useState(new Date());
    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(new Date(now.getTime() + 60 * 60 * 1000));
    const [allDayEvent, setAllDayEvent] = useState(false); // NEW State

    const [openDatePicker, setOpenDatePicker] = useState(false);
    const [openStartTimePicker, setOpenStartTimePicker] = useState(false);
    const [openEndTimePicker, setOpenEndTimePicker] = useState(false);

    const resetForm = () => {
        setTaskName("");
        setNotes("");
        setAddress("");
        setDate(new Date());
        setStartTime(new Date());
        setEndTime(new Date(now.getTime() + 60 * 60 * 1000));
        setAllDayEvent(false);
    };

    useEffect(() => {
        if (isVisible) {
            resetForm();
        }
    }, [isVisible]);

    const formatTime = (time) => time.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"});

    const handleSaveEvent = () => {
        // Future implementation for adding tasks
    };

    return (
        <Modal animationType="slide" transparent visible={isVisible} onRequestClose={onClose}>
            <View style={styles.modalContainer}>
                <View style={styles.bottomSheet}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close-circle" size={32} color="#333"/>
                    </TouchableOpacity>
                    <Text style={styles.headerText}>Create New Task</Text>
                    <View>
                        <TextInput style={styles.input} value={taskName} onChangeText={setTaskName}
                                   placeholder="Task Name"/>
                        <GooglePlacesAutocomplete address={address} onAddressSelect={setAddress}/>

                        <Text style={styles.label}>Date</Text>
                        <TouchableOpacity onPress={() => setOpenDatePicker(true)} style={styles.inputButton}>
                            <Text style={styles.inputText}>{date.toDateString()}</Text>
                        </TouchableOpacity>
                        <DatePicker modal open={openDatePicker} date={date} mode="date" minimumDate={new Date()}
                                    onConfirm={(selectedDate) => {
                                        setOpenDatePicker(false);
                                        setDate(selectedDate);
                                    }} onCancel={() => setOpenDatePicker(false)}
                        />

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
                                            setEndTime(new Date(now.getTime() + 60 * 60 * 1000));
                                        }
                                    }}
                                    trackColor={{
                                        false: theme.colors.lightGray,
                                        true: theme.colors.primary
                                    }}  // Change false state color
                                    thumbColor={allDayEvent ? theme.colors.white : theme.colors.darkGray}  // Adjust thumb color
                                />
                            </TouchableOpacity>
                        </View>


                        {/* Show Time Pickers only if All Day is OFF */}
                        {!allDayEvent && (
                            <>
                                <Text style={styles.label}>Start Time</Text>
                                <TouchableOpacity onPress={() => setOpenStartTimePicker(true)}
                                                  style={styles.inputButton}>
                                    <Text style={styles.inputText}>{formatTime(startTime)}</Text>
                                </TouchableOpacity>
                                <DatePicker modal open={openStartTimePicker} date={startTime} mode="time"
                                            onConfirm={(selectedTime) => {
                                                setOpenStartTimePicker(false);
                                                setStartTime(selectedTime);
                                            }} onCancel={() => setOpenStartTimePicker(false)}
                                />

                                <Text style={styles.label}>End Time</Text>
                                <TouchableOpacity onPress={() => setOpenEndTimePicker(true)} style={styles.inputButton}>
                                    <Text style={styles.inputText}>{formatTime(endTime)}</Text>
                                </TouchableOpacity>
                                <DatePicker modal open={openEndTimePicker} date={endTime} mode="time"
                                            minimumDate={startTime}
                                            onConfirm={(selectedTime) => {
                                                setOpenEndTimePicker(false);
                                                setEndTime(selectedTime);
                                            }} onCancel={() => setOpenEndTimePicker(false)}
                                />
                            </>
                        )}

                        <Text style={styles.label}>Notes</Text>
                        <TextInput style={styles.textArea} value={notes} onChangeText={setNotes} placeholder="Add notes"
                                   multiline/>

                        <TouchableOpacity style={styles.saveButton} onPress={handleSaveEvent}>
                            <Text style={styles.saveButtonText}>Create Event</Text>
                        </TouchableOpacity>
                    </View>
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
        marginLeft: 8,
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
});

export default CreateTask;
