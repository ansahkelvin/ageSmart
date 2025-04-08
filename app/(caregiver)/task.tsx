import {LinearGradient} from "expo-linear-gradient";
import {Dimensions, ScrollView, TouchableOpacity, Text, Alert, View, Modal, TextInput, ActivityIndicator} from "react-native";
import {router} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {SafeAreaView} from "react-native-safe-area-context";
import {useEffect, useState} from "react";
import {supabase} from "@/utils/config";
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

// Extend Task interface to include user profile info
interface Task {
    id: string;
    description: string;
    completed: boolean;
    user: string;
    start_time: string;
    end_time: string;
    profiles?: {
        id: string;
        name: string;
        email: string;
    };
}

interface User {
    id: string;
    name: string;
    email: string;
}

export default function CreateTask() {
    const { height } = Dimensions.get("window");
    const [tasks, setTasks] = useState<Task[]>([]);
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [taskDescription, setTaskDescription] = useState<string>("");
    const [startTime, setStartTime] = useState<Date>(new Date());
    const [endTime, setEndTime] = useState<Date>(new Date());
    const [showStartPicker, setShowStartPicker] = useState<boolean>(false);
    const [showEndPicker, setShowEndPicker] = useState<boolean>(false);
    const [patients, setPatients] = useState<User[]>([]);
    const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const fetchTasks = async (): Promise<void> => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found");

            // Modified query to include user information
            const { data, error } = await supabase
                .from("tasks")
                .select(`
                    *,
                    profiles:user(id, name, email)
                `)
                .eq("caregiver", user.id);

            if (error) throw error;
            if (data) {
                setTasks(data as Task[]);
            }
            setLoading(false);
        } catch (error: any) {
            Alert.alert("Error", error.message);
            setLoading(false);
        }
    };

    const fetchPatients = async (): Promise<void> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found");

            const caretakerId = user.id;

            const { data, error } = await supabase
                .from('patient_caretaker')
                .select(`
                    patient_id,
                    profiles!patient_id(id, name, email)
                `)
                .eq('caretaker_id', caretakerId);

            if (error) throw error;

            // Transform the data
            const formattedPatients: User[] = [];

            if (data && Array.isArray(data)) {
                data.forEach(item => {
                    if (item.profiles) {
                        formattedPatients.push({
                            id: (item.profiles as any).id,
                            name: (item.profiles as any).name,
                            email: (item.profiles as any).email
                        });
                    }
                });
            }

            setPatients(formattedPatients);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    };

    const togglePatientSelection = (patientId: string): void => {
        setSelectedPatients(prevSelected => {
            if (prevSelected.includes(patientId)) {
                return prevSelected.filter(id => id !== patientId);
            } else {
                return [...prevSelected, patientId];
            }
        });
    };

    const handleAddTask = async (): Promise<void> => {
        if (!taskDescription) {
            Alert.alert("Error", "Please enter a task description");
            return;
        }

        if (selectedPatients.length === 0) {
            Alert.alert("Error", "Please select at least one patient");
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found");

            const caregiverId = user.id;

            // Create tasks for all selected patients
            const tasksToInsert = selectedPatients.map(patientId => ({
                description: taskDescription,
                completed: false,
                user: patientId,
                caregiver: caregiverId,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString()
            }));

            const { error } = await supabase
                .from("tasks")
                .insert(tasksToInsert);

            if (error) throw error;

            // Reset form
            setTaskDescription("");
            setSelectedPatients([]);
            setStartTime(new Date());
            setEndTime(new Date());
            setModalVisible(false);

            // Refresh tasks
            fetchTasks();
            Alert.alert("Success", "Tasks added successfully");
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    // Properly typed event handlers for DateTimePicker
    const onStartTimeChange = (event: DateTimePickerEvent, selectedDate?: Date): void => {
        setShowStartPicker(false);
        if (selectedDate) {
            setStartTime(selectedDate);
        }
    };

    const onEndTimeChange = (event: DateTimePickerEvent, selectedDate?: Date): void => {
        setShowEndPicker(false);
        if (selectedDate) {
            setEndTime(selectedDate);
        }
    };

    const toggleTaskCompletion = async (task: Task): Promise<void> => {
        try {
            const { error } = await supabase
                .from("tasks")
                .update({ completed: !task.completed })
                .eq("id", task.id);

            if (error) throw error;

            fetchTasks();
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    };

    useEffect(() => {
        fetchTasks();
        fetchPatients();
    }, []);

    return (
        <LinearGradient
            colors={["#29374B", "#F9D6B1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            locations={[0.19, 0.75]}
            style={{ flex: 1, height: height }}
            className="flex-1">
            <SafeAreaView className="flex-1">
                <View className="px-6 flex-1">
                    <TouchableOpacity onPress={() => router.back()} className="mt-2">
                        <Ionicons color={"#FFFFFF"} size={23} name={"arrow-back"} />
                    </TouchableOpacity>
                    <Text className={"text-2xl mt-5 font-bold text-white"}>User Tasks</Text>

                    {loading ? (
                        <View className="flex-1 justify-center items-center">
                            <ActivityIndicator size="large" color="#FFFFFF" />
                        </View>
                    ) : tasks.length === 0 ? (
                        <View className="flex-1 justify-center items-center">
                            <Text className="text-white text-lg">No tasks yet</Text>
                            <Text className="text-white text-sm mt-2">Tap the + button to add tasks</Text>
                        </View>
                    ) : (
                        <ScrollView className="mt-6">
                            {tasks.map(task => (
                                <View key={task.id} className="bg-white p-4 rounded-lg mb-4 shadow-sm">
                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-lg font-semibold">{task.description}</Text>
                                        <TouchableOpacity
                                            onPress={() => toggleTaskCompletion(task)}
                                        >
                                            <Ionicons
                                                name={task.completed ? "checkmark-circle" : "ellipse-outline"}
                                                size={24}
                                                color={task.completed ? "#4CAF50" : "#757575"}
                                            />
                                        </TouchableOpacity>
                                    </View>

                                    <View className="mt-1">
                                        <Text className="text-blue-600 font-medium">
                                            Assigned to: {task.profiles?.name || "Unknown"}
                                        </Text>
                                    </View>

                                    <View className="flex-row mt-2">
                                        <Text className="text-gray-500 text-sm">
                                            {new Date(task.start_time).toLocaleTimeString()} - {new Date(task.end_time).toLocaleTimeString()}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    )}

                    {/* Add Task Modal */}
                    <Modal
                        className={"bg-white"}
                        animationType="slide"
                        transparent={true}
                        visible={modalVisible}
                        onRequestClose={() => setModalVisible(false)}
                    >
                        <View className="flex-1 justify-end bg-gray-200 bg-opacity-50">
                            <View className="bg-white rounded-t-3xl p-6 h-5/6">
                                <View className="flex-row justify-between items-center mb-6">
                                    <Text className="text-xl font-bold text-gray-800">Add Task</Text>
                                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                                        <Ionicons name="close" size={24} color="#29374B" />
                                    </TouchableOpacity>
                                </View>

                                {/* Task Description */}
                                <Text className="text-gray-700 font-medium mb-2">Task Description</Text>
                                <TextInput
                                    className="bg-gray-100 rounded-lg p-4 mb-4"
                                    placeholder="Enter task description"
                                    value={taskDescription}
                                    onChangeText={setTaskDescription}
                                    multiline
                                />

                                {/* Time Pickers */}
                                <View className="flex-row justify-between mb-4">
                                    <View className="flex-1 mr-2">
                                        <Text className="text-gray-700 font-medium mb-2">Start Time</Text>
                                        <TouchableOpacity
                                            onPress={() => setShowStartPicker(true)}
                                            className="bg-gray-100 rounded-lg p-4"
                                        >
                                            <Text>{startTime.toLocaleTimeString()}</Text>
                                        </TouchableOpacity>
                                        {showStartPicker && (
                                            <DateTimePicker
                                                value={startTime}
                                                mode="time"
                                                is24Hour={false}
                                                onChange={onStartTimeChange}
                                            />
                                        )}
                                    </View>
                                    <View className="flex-1 ml-2">
                                        <Text className="text-gray-700 font-medium mb-2">End Time</Text>
                                        <TouchableOpacity
                                            onPress={() => setShowEndPicker(true)}
                                            className="bg-gray-100 rounded-lg p-4"
                                        >
                                            <Text>{endTime.toLocaleTimeString()}</Text>
                                        </TouchableOpacity>
                                        {showEndPicker && (
                                            <DateTimePicker
                                                value={endTime}
                                                mode="time"
                                                is24Hour={false}
                                                onChange={onEndTimeChange}
                                            />
                                        )}
                                    </View>
                                </View>

                                {/* Patient Selection */}
                                <Text className="text-gray-700 font-medium mb-2">Select Patients</Text>
                                <Text className="text-gray-500 text-sm mb-2">
                                    {selectedPatients.length} patient(s) selected
                                </Text>
                                <ScrollView
                                    className="bg-gray-100 rounded-lg p-2 mb-4"
                                    style={{ maxHeight: 200 }}
                                >
                                    {patients.map(patient => (
                                        <TouchableOpacity
                                            key={patient.id}
                                            className={`flex-row items-center p-3 mb-1 rounded-lg ${
                                                selectedPatients.includes(patient.id) ? 'bg-blue-100' : 'bg-white'
                                            }`}
                                            onPress={() => togglePatientSelection(patient.id)}
                                        >
                                            <View className="h-10 w-10 rounded-full bg-gray-300 mr-3 items-center justify-center">
                                                <Text className="font-bold">{patient.name.charAt(0)}</Text>
                                            </View>
                                            <View className="flex-1">
                                                <Text className="font-semibold">{patient.name}</Text>
                                                <Text className="text-gray-500 text-sm">{patient.email}</Text>
                                            </View>
                                            <Ionicons
                                                name={selectedPatients.includes(patient.id) ? "checkmark-circle" : "ellipse-outline"}
                                                size={24}
                                                color={selectedPatients.includes(patient.id) ? "#4CAF50" : "#757575"}
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>

                                {/* Add Button */}
                                <TouchableOpacity
                                    className="bg-[#29374B] py-4 rounded-lg items-center"
                                    onPress={handleAddTask}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <Text className="text-white font-bold text-lg">Add Task</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>

                    {/* Floating Action Button */}
                    <TouchableOpacity
                        className="absolute bottom-8 right-6 bg-[#29374B] h-14 w-14 rounded-full flex items-center justify-center shadow-lg"
                        onPress={() => setModalVisible(true)}
                    >
                        <Ionicons name="add" size={30} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
}