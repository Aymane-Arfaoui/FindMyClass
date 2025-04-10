import React, {useContext, useEffect, useMemo, useState} from "react";
import {Alert, Modal, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import DatePicker from "react-native-date-picker";
import GooglePlacesAutocomplete from "@/components/GooglePlacesAutocomplete";
import AsyncStorage from '@react-native-async-storage/async-storage';
import PropTypes from "prop-types";
import {ThemeContext} from "@/context/ThemeProvider";


const CreateTask = ({isVisible, onClose, onTaskCreated}) => {
    const { theme } = useContext(ThemeContext);
    const styles = useMemo(() => createStyles(theme), [theme]);
    const now = new Date();
    const [taskName, setTaskName] = useState("");
    const [notes, setNotes] = useState("");
    const [address, setAddress] = useState("");
    const [date, setDate] = useState(new Date());
    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(new Date(now.getTime() + 60 * 60 * 1000));
    const [allDayEvent, setAllDayEvent] = useState(false);
    const [useManualAddress, setUseManualAddress] = useState(false);

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

    const formatRoomNumber = (input) => {
        // Match patterns like H-196, H 196, H196
        const roomPattern = /^h-?\s*(\d?)(\d{3})$/i;
        const match = input.trim().match(roomPattern);
        
        if (match) {
            const [, floor = '1', room] = match; // Default to floor 1 if not specified
            return `H${floor}-${room}`; // Return in human-readable format (H1-196)
        }
        return input; // Return original input if it doesn't match room pattern
    };

    const handleManualAddressChange = (text) => {
        const formattedAddress = formatRoomNumber(text);
        setAddress(formattedAddress);
    };

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
                    <TouchableOpacity testID={'close-button'} onPress={onClose} style={styles.createTaskCloseButton}>
                        <Ionicons name="close-circle" size={32} color={theme.colors.text}/>
                    </TouchableOpacity>
                    <Text style={styles.createTaskHeaderText}>Create New Task</Text>
                    <View>
                        <TextInput
                            placeholderTextColor={theme.colors.inputPlaceholder}
                            style={styles.createTaskInput}
                            value={taskName}
                            onChangeText={setTaskName}
                            placeholder="Task Name"
                        />

                        <View style={styles.addressToggleContainer}>
                            <Text style={styles.createTaskLabel}>Address Input Method:</Text>
                            <View style={styles.toggleContainer}>
                                <TouchableOpacity 
                                    style={[styles.toggleButton, !useManualAddress && styles.toggleButtonActive]}
                                    onPress={() => setUseManualAddress(false)}
                                >
                                    <Text style={[styles.toggleText, !useManualAddress && styles.toggleTextActive]}>
                                        Auto-suggest
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.toggleButton, useManualAddress && styles.toggleButtonActive]}
                                    onPress={() => setUseManualAddress(true)}
                                >
                                    <Text style={[styles.toggleText, useManualAddress && styles.toggleTextActive]}>
                                        Manual Entry
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {useManualAddress ? (
                            <TextInput
                                placeholderTextColor={theme.colors.inputPlaceholder}
                                style={styles.createTaskInput}
                                value={address}
                                onChangeText={handleManualAddressChange}
                                placeholder="Enter Room (e.g., H-196, H8-862)"
                            />
                        ) : (
                            <GooglePlacesAutocomplete address={address} onAddressSelect={setAddress}/>
                        )}

                        <Text style={styles.createTaskLabel}>Date</Text>
                        <TouchableOpacity testID={'date-picker-toggle'} onPress={() => setOpenDatePicker(true)} style={styles.createTaskInputButton}>
                            <Text style={styles.createTaskInputText}>{date.toDateString()}</Text>
                        </TouchableOpacity>
                        <DatePicker
                            modal
                            open={openDatePicker}
                            date={date}
                            mode="date"
                            theme={theme.mode === "dark" ? "dark" : "light"}
                            minimumDate={new Date()}
                            onConfirm={(selectedDate) => {
                                setOpenDatePicker(false);
                                setDate(selectedDate);
                            }}
                            onCancel={() => setOpenDatePicker(false)}
                            testID={'date-picker-modal'}
                        />

                        <View style={styles.createTaskAllDayContainer}>
                            <TouchableOpacity onPress={() => setAllDayEvent(!allDayEvent)}
                                              style={styles.createTaskAllDayToggle}>
                                <Text style={styles.createTaskLabel}>All Day Event</Text>
                                <Switch
                                    testID={'all-day-switch'}
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
                                        false: '#fff',
                                        true: theme.colors.primary
                                    }}
                                    thumbColor={allDayEvent ? '#fff' : theme.colors.darkgray}
                                />
                            </TouchableOpacity>
                        </View>

                        {!allDayEvent && (
                            <>
                                <Text style={styles.createTaskLabel}>Start Time</Text>
                                <TouchableOpacity  testID={'start-time-picker-toggle'} onPress={() => setOpenStartTimePicker(true)}
                                                  style={styles.createTaskInputButton}>
                                    <Text style={styles.createTaskInputText}>{formatTime(startTime)}</Text>
                                </TouchableOpacity>
                                <DatePicker
                                    modal
                                    testID={'start-time-picker'}
                                    open={openStartTimePicker}
                                    date={startTime}
                                    mode="time"
                                    theme={theme.mode === "dark" ? "dark" : "light"}
                                    onConfirm={(selectedTime) => {
                                        setOpenStartTimePicker(false);
                                        setStartTime(selectedTime);
                                    }}
                                    onCancel={() => setOpenStartTimePicker(false)}
                                />

                                <Text style={styles.createTaskLabel}>End Time</Text>
                                <TouchableOpacity  testID={'end-time-picker-toggle'} onPress={() => setOpenEndTimePicker(true)}
                                                  style={styles.createTaskInputButton}>
                                    <Text style={styles.createTaskInputText}>{formatTime(endTime)}</Text>
                                </TouchableOpacity>
                                <DatePicker
                                    testID={'end-time-picker'}
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
                            placeholderTextColor={theme.colors.inputPlaceholder}
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

const createStyles = (theme) => StyleSheet.create({

    createTaskModalContainer: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    createTaskBottomSheet: {
        backgroundColor: theme.colors.cardBackground,
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
        color: theme.colors.text,
    },
    createTaskInput: {
        backgroundColor: theme.colors.inputBackground,
        borderWidth: 1,
        borderColor: theme.colors.gray,
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        fontSize: 16,
        color: theme.colors.text,
        placeholderTextColor: theme.colors.inputPlaceholder
    },
    createTaskInputButton: {
        backgroundColor: theme.colors.inputBackground,
        borderWidth: 1,
        borderColor: theme.colors.gray,
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        alignItems: "center",
    },
    createTaskInputText: {
        fontSize: 16,
        color: theme.colors.text,
    },
    createTaskTextArea: {
        backgroundColor: theme.colors.inputBackground,
        borderWidth: 1,
        borderColor: theme.colors.gray,
        borderRadius: 10,
        padding: 12,
        height: 100,
        marginBottom: 10,
        fontSize: 16,
        color: theme.colors.text,
    },
    createTaskLabel: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 5,
        color: theme.colors.text,
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
        color: '#fff',
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
    addressToggleContainer: {
        marginBottom: 10,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: theme.colors.inputBackground,
        borderRadius: 10,
        padding: 2,
        marginTop: 5,
    },
    toggleButton: {
        flex: 1,
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    toggleButtonActive: {
        backgroundColor: theme.colors.primary,
    },
    toggleText: {
        color: theme.colors.text,
        fontSize: 14,
    },
    toggleTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
});



export default CreateTask;
