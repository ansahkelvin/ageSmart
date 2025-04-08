import {LinearGradient} from "expo-linear-gradient";
import {Dimensions, ScrollView, Text, TextInput, TouchableOpacity, View} from "react-native";
import {router} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {SafeAreaView} from "react-native-safe-area-context";


export default function EmergencyContacts() {
    const { height } = Dimensions.get("window");
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
                            />
                        </View>
                    </View>
                </ScrollView>

                <TouchableOpacity
                    className="absolute bottom-5 right-5 bg-[#432C81] w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                    onPress={() => {/* Add your action here */}}
                >
                    <Ionicons name="add" size={30} color="#FFF" />
                </TouchableOpacity>
            </SafeAreaView>
        </LinearGradient>
    )
}