import { Dimensions, Text, TextInput, TouchableOpacity, View, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export default function LoginPage() {
    const router = useRouter();
    const height = Dimensions.get("window").height;

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
                                Login
                            </Text>
                        </View>

                        <View className="w-full">
                            <TextInput
                                placeholder="Email"
                                placeholderTextColor="#7B6BA8"
                                className="border bg-white focus:border-[#432C81] placeholder:text-[#7B6BA8] border-white rounded-lg px-4 py-4 w-full mb-6"
                            />
                            <TextInput
                                placeholder="Password"
                                placeholderTextColor="#7B6BA8"
                                secureTextEntry
                                className="border bg-white placeholder:text-[#7B6BA8] border-white rounded-lg px-4 py-4 w-full mb-2"
                            />
                            <View className="flex items-end">
                                <Text className="text-[#432C81] text-sm py-4"> Forgot Password? </Text>
                            </View>
                            <TouchableOpacity
                                className="bg-[#435C6D] px-6 w-full py-3 rounded"
                                onPress={() => router.push("/(user)/(tabs)")}
                            >
                                <Text className="text-white text-lg text-center">Login</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => router.push("/(auth)/register")}  className="flex items-center">
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