import React, {useEffect, useState} from "react";
import {Modal, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View, Alert} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {theme} from "@/constants/theme";
import DatePicker from "react-native-date-picker";
import GooglePlacesAutocomplete from "@/components/GooglePlacesAutocomplete";
import AsyncStorage from '@react-native-async-storage/async-storage';

const EditTasks = ({isVisible, onClose, taskData, onUpdate}) => {
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
            setAllDayEvent(taskData.allDayEvent || false);

            if (taskData.allDayEvent) {
                setStartTime(null);
                setEndTime(null);
            } else {
                setStartTime(taskData.startTime ? new Date(taskData.startTime) : new Date());
                setEndTime(taskData.endTime ? new Date(taskData.endTime) : new Date());
            }
        }
    }, [taskData]);

    const formatTime = (time) => time ? time.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"}) : "N/A";

    const handleUpdateTask = async () => {
        if (!taskName.trim()) {
            Alert.alert('Error', 'Please enter a task name');
            return;
        }

        try {
            // Get all tasks
            const tasksJson = await AsyncStorage.getItem('tasks');
            let tasks = tasksJson ? JSON.parse(tasksJson) : [];

            // Find and update the task
            const updatedTasks = tasks.map(task => {
                if (task.id === taskData.id) {
                    return {
                        ...task,
                        taskName,
                        notes,
                        address,
                        date: date.toISOString(),
                        startTime: allDayEvent ? 'All Day' : startTime.toISOString(),
                        endTime: allDayEvent ? 'All Day' : endTime.toISOString(),
                        allDayEvent,
                        updatedAt: new Date().toISOString()
                    };
                }
                return task;
            });

            // Save back to storage
            await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks));
            
            onClose();
            if (onUpdate) {
                onUpdate();
            }
            Alert.alert('Success', 'Task updated successfully!');
        } catch (error) {
            console.error('Error updating task:', error);
            Alert.alert('Error', 'Failed to update task. Please try again.');
        }
    };

    const handleDeleteTask = async () => {
        Alert.alert(
            'Delete Task',
            'Are you sure you want to delete this task?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Get all tasks
                            const tasksJson = await AsyncStorage.getItem('tasks');
                            let tasks = tasksJson ? JSON.parse(tasksJson) : [];

                            // Filter out the task to delete
                            const updatedTasks = tasks.filter(task => task.id !== taskData.id);

                            // Save back to storage
                            await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks));
                            
                            onClose();
                            if (onUpdate) {
                                onUpdate();
                            }
                            Alert.alert('Success', 'Task deleted successfully!');
                        } catch (error) {
                            console.error('Error deleting task:', error);
                            Alert.alert('Error', 'Failed to delete task. Please try again.');
                        }
                    },
                },
            ],
            {cancelable: true},
        );
    };

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

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteTask}>
                            <Ionicons name="trash-outline" size={24} color={theme.colors.white} />
                            <Text style={styles.deleteButtonText}>Delete Task</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.editTaskSaveButton} onPress={handleUpdateTask}>
                            <Ionicons name="save-outline" size={24} color={theme.colors.white} />
                            <Text style={styles.editTaskSaveButtonText}>Update Task</Text>
                        </TouchableOpacity>
                    </View>
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
        flexDirection: 'row',
        backgroundColor: theme.colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        marginLeft: 10,
    },
    editTaskSaveButtonText: {
        color: theme.colors.white,
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
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
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    deleteButton: {
        flexDirection: 'row',
        backgroundColor: theme.colors.error,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        marginRight: 10,
    },
    deleteButtonText: {
        color: theme.colors.white,
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
});

export default EditTasks;
