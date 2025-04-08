import {View, Text, Dimensions} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {SafeAreaView} from "react-native-safe-area-context";

export default function Notifications() {
    const { height } = Dimensions.get("window");
    return (
        <LinearGradient
            colors={["#435C6D", "#F9D6B1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            locations={[0.19, 0.75]}
            style={{ flex: 1, height: height }}
            className="flex-1">
            <SafeAreaView className={"px-4"}>
                <Text className={"text-2xl text-white font-semibold"}>Notifications</Text>
                <View className={"bg-white h-[100px] mt-12 rounded-lg p-3"}>
                    <Text className="text-base font-bold text-[#432C81]"> Notification Title</Text>
                    <Text className="text-sm pt-2 text-[#7B6BA8]">Lorem ipsum dolor sit amet, consectetur Lorem ipsum dolor sit amet, ipsum dolor</Text>
                </View>
            </SafeAreaView>
        </LinearGradient>
    )
}