import {LinearGradient} from "expo-linear-gradient";
import {Dimensions, ScrollView, Text, TouchableOpacity, View, Modal, TextInput, ActivityIndicator, Alert} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {router} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import HomeCards from "@/app/components/HomeCards";
import {useState, useEffect} from "react";
import {supabase} from "@/utils/config";
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

interface User {
    id: string;
    name: string;
    email: string;
}

interface MedicalReminder {
    id: string;
    created_at: string;
    description: string;
    time: string;
    user: string;
    caregiver: string;
    profiles?: {
        name: string;
    };
}

export default function MedicalReminder() {
    const { height } = Dimensions.get("window");
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [description, setDescription] = useState<string>("");
    const [reminderTime, setReminderTime] = useState<Date>(new Date());
    const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
    const [patients, setPatients] = useState<User[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<string>("");
    const [reminders, setReminders] = useState<MedicalReminder[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const fetchReminders = async (): Promise<void> => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found");

            const { data, error } = await supabase
                .from("medical_reminders")
                .select(`
                    *,
                    profiles:user(name)
                `)
                .eq("caregiver", user.id);

            if (error) throw error;
            if (data) {
                setReminders(data as MedicalReminder[]);
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

    const handleAddReminder = async (): Promise<void> => {
        if (!description) {
            Alert.alert("Error", "Please enter a description");
            return;
        }

        if (!selectedPatient) {
            Alert.alert("Error", "Please select a patient");
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found");

            const caregiverId = user.id;

            const { error } = await supabase
                .from("medical_reminders")
                .insert([{
                    description: description,
                    time: reminderTime.toISOString(),
                    user: selectedPatient,
                    caregiver: caregiverId
                }]);

            if (error) throw error;

            // Reset form
            setDescription("");
            setReminderTime(new Date());
            setSelectedPatient("");
            setModalVisible(false);

            // Refresh reminders
            fetchReminders();
            Alert.alert("Success", "Medication reminder added successfully");
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const onTimeChange = (event: DateTimePickerEvent, selectedDate?: Date): void => {
        setShowTimePicker(false);
        if (selectedDate) {
            setReminderTime(selectedDate);
        }
    };

    useEffect(() => {
        fetchReminders();
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
            <SafeAreaView className="flex-1 relative bg-transparent">
                <ScrollView className="">
                    <View className={"px-4"}>
                        <TouchableOpacity onPress={() => router.back()} className="mt-2 mb-10">
                            <Ionicons color={"#FFFFFF"} size={23} name={"arrow-back"} />
                        </TouchableOpacity>
                        <HomeCards
                            onPress={() => {}}
                            title={"Medication Reminder"}
                            image={require("./../../assets/images/Lifesavers Electrocardiogram.png")}
                        />
                    </View>

                    <View className="flex-1 mt-10 rounded-2xl" style={{ minHeight: height * 0.7 }}>
                        <LinearGradient
                            colors={["#D7CFEC", "#FFAC54"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            locations={[0.19, 0.75]}
                            style={{ flex: 1 }}
                            className="flex-1  p-3 rounded-2xl">

                            {loading ? (
                                <View className="items-center justify-center py-10">
                                    <ActivityIndicator size="large" color="#432C81" />
                                </View>
                            ) : reminders.length === 0 ? (
                                <View className="bg-white rounded-2xl mx-2 p-5 items-center justify-center my-5">
                                    <Text className="text-xl font-bold text-[#432C81]">No Reminders</Text>
                                    <Text className="text-sm text-[#7B6BA8] text-center mt-2">
                                        Tap the + button to add medication reminders
                                    </Text>
                                </View>
                            ) : (
                                reminders.map(reminder => (
                                    <View key={reminder.id} className="bg-white mx-4 my-3 rounded-2xl">
                                        <View className="p-5 gap-2">
                                            <Text className="text-xl font-bold text-[#432C81]">
                                                {new Date(reminder.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </Text>
                                            <Text className="text-sm text-[#7B6BA8]">{reminder.description}</Text>
                                            <Text className="text-xs text-[#432C81] font-medium mt-1">
                                                For: {reminder.profiles?.name || "Unknown"}
                                            </Text>
                                        </View>
                                    </View>
                                ))
                            )}
                        </LinearGradient>
                    </View>
                </ScrollView>

                {/* Add Reminder Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View className="flex-1 justify-end bg-gray-200 bg-opacity-50">
                        <View className="bg-white rounded-t-3xl p-6 h-2/3">
                            <View className="flex-row justify-between items-center mb-6">
                                <Text className="text-xl font-bold text-gray-800">Add Medication Reminder</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <Ionicons name="close" size={24} color="#29374B" />
                                </TouchableOpacity>
                            </View>

                            {/* Reminder Description */}
                            <Text className="text-gray-700 font-medium mb-2">Description</Text>
                            <TextInput
                                className="bg-gray-100 rounded-lg p-4 mb-4"
                                placeholder="Enter medication name or instructions"
                                value={description}
                                onChangeText={setDescription}
                                multiline
                            />

                            {/* Time Picker */}
                            <Text className="text-gray-700 font-medium mb-2">Reminder Time</Text>
                            <TouchableOpacity
                                onPress={() => setShowTimePicker(true)}
                                className="bg-gray-100 rounded-lg p-4 mb-4"
                            >
                                <Text>{reminderTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                            </TouchableOpacity>
                            {showTimePicker && (
                                <DateTimePicker
                                    value={reminderTime}
                                    mode="time"
                                    is24Hour={false}
                                    onChange={onTimeChange}
                                />
                            )}

                            {/* Patient Selection */}
                            <Text className="text-gray-700 font-medium mb-2">Select Patient</Text>
                            <ScrollView
                                className="bg-gray-100 rounded-lg p-2 mb-4"
                                style={{ maxHeight: 200 }}
                            >
                                {patients.map(patient => (
                                    <TouchableOpacity
                                        key={patient.id}
                                        className={`flex-row items-center p-3 mb-1 rounded-lg ${
                                            selectedPatient === patient.id ? 'bg-blue-100' : 'bg-white'
                                        }`}
                                        onPress={() => setSelectedPatient(patient.id)}
                                    >
                                        <View className="h-10 w-10 rounded-full bg-gray-300 mr-3 items-center justify-center">
                                            <Text className="font-bold">{patient.name.charAt(0)}</Text>
                                        </View>
                                        <View className="flex-1">
                                            <Text className="font-semibold">{patient.name}</Text>
                                            <Text className="text-gray-500 text-sm">{patient.email}</Text>
                                        </View>
                                        <Ionicons
                                            name={selectedPatient === patient.id ? "checkmark-circle" : "ellipse-outline"}
                                            size={24}
                                            color={selectedPatient === patient.id ? "#4CAF50" : "#757575"}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {/* Add Button */}
                            <TouchableOpacity
                                className="bg-[#432C81] py-4 rounded-lg items-center"
                                onPress={handleAddReminder}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text className="text-white font-bold text-lg">Add Reminder</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Floating Action Button */}
                <TouchableOpacity
                    className="absolute bottom-8 right-6 bg-[#432C81] h-14 w-14 rounded-full flex items-center justify-center shadow-lg"
                    onPress={() => setModalVisible(true)}
                >
                    <Ionicons name="add" size={30} color="#FFF" />
                </TouchableOpacity>
            </SafeAreaView>
        </LinearGradient>
    );
}