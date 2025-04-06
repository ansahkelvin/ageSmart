import {Image, View, Dimensions, Text, Button, TouchableOpacity} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {useRouter} from "expo-router";

const SplashScreen = () => {
    // Get the screen dimensions
    const { height } = Dimensions.get('window');
    const router = useRouter();

    return (
        <LinearGradient
            colors={["#435C6D", "#F9D6B1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            locations={[0.19, 0.75]}
            style={{ flex: 1, height: height }}
            className="flex-1"
        >
            <View className="flex-1 flex items-center mt-12 px-2">
                <Image
                    source={require("../assets/images/Lifesavers Hand.png")}
                    resizeMode="contain"
                    className="w-72 h-72"
                />
                <View className="flex-1 flex items-center mt-12">
                    <Text className={"text-3xl font-bold text-white"}>Welcome to AgeSmart</Text>
                    <Text className={"text-sm text-center mt-10 text-white "}>
                        AgeSmart is a smart care companion app designed to empower
                        individuals with daily support while enabling caretakers to assist remotely, 
                        efficiently, and compassionately. Whether you're managing your own tasks or 
                        supporting someone else, AgeSmart makes it easy.
                    </Text>
                </View>
                <View className={"mb-16 w-full flex-col gap-5"}>
                    <TouchableOpacity onPress={() => router.push("/(auth)/login")}  className={"h-[48px] w-full rounded-2xl bg-[#435C6D] flex items-center justify-center "} >
                        <Text className={"text-lg text-white"}> Get Started </Text>
                    </TouchableOpacity>
                    <TouchableOpacity className={"h-[48px] w-full rounded-2xl bg-transparent border border-[#435C6D]  flex items-center justify-center "} >
                        <Text className={"text-lg text-[#435C6D]"}> Caregiver </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </LinearGradient>
    );
};

export default SplashScreen;