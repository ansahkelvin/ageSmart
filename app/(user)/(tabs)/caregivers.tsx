import {Dimensions, ScrollView, View, Text, TouchableOpacity, Alert} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {SafeAreaView} from "react-native-safe-area-context";
import {Ionicons} from "@expo/vector-icons";
import {useRouter} from "expo-router";
import {useEffect, useState} from "react";
import {supabase} from "@/utils/config";

// First, let's define a more flexible interface to handle any structure
interface Caregiver {
    caretaker_id: string;
    // Make profiles more flexible to accommodate different return structures
    profiles: any;
}

export default function Caregivers() {
    const { height } = Dimensions.get("window");
    const router = useRouter();
    const [caregivers, setCaregiver] = useState<Caregiver[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCaregivers = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setError("User not authenticated");
                return;
            }

            const { data, error: supabaseError } = await supabase
                .from("patient_caretaker")
                .select(`
                    caretaker_id,
                    profiles:caretaker_id(id, name, email)
                `)
                .eq("patient_id", user.id);

            if (supabaseError) {
                setError(supabaseError.message);
                return;
            }
            
            if (data && data.length > 0) {
                setCaregiver(data);
                setError(null);
            } else {
                console.log("No caregivers found");
                setCaregiver([]);
            }
        } catch (err) {
            console.error("Unexpected error:", err);
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCaregivers();
    }, []);

    // Helper function to safely extract caregiver name and email
    const getProfileInfo = (caregiver: Caregiver) => {

        // Try different possible structures
        if (Array.isArray(caregiver.profiles) && caregiver.profiles.length > 0) {
            return {
                name: caregiver.profiles[0]?.name || "Unknown",
                email: caregiver.profiles[0]?.email || "No email"
            };
        } else if (typeof caregiver.profiles === 'object' && caregiver.profiles !== null) {
            return {
                name: caregiver.profiles.name || "Unknown",
                email: caregiver.profiles.email || "No email"
            };
        } else {
            return {
                name: "Unknown",
                email: "No email"
            };
        }
    };

    return (
        <LinearGradient
            colors={["#29374B", "#F9D6B1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            locations={[0.19, 0.75]}
            style={{ flex: 1, height: height }}
            className="flex-1 rounded-2xl">
            <SafeAreaView className="flex-1 relative px-6">
                <TouchableOpacity onPress={() => router.back()} className="mt-2">
                    <Ionicons color={"#FFFFFF"} size={23} name={"arrow-back"} />
                </TouchableOpacity>

                <Text className="text-2xl text-white font-bold mt-6 mb-4">Caregivers</Text>

                {loading && (
                    <View className="items-center justify-center py-10">
                        <Text className="text-white">Loading caregivers...</Text>
                    </View>
                )}

                {error && (
                    <View className="bg-red-500/20 p-4 rounded-xl mb-4">
                        <Text className="text-white">{error}</Text>
                        <TouchableOpacity
                            className="bg-white/30 rounded-lg py-2 px-4 mt-2 self-end"
                            onPress={fetchCaregivers}
                        >
                            <Text className="text-white">Retry</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <ScrollView className="mt-2">
                    {!loading && !error && caregivers && caregivers.length > 0 ? (
                        caregivers.map((caregiver) => {
                            const { name, email } = getProfileInfo(caregiver);

                            return (
                                <View
                                    key={caregiver.caretaker_id}
                                    className="bg-white/20 rounded-xl p-4 mb-4 backdrop-blur-lg"
                                >
                                    <View className="flex-row items-center mb-2">
                                        <View className="h-12 w-12 bg-white/30 rounded-full mr-3 items-center justify-center">
                                            <Ionicons name="person" size={24} color="white" />
                                        </View>
                                        <View>
                                            <Text className="text-white font-semibold text-lg">
                                                {name}
                                            </Text>
                                            <Text className="text-white/80">
                                                {email}
                                            </Text>
                                        </View>
                                    </View>

                                    
                                </View>
                            );
                        })
                    ) : !loading && !error ? (
                        <View className="items-center justify-center py-10">
                            <Ionicons name="people-outline" size={60} color="white" opacity={0.7} />
                            <Text className="text-white text-center mt-4 opacity-80">
                                No caregivers found. Add caregivers to help manage your care.
                            </Text>
                            <TouchableOpacity
                                className="mt-4 bg-white/30 px-6 py-3 rounded-xl"
                            >
                                <Text className="text-white font-semibold">Add Caregiver</Text>
                            </TouchableOpacity>
                        </View>
                    ) : null}
                </ScrollView>

              
            </SafeAreaView>
        </LinearGradient>
    );
}