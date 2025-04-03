import React, {useEffect, useState} from "react";
import {Alert, Modal, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {theme} from "@/constants/theme";
import DatePicker from "react-native-date-picker";
import GooglePlacesAutocomplete from "@/components/GooglePlacesAutocomplete";
import AsyncStorage from '@react-native-async-storage/async-storage';
import PropTypes from "prop-types";

const CreateTask = ({isVisible, onClose, onTaskCreated}) => {
    const now = new Date();
    const [taskName, setTaskName] = useState("");
    const [notes, setNotes] = useState("");
    const [address, setAddress] = useState("");
    const [date, setDate] = useState(new Date());
    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(new Date(now.getTime() + 60 * 60 * 1000));
    const [allDayEvent, setAllDayEvent] = useState(false);

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

    const saveTaskToStorage = async (newTask) => {
        try {

            const existingTasksJson = await AsyncStorage.getItem('tasks');
            const existingTasks = existingTasksJson ? JSON.parse(existingTasksJson) : [];
            const taskWithId = {
                ...newTask,
                id: Date.now().toString(),
                createdAt: new Date().toISOString()
            };

            const updatedTasks = [...existingTasks, taskWithId];
            await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks));

            return taskWithId;
        } catch (error) {
            console.error('Error saving task:', error);
            throw error;
        }
    };

    const handleSaveEvent = async () => {
        if (!taskName.trim()) {
            Alert.alert('Error', 'Please enter a task name');
            return;
        }

        try {
            const newTask = {
                taskName,
                notes,
                address,
                date: date.toISOString(),
                startTime: allDayEvent ? null : startTime.toISOString(),
                endTime: allDayEvent ? null : endTime.toISOString(),
                allDayEvent
            };

            const savedTask = await saveTaskToStorage(newTask);


            resetForm();
            onClose();

            if (onTaskCreated) {
                onTaskCreated(savedTask);
            }

            Alert.alert('Success', 'Task created successfully!');
        } catch (error) {
            Alert.alert('Error', 'Failed to save task. Please try again.');
            console.error('Error in handleSaveEvent:', error);
        }
    };

    return (
        <Modal animationType="slide" transparent visible={isVisible} onRequestClose={onClose}>
            <View style={styles.createTaskModalContainer}>
                <View style={styles.createTaskBottomSheet}>
                    <TouchableOpacity onPress={onClose} style={styles.createTaskCloseButton}>
                        <Ionicons name="close-circle" size={32} color="#333"/>
                    </TouchableOpacity>
                    <Text style={styles.createTaskHeaderText}>Create New Task</Text>
                    <View>
                        <TextInput
                            style={styles.createTaskInput}
                            value={taskName}
                            onChangeText={setTaskName}
                            placeholder="Task Name"
                        />
                        <GooglePlacesAutocomplete address={address} onAddressSelect={setAddress}/>

                        <Text style={styles.createTaskLabel}>Date</Text>
                        <TouchableOpacity onPress={() => setOpenDatePicker(true)} style={styles.createTaskInputButton}>
                            <Text style={styles.createTaskInputText}>{date.toDateString()}</Text>
                        </TouchableOpacity>
                        <DatePicker
                            modal
                            open={openDatePicker}
                            date={date}
                            mode="date"
                            minimumDate={new Date()}
                            onConfirm={(selectedDate) => {
                                setOpenDatePicker(false);
                                setDate(selectedDate);
                            }}
                            onCancel={() => setOpenDatePicker(false)}
                        />

                        <View style={styles.createTaskAllDayContainer}>
                            <TouchableOpacity onPress={() => setAllDayEvent(!allDayEvent)}
                                              style={styles.createTaskAllDayToggle}>
                                <Text style={styles.createTaskLabel}>All Day Event</Text>
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
                                    }}
                                    thumbColor={allDayEvent ? theme.colors.white : theme.colors.darkGray}
                                />
                            </TouchableOpacity>
                        </View>

                        {!allDayEvent && (
                            <>
                                <Text style={styles.createTaskLabel}>Start Time</Text>
                                <TouchableOpacity onPress={() => setOpenStartTimePicker(true)}
                                                  style={styles.createTaskInputButton}>
                                    <Text style={styles.createTaskInputText}>{formatTime(startTime)}</Text>
                                </TouchableOpacity>
                                <DatePicker
                                    modal
                                    open={openStartTimePicker}
                                    date={startTime}
                                    mode="time"
                                    onConfirm={(selectedTime) => {
                                        setOpenStartTimePicker(false);
                                        setStartTime(selectedTime);
                                    }}
                                    onCancel={() => setOpenStartTimePicker(false)}
                                />

                                <Text style={styles.createTaskLabel}>End Time</Text>
                                <TouchableOpacity onPress={() => setOpenEndTimePicker(true)}
                                                  style={styles.createTaskInputButton}>
                                    <Text style={styles.createTaskInputText}>{formatTime(endTime)}</Text>
                                </TouchableOpacity>
                                <DatePicker
                                    modal
                                    open={openEndTimePicker}
                                    date={endTime}
                                    mode="time"
                                    minimumDate={startTime}
                                    onConfirm={(selectedTime) => {
                                        setOpenEndTimePicker(false);
                                        setEndTime(selectedTime);
                                    }}
                                    onCancel={() => setOpenEndTimePicker(false)}
                                />
                            </>
                        )}

                        <Text style={styles.createTaskLabel}>Notes</Text>
                        <TextInput
                            style={styles.createTaskTextArea}
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="Add notes"
                            multiline
                        />

                        <TouchableOpacity style={styles.createTaskSaveButton} onPress={handleSaveEvent}>
                            <Text style={styles.createTaskSaveButtonText}>Create Event</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>

    );
};

CreateTask.propTypes={
    isVisible:PropTypes.bool, onClose:PropTypes.func, onTaskCreated:PropTypes.func
}
const styles = StyleSheet.create({
    createTaskModalContainer: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    createTaskBottomSheet: {
        backgroundColor: theme.colors.white,
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    createTaskCloseButton: {
        alignSelf: "flex-end",
    },
    createTaskHeaderText: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 15,
        textAlign: "center",
    },
    createTaskInput: {
        borderWidth: 1,
        borderColor: theme.colors.gray,
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        fontSize: 16,
    },
    createTaskInputButton: {
        borderWidth: 1,
        borderColor: theme.colors.gray,
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        backgroundColor: theme.colors.gray,
        alignItems: "center",
    },
    createTaskInputText: {
        fontSize: 16,
    },
    createTaskTextArea: {
        borderWidth: 1,
        borderColor: theme.colors.gray,
        borderRadius: 10,
        padding: 12,
        height: 100,
        marginBottom: 10,
        fontSize: 16,
    },
    createTaskLabel: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 5,
    },
    createTaskSaveButton: {
        flexDirection: "row",
        marginTop: 12,
        backgroundColor: theme.colors.primary,
        paddingVertical: 14,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
    },
    createTaskSaveButtonText: {
        color: theme.colors.white,
        fontSize: 16,
        fontWeight: "bold",
        marginLeft: 8,
    },
    createTaskAllDayToggle: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    createTaskAllDayContainer: {
        marginBottom: 10,
    },
});


export default CreateTask;
