import {LinearGradient} from "expo-linear-gradient";
import {Alert, Dimensions, Modal, ScrollView, Text, TextInput, TouchableOpacity, View} from "react-native";
import {router} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {SafeAreaView} from "react-native-safe-area-context";
import {useEffect, useState} from "react";
import {supabase} from "@/utils/config";

interface Contact {
    id: number;
    number: string;
    created_at: string;
    user: string;
    contact_name: string;
}

export default function EmergencyContacts() {
    const { height } = Dimensions.get("window");
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [newContactNumber, setNewContactNumber] = useState("");

    // Fetch emergency contacts
    const fetchContacts = async () => {
        try {
            setLoading(true);

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                Alert.alert("Error", "User not authenticated");
                return;
            }

            // Get contacts for this user
            const { data, error } = await supabase
                .from("contacts") // Make sure this matches your table name
                .select("*")
                .eq("user", user.id)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching contacts:", error);
                Alert.alert("Error", error.message);
                return;
            }

            if (data) {
                setContacts(data as Contact[]);
            }
        } catch (error) {
            console.error("Unexpected error:", error);
            Alert.alert("Error", "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const [newContactName, setNewContactName] = useState("");

    // Add a new contact
    const addContact = async () => {
        if (!newContactNumber.trim()) {
            Alert.alert("Error", "Please enter a contact number");
            return;
        }

        if (!newContactName.trim()) {
            Alert.alert("Error", "Please enter a contact name");
            return;
        }

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                Alert.alert("Error", "User not authenticated");
                return;
            }

            // Insert the new contact
            const { data, error } = await supabase
                .from("contacts")
                .insert([
                    {
                        number: newContactNumber,
                        contact_name: newContactName,
                        user: user.id
                    }
                ])
                .select();

            if (error) {
                console.error("Error adding contact:", error);
                Alert.alert("Error", error.message);
                return;
            }

            if (data) {
                setContacts([...contacts, data[0] as Contact]);
                setNewContactNumber("");
                setNewContactName("");
                setShowAddModal(false);
                Alert.alert("Success", "Contact added successfully");
            }
        } catch (error) {
            console.error("Unexpected error:", error);
            Alert.alert("Error", "An unexpected error occurred");
        }
    };

    // Remove a contact
    const removeContact = async (id: number) => {
        try {
            // Confirm with user
            Alert.alert(
                "Remove Contact",
                "Are you sure you want to remove this emergency contact?",
                [
                    {
                        text: "Cancel",
                        style: "cancel"
                    },
                    {
                        text: "Remove",
                        style: "destructive",
                        onPress: async () => {
                            // Delete the contact
                            const { error } = await supabase
                                .from("emergency_contacts")
                                .delete()
                                .eq("id", id);

                            if (error) {
                                console.error("Error removing contact:", error);
                                Alert.alert("Error", error.message);
                                return;
                            }

                            // Update state
                            setContacts(contacts.filter(contact => contact.id !== id));
                            Alert.alert("Success", "Contact removed successfully");
                        }
                    }
                ]
            );
        } catch (error) {
            console.error("Unexpected error:", error);
            Alert.alert("Error", "An unexpected error occurred");
        }
    };

    // Filter contacts based on search query
    const filteredContacts = contacts.filter(contact =>
        contact.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (contact.contact_name && contact.contact_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    useEffect(() => {
        fetchContacts();
    }, []);

    return (
        <LinearGradient
            colors={["#29374B", "#F9D6B1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            locations={[0.19, 0.75]}
            style={{ flex: 1, height: height }}
            className="flex-1 rounded-2xl">
            <SafeAreaView className="flex-1 relative">
                <ScrollView>
                    <View className="px-3 flex gap-10">
                        <TouchableOpacity onPress={() => router.back()}>
                            <Ionicons color={"#FFFFFF"} size={23} name={"arrow-back"} />
                        </TouchableOpacity>
                        <Text className={"text-white font-bold text-2xl"}>Emergency Contact</Text>
                    </View>
                    <View className="mx-3 mt-3">
                        <View className="bg-[#D9D9D9] py-3 rounded-xl px-3 flex-row items-center">
                            <Ionicons name="search-outline" size={20} color="#666" />
                            <TextInput
                                className="flex-1 ml-2"
                                placeholder="Search"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                    </View>

                    <View className="mt-6 mx-3">
                        {loading ? (
                            <View className="items-center py-10">
                                <Text className="text-white">Loading contacts...</Text>
                            </View>
                        ) : filteredContacts.length > 0 ? (
                            filteredContacts.map(contact => (
                                <View
                                    key={contact.id}
                                    className="bg-white/20 backdrop-blur-lg rounded-xl p-4 mb-3 flex-row justify-between items-center"
                                >
                                    <View className="flex-row items-center">
                                        <View className="h-10 w-10 bg-white/30 rounded-full items-center justify-center mr-3">
                                            <Ionicons name="call" size={20} color="white" />
                                        </View>
                                        <View>
                                            <Text className="text-white text-lg font-semibold">{contact.contact_name}</Text>
                                            <Text className="text-white text-sm opacity-80">{contact.number}</Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => removeContact(contact.id)}
                                        className="bg-red-500/30 p-2 rounded-full"
                                    >
                                        <Ionicons name="trash-outline" size={18} color="white" />
                                    </TouchableOpacity>
                                </View>
                            ))
                        ) : (
                            <View className="items-center py-10">
                                <Ionicons name="call-outline" size={60} color="white" opacity={0.7} />
                                <Text className="text-white text-center mt-4 opacity-80">
                                    No emergency contacts found.
                                </Text>
                                <Text className="text-white text-center opacity-80">
                                    Add contacts that can be reached in case of emergency.
                                </Text>
                            </View>
                        )}
                    </View>
                </ScrollView>

                <TouchableOpacity
                    className="absolute bottom-5 right-5 bg-[#432C81] w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                    onPress={() => setShowAddModal(true)}
                >
                    <Ionicons name="add" size={30} color="#FFF" />
                </TouchableOpacity>

                {/* Add Contact Modal */}
                <Modal
                    visible={showAddModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowAddModal(false)}
                >
                    <View className="flex-1 justify-end bg-black/50">
                        <View className="bg-white rounded-t-3xl p-5">
                            <View className="flex-row justify-between items-center mb-4">
                                <Text className="text-lg font-bold">Add Emergency Contact</Text>
                                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                    <Ionicons name="close" size={24} color="#000" />
                                </TouchableOpacity>
                            </View>

                            <Text className="mb-2">Contact Name</Text>
                            <TextInput
                                className="border border-gray-300 rounded-lg p-3 mb-4"
                                placeholder="Enter contact name"
                                value={newContactName}
                                onChangeText={setNewContactName}
                            />

                            <Text className="mb-2">Phone Number</Text>
                            <TextInput
                                className="border border-gray-300 rounded-lg p-3 mb-4"
                                placeholder="Enter phone number"
                                keyboardType="phone-pad"
                                value={newContactNumber}
                                onChangeText={setNewContactNumber}
                            />

                            <TouchableOpacity
                                className="bg-[#432C81] py-3 rounded-lg items-center"
                                onPress={addContact}
                            >
                                <Text className="text-white font-semibold">Add Contact</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </LinearGradient>
    );
}