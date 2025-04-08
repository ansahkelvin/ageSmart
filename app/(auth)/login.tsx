import { Dimensions, Text, TextInput, TouchableOpacity, View, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {supabase} from "@/utils/config";

export default function LoginPage() {
    const router = useRouter();
    const height = Dimensions.get("window").height;
    const { role } = useLocalSearchParams();
    // console.log(role);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            // Step 1: Sign in the user
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            // Step 2: Check if the user has the correct role
            if (data.user) {
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();

                if (profileError) throw profileError;

                // If role is specified, verify the user has that role
                if (role && profileData.role !== role) {
                    await supabase.auth.signOut();
                    throw new Error(`You're not registered as a ${role}. Please use the correct login option.`);
                }

                // Navigate to the appropriate dashboard
                if (profileData.role === 'caregiver') {
                    router.replace('/(caregiver)/(tabs)');
                } else {
                    router.replace('/(user)/(tabs)');
                }
            }
        } catch (error) {
            if(error instanceof Error) {
                Alert.alert('Error', error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
        >
            <LinearGradient
                colors={["#435C6D", "#F9D6B1"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                locations={[0.19, 0.75]}
                style={{ flex: 1, height: height }}
                className="flex-1"
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                    className="flex-1"
                >
                    <View className="flex-1 flex flex-col items-center justify-around mt-24 px-4 w-full">
                        <View>
                            <Text className="text-2xl text-white font-bold text-center mb-3">
                                Welcome Back
                            </Text>
                            <Text className="text-2xl text-white font-bold text-center mb-6">
                                Login as {role || 'User'}
                            </Text>
                        </View>

                        <View className="w-full">
                            <TextInput
                                placeholder="Email"
                                placeholderTextColor="#7B6BA8"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                className="border bg-white focus:border-[#432C81] placeholder:text-[#7B6BA8] border-white rounded-lg px-4 py-4 w-full mb-6"
                            />
                            <TextInput
                                placeholder="Password"
                                placeholderTextColor="#7B6BA8"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                                className="border bg-white placeholder:text-[#7B6BA8] border-white rounded-lg px-4 py-4 w-full mb-2"
                            />
                            <View className="flex items-end">
                                <Text className="text-[#432C81] text-sm py-4"> Forgot Password? </Text>
                            </View>
                            <TouchableOpacity
                                className={`bg-[#435C6D] px-6 w-full py-3 rounded flex items-center justify-center ${loading ? 'opacity-70' : ''}`}
                                onPress={handleLogin}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white text-lg text-center">Login</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => router.push({
                                    pathname: "/(auth)/register",
                                    params: { role: role || 'user' }
                                })}
                                className="flex items-center"
                            >
                                <Text className="text-[#82799D] text-base py-4">
                                    Don't have an account?{" "}
                                    <Text className="text-[#432C81] text-base">Sign up</Text>
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Add bottom padding to ensure everything is scrollable and visible */}
                        <View className="pb-10" />
                    </View>
                </ScrollView>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
}