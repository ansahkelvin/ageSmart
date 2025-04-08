import {View, Text, Dimensions} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {SafeAreaView} from "react-native-safe-area-context";
import SettingsCard from "@/app/components/SettingsCard";

export default function SettingsPage() {
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
                <Text className={"text-2xl text-white font-semibold"}>Settings</Text>
                <View className="flex items-center justify-center mt-12">
                    <View className="h-32 w-32 bg-white rounded-full">
                    </View>
                    <Text className={"text-2xl font-semibold text-white pt-2"}>Julia Marfo</Text>
                    <Text className={"text-base text-white pt-2"}>juls@gmail.com</Text>
                </View>
                <View className={"mt-14 px-1"}>
                    <SettingsCard title={"Accounts"} icon={"person-outline"} color="#432C81" />
                    <SettingsCard title={"Notification"} icon={"notifications-outline"} color="#432C81" />
                    <SettingsCard title={"Privacy & Security"} icon={"shield-outline"} color="#432C81" />
                    <SettingsCard title={"Sound"} icon={"volume-high-outline"} color="#432C81" />
                    <SettingsCard title={"Language"} icon={"language-outline"} color="#432C81" />
                </View>
            </SafeAreaView>
        </LinearGradient>
    )
}