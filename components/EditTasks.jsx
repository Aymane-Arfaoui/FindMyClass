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
            <View style={styles.editTaskModalContainer}>
                <View style={styles.editTaskBottomSheet}>
                    <TouchableOpacity onPress={onClose} style={styles.editTaskCloseButton}>
                        <Ionicons name="close-circle" size={32} color="#333"/>
                    </TouchableOpacity>
                    <Text style={styles.editTaskHeaderText}>Edit Task</Text>

                    <TextInput
                        style={styles.editTaskInput}
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
                        <TouchableOpacity onPress={() => setIsEditingAddress(true)} style={styles.editTaskInput}>
                            <Text style={[styles.editTaskInputText, !address && styles.editTaskPlaceholderText]}>
                                {address || "Enter Address"}
                            </Text>
                        </TouchableOpacity>
                    )}

                    <Text style={styles.editTaskLabel}>Date</Text>
                    <TouchableOpacity onPress={() => setOpenDatePicker(true)} style={styles.editTaskInputButton}>
                        <Text style={styles.editTaskInputText}>{date.toDateString()}</Text>
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
                    <View style={styles.editTaskAllDayContainer}>
                        <TouchableOpacity onPress={() => setAllDayEvent(!allDayEvent)}
                                          style={styles.editTaskAllDayToggle}>
                            <Text style={styles.editTaskLabel}>All Day Event</Text>
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
                            <Text style={styles.editTaskLabel}>Start Time</Text>
                            <TouchableOpacity onPress={() => setOpenStartTimePicker(true)}
                                              style={styles.editTaskInputButton}>
                                <Text style={styles.editTaskInputText}>{formatTime(startTime)}</Text>
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

                            <Text style={styles.editTaskLabel}>End Time</Text>
                            <TouchableOpacity onPress={() => setOpenEndTimePicker(true)}
                                              style={styles.editTaskInputButton}>
                                <Text style={styles.editTaskInputText}>{formatTime(endTime)}</Text>
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

                    <Text style={styles.editTaskLabel}>Notes</Text>
                    <TextInput
                        style={styles.editTaskTextArea}
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Add notes"
                        multiline
                    />

                    <TouchableOpacity style={styles.editTaskSaveButton} onPress={handleUpdateEvent}>
                        <Text style={styles.editTaskSaveButtonText}>Update Event</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>

    );
};

const styles = StyleSheet.create({
    editTaskModalContainer: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    editTaskBottomSheet: {
        backgroundColor: theme.colors.white,
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    editTaskCloseButton: {
        alignSelf: "flex-end",
    },
    editTaskHeaderText: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 15,
        textAlign: "center",
    },
    editTaskInput: {
        borderWidth: 1,
        borderColor: theme.colors.gray,
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        fontSize: 16,
    },
    editTaskInputButton: {
        borderWidth: 1,
        borderColor: theme.colors.gray,
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        backgroundColor: theme.colors.gray,
        alignItems: "center",
    },
    editTaskInputText: {
        fontSize: 16,
    },
    editTaskTextArea: {
        borderWidth: 1,
        borderColor: theme.colors.gray,
        borderRadius: 10,
        padding: 12,
        height: 100,
        marginBottom: 10,
        fontSize: 16,
    },
    editTaskLabel: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 5,
    },
    editTaskSaveButton: {
        flexDirection: "row",
        marginTop: 12,
        backgroundColor: theme.colors.primary,
        paddingVertical: 14,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
    },
    editTaskSaveButtonText: {
        color: theme.colors.white,
        fontSize: 16,
        fontWeight: "bold",
    },
    editTaskAllDayToggle: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    editTaskAllDayContainer: {
        marginBottom: 10,
    },
    editTaskPlaceholderText: {
        color: theme.colors.gray,
    },
});


export default EditList;
