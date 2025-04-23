import { useState, useEffect } from "react";
import { View, Text, Dimensions, TextInput, TouchableOpacity, Modal, FlatList, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/utils/config";
import {router} from "expo-router";

// Define types for the data
interface Profile {
    id: string;
    name: string;
    email: string;
    role?: string;
}

// Let's avoid trying to strongly type the Supabase response directly
// and just handle the transformation more carefully

export default function Stats() {
    const { height } = Dimensions.get("window");
    const [modalVisible, setModalVisible] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [searchResults, setSearchResults] = useState<Profile[]>([]);
    const [patients, setPatients] = useState<Profile[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [searchLoading, setSearchLoading] = useState<boolean>(false);
    const [filterText, setFilterText] = useState<string>("");

    // Fetch patients from patient_caretaker table
    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async (): Promise<void> => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const caretakerId = user?.id;

            if (!caretakerId) {
                console.error("No caretaker ID found");
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('patient_caretaker')
                .select(`
                    patient_id,
                    profiles!patient_id(id, name, email)
                  `)
                .eq('caretaker_id', caretakerId);

            if (error) throw error;

            // Transform the data to make it easier to work with
            const formattedPatients: Profile[] = [];

            if (data && Array.isArray(data)) {
                data.forEach(item => {
                    if (item.profiles) {
                        // Handle Supabase's foreign key return format
                        // Using type assertion since we know the structure
                        formattedPatients.push({
                            id: (item.profiles as any).id,
                            name: (item.profiles as any).name,
                            email: (item.profiles as any).email
                        });
                    }
                });
            }

            setPatients(formattedPatients);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching patients:", error);
            setLoading(false);
        }
    };
    const searchUsers = async (query: string): Promise<void> => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setSearchLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const caretakerId = user?.id;

            if (!caretakerId) {
                console.error("No caretaker ID found");
                setSearchLoading(false);
                return;
            }

            // Get users matching the search query
            const { data, error } = await supabase
                .from('profiles')
                .select('id, name, email')
                .eq('role', 'user')
                .ilike('name', `%${query}%`)
                .neq('id', caretakerId)
                .limit(10);

            if (error) throw error;

            // Get existing patient IDs
            const { data: existingData, error: existingError } = await supabase
                .from('patient_caretaker')
                .select('patient_id')
                .eq('caretaker_id', caretakerId);

            if (existingError) throw existingError;

            const existingPatientIds = existingData.map(p => p.patient_id);
            const filteredResults = data.filter(user => !existingPatientIds.includes(user.id));

            setSearchResults(filteredResults);
            setSearchLoading(false);
        } catch (error) {
            console.error("Error searching users:", error);
            setSearchLoading(false);
        }
    };

    const addPatient = async (user: Profile): Promise<void> => {
        try {
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            const caretakerId = currentUser?.id;

            if (!caretakerId) {
                console.error("No caretaker ID found");
                return;
            }

            // Insert into patient_caretaker table
            const { error } = await supabase
                .from('patient_caretaker')
                .insert([
                    {
                        patient_id: user.id,
                        caretaker_id: caretakerId,
                    }
                ]);

            if (error) throw error;

            setModalVisible(false);
            fetchPatients();
        } catch (error) {
            console.error("Error adding patient:", error);
        }
    };

    // Filter patients based on search text
    const filteredPatients = filterText
        ? patients.filter(p =>
            p.name.toLowerCase().includes(filterText.toLowerCase()) ||
            p.email.toLowerCase().includes(filterText.toLowerCase())
        )
        : patients;

    return (
        <LinearGradient
            colors={["#435C6D", "#F9D6B1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            locations={[0.19, 0.75]}
            style={{ flex: 1, height: height }}
            className="flex-1">
            <SafeAreaView className="px-6 relative flex-1">
                <TouchableOpacity onPress={() => router.back()} className="mt-2">
                    <Ionicons color={"#FFFFFF"} size={23} name={"arrow-back"} />
                </TouchableOpacity>
                <Text className="text-2xl font-bold text-white">Patients</Text>
                <View className="flex items-center flex-row gap-x-2 bg-white py-6 px-4 rounded-lg mt-8">
                    <Ionicons name="search" size={24} color="#435C6D" />
                    <TextInput
                        placeholder={"Search current patients"}
                        className="flex-1"
                        value={filterText}
                        onChangeText={setFilterText}
                    />
                </View>

                {loading ? (
                    <View className="flex-1 justify-center items-center">
                        <ActivityIndicator size="large" color="#FFFFFF" />
                    </View>
                ) : patients.length === 0 ? (
                    <View className="flex-1 justify-center items-center">
                        <Text className="text-white text-lg">No patients yet</Text>
                        <Text className="text-white text-sm mt-2">Tap the + button to add patients</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredPatients}
                        keyExtractor={(item) => item.id}
                        className="mt-6"
                        renderItem={({ item }) => (
                            <View className="flex flex-row items-center p-4 bg-white rounded-lg shadow-md mb-4">
                                <View className="h-16 w-16 rounded-full bg-gray-200 overflow-hidden mr-4 flex items-center justify-center">
                                    <Text className="text-2xl font-bold text-gray-400">
                                        {item.name.charAt(0)}
                                    </Text>
                                </View>
                                <View className="flex-1">
                                    <Text className="text-lg font-semibold text-gray-800">{item.name}</Text>
                                    <Text className="text-sm text-gray-500">{item.email}</Text>
                                </View>
                            </View>
                        )}
                    />
                )}

                {/* Add Patient Modal */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View className="flex-1 justify-end bg-gray-200 bg-opacity-50">
                        <View className="bg-white rounded-t-3xl p-6 h-2/3">
                            <View className="flex-row justify-between items-center mb-6">
                                <Text className="text-xl font-bold text-gray-800">Add Patient</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <Ionicons name="close" size={24} color="#435C6D" />
                                </TouchableOpacity>
                            </View>

                            <View className="flex-row items-center bg-gray-100 rounded-lg px-4 py-3 mb-6">
                                <Ionicons name="search" size={20} color="#435C6D" />
                                <TextInput
                                    className="flex-1 ml-2"
                                    placeholder="Search for user by name"
                                    value={searchQuery}
                                    onChangeText={(text) => {
                                        setSearchQuery(text);
                                        searchUsers(text);
                                    }}
                                />
                            </View>

                            {searchLoading ? (
                                <ActivityIndicator size="large" color="#435C6D" />
                            ) : (
                                <FlatList
                                    data={searchResults}
                                    keyExtractor={(item) => item.id}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            className="flex-row items-center p-4 border-b border-gray-200"
                                            onPress={() => addPatient(item)}
                                        >
                                            <View className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden mr-4 flex items-center justify-center">
                                                <Text className="text-lg font-bold text-gray-400">
                                                    {item.name.charAt(0)}
                                                </Text>
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-lg font-semibold">{item.name}</Text>
                                                <Text className="text-sm text-gray-500">{item.email}</Text>
                                            </View>
                                            <Ionicons name="add-circle" size={24} color="#435C6D" />
                                        </TouchableOpacity>
                                    )}
                                    ListEmptyComponent={
                                        searchQuery.length > 0 ? (
                                            <Text className="text-center py-4 text-gray-500">No users found</Text>
                                        ) : (
                                            <Text className="text-center py-4 text-gray-500">Type to search for users</Text>
                                        )
                                    }
                                />
                            )}
                        </View>
                    </View>
                </Modal>

                {/* Floating Action Button */}
                <TouchableOpacity
                    className="absolute bottom-8 right-6 bg-[#435C6D] h-14 w-14 rounded-full flex items-center justify-center shadow-lg"
                    onPress={() => setModalVisible(true)}
                >
                    <Ionicons name="add" size={30} color="#FFF" />
                </TouchableOpacity>
            </SafeAreaView>
        </LinearGradient>
    );
}