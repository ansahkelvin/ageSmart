import { Dimensions, Text, TextInput, TouchableOpacity, View, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {supabase} from "@/utils/config";

export default function RegisterPage() {
    const router = useRouter();
    const height = Dimensions.get("window").height;
    const { role } = useLocalSearchParams();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!name || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            // Step 1: Sign up the user
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) throw error;

            // Step 2: Create/Update the profile with the role
            if (data.user) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: data.user.id,
                        email: email,
                        name: name,
                        role: role || 'user' // Default to 'user' if role is not provided
                    });

                if (profileError) throw profileError;

                Alert.alert(
                    'Success',
                    'Registration successful! Please check your email for verification.',
                    [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
                );
            }
        } catch (error: any) {
            console.log(error);
            Alert.alert('Error', error.message);
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
                                Hello
                            </Text>
                            <Text className="text-2xl text-white font-bold text-center mb-6">
                                Sign Up as {role || 'User'}
                            </Text>
                        </View>

                        <View className="w-full">
                            <TextInput
                                placeholder="Full Name"
                                placeholderTextColor="#7B6BA8"
                                value={name}
                                onChangeText={setName}
                                className="border bg-white focus:border-[#432C81] placeholder:text-[#7B6BA8] border-white rounded-lg px-4 py-4 w-full mb-6"
                            />
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
                            <View className="flex">
                                <Text className="text-[#432C81] text-sm py-4"> By creating account you agree to the terms and conditions </Text>
                            </View>
                            <TouchableOpacity
                                className={`bg-[#435C6D] px-6 w-full py-3 rounded flex items-center justify-center ${loading ? 'opacity-70' : ''}`}
                                onPress={handleRegister}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white text-lg text-center">Register</Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => router.push({
                                    pathname: "/(auth)/login",
                                    params: { role: role || 'user' }
                                })}
                                className="flex items-center"
                            >
                                <Text className="text-[#82799D] text-base py-4">
                                    Already have an account?{" "}
                                    <Text className="text-[#432C81] text-base">Sign In</Text>
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