import {Dimensions, View, Text, TouchableOpacity} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {SafeAreaView} from "react-native-safe-area-context";
import HomeCards from "@/app/components/HomeCards";
import {Ionicons} from "@expo/vector-icons";
import {useState} from "react";
import { router } from "expo-router";

export default function TaskPage() {
    const [currentIndex, setCurrentIndex] = useState<number>(0);

    const { height } = Dimensions.get("window");
    return (
        <LinearGradient
            colors={["#435C6D", "#F9D6B1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            locations={[0.19, 0.75]}
            style={{ flex: 1, height: height }}
            className="flex-1">
            <SafeAreaView className="px-3 flex gap-10">
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons color={"#FFFFFF"} size={23} name={"arrow-back"} />
                </TouchableOpacity>
                <HomeCards
                    onPress={() => {}}
                    title={"Task for the day"}
                    image={require("./../../assets/images/Lifesavers Stomach.png")}/>
                <View className="h-[100px] w-full bg-[#EDECF4] rounded-xl flex flex-row p-3">
                    <TouchableOpacity
                        onPress={() => setCurrentIndex(0)}
                        className={`flex items-center justify-center w-1/2 rounded-xl ${currentIndex === 0 ? 'bg-[#432C81]' : ''}`}
                    >
                        <Text className={`font-bold text-2xl ${currentIndex === 0 ? 'text-white' : 'text-[#432C81]'}`}>Goals</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setCurrentIndex(1)}
                        className={`flex items-center justify-center w-1/2 rounded-xl ${currentIndex === 1 ? 'bg-[#432C81]' : ''}`}
                    >
                        <Text className={`font-bold text-2xl ${currentIndex === 1 ? 'text-white' : 'text-black'}`}>Completed</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
}