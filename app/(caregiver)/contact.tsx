import {LinearGradient} from "expo-linear-gradient";
import {Alert, Dimensions, Linking, ScrollView, Text, TextInput, TouchableOpacity, View} from "react-native";
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
    patient_name?: string; // Added to track which patient this contact belongs to
}

interface Patient {
    id: string;
    name: string;
    email: string;
}

export default function EmergencyContacts() {
    const { height } = Dimensions.get("window");
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch emergency contacts for all patients under this caregiver
    const fetchContacts = async () => {
        try {
            setLoading(true);

            // Get current caregiver user
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                Alert.alert("Error", "User not authenticated");
                return;
            }

            // Step 1: Get all patients assigned to this caregiver
            const { data: patientData, error: patientError } = await supabase
                .from("patient_caretaker")
                .select(`
                    patient_id,
                    profiles:patient_id(id, name, email)
                `)
                .eq("caretaker_id", user.id);

            if (patientError) {
                console.error("Error fetching patients:", patientError);
                Alert.alert("Error", patientError.message);
                return;
            }

            if (!patientData || patientData.length === 0) {
                console.log("No patients found for this caregiver");
                setLoading(false);
                return;
            }

            console.log("Patients found:", patientData);

            // Create a list of patients
            const patients: Patient[] = [];
            patientData.forEach(relation => {
                if (relation.profiles) {
                    const profile = Array.isArray(relation.profiles)
                        ? relation.profiles[0]
                        : relation.profiles;

                    patients.push({
                        id: relation.patient_id,
                        name: profile.name || "Unknown",
                        email: profile.email || "No email"
                    });
                }
            });

            // Step 2: Get all emergency contacts for all patients
            let allContacts: Contact[] = [];

            for (const patient of patients) {
                const { data: contactData, error: contactError } = await supabase
                    .from("contacts")
                    .select("*")
                    .eq("user", patient.id);

                if (contactError) {
                    console.error(`Error fetching contacts for patient ${patient.id}:`, contactError);
                    continue; // Continue with other patients even if one fails
                }

                if (contactData && contactData.length > 0) {
                    // Add patient name to each contact
                    const patientContacts = contactData.map(contact => ({
                        ...contact,
                        patient_name: patient.name
                    }));

                    allContacts = [...allContacts, ...patientContacts];
                }
            }

            console.log("All contacts:", allContacts);
            setContacts(allContacts);

        } catch (error) {
            console.error("Unexpected error:", error);
            Alert.alert("Error", "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    // Function to make a phone call
    const makePhoneCall = (phoneNumber: string, contactName: string) => {
        Linking.canOpenURL(`tel:${phoneNumber}`)
            .then(supported => {
                if (supported) {
                    Linking.openURL(`tel:${phoneNumber}`);
                } else {
                    Alert.alert("Error", "Phone calls are not supported on this device");
                }
            })
            .catch(err => {
                console.error("Error making phone call:", err);
                Alert.alert("Error", "Could not make phone call");
            });
    };

    // Filter contacts based on search query
    const filteredContacts = contacts.filter(contact =>
        contact.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (contact.contact_name && contact.contact_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (contact.patient_name && contact.patient_name.toLowerCase().includes(searchQuery.toLowerCase()))
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
                        <Text className={"text-white font-bold text-2xl"}>Patient Emergency Contacts</Text>
                    </View>
                    <View className="mx-3 mt-3">
                        <View className="bg-[#D9D9D9] py-3 rounded-xl px-3 flex-row items-center">
                            <Ionicons name="search-outline" size={20} color="#666" />
                            <TextInput
                                className="flex-1 ml-2"
                                placeholder="Search contacts or patients"
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
                            // Group contacts by patient
                            Object.entries(
                                filteredContacts.reduce((groups, contact) => {
                                    const patientName = contact.patient_name || "Unknown Patient";
                                    if (!groups[patientName]) {
                                        groups[patientName] = [];
                                    }
                                    groups[patientName].push(contact);
                                    return groups;
                                }, {} as Record<string, Contact[]>)
                            ).map(([patientName, patientContacts]) => (
                                <View key={patientName} className="mb-6">
                                    <Text className="text-white font-bold text-lg mb-2">
                                        {patientName}
                                    </Text>
                                    {patientContacts.map(contact => (
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
                                                    <TouchableOpacity
                                                        onPress={() => makePhoneCall(contact.number, contact.contact_name)}
                                                        activeOpacity={0.7}
                                                    >
                                                        <Text className="text-white text-sm opacity-80 underline">{contact.number}</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                            <TouchableOpacity
                                                onPress={() => makePhoneCall(contact.number, contact.contact_name)}
                                                className="bg-green-500/30 p-2 rounded-full"
                                            >
                                                <Ionicons name="call-outline" size={18} color="white" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            ))
                        ) : (
                            <View className="items-center py-10">
                                <Ionicons name="call-outline" size={60} color="white" opacity={0.7} />
                                <Text className="text-white text-center mt-4 opacity-80">
                                    No emergency contacts found.
                                </Text>
                                <Text className="text-white text-center opacity-80">
                                    Your patients haven't added any emergency contacts yet.
                                </Text>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
}