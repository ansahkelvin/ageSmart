import {View, Text, Dimensions, Image} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {SafeAreaView} from "react-native-safe-area-context";
import HomeCards from "@/app/components/HomeCards";
import {useRouter} from "expo-router";

export default function Home() {
    const { height } = Dimensions.get("window");
    const router = useRouter();
    return (
        <LinearGradient
            colors={["#435C6D", "#F9D6B1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            locations={[0.19, 0.75]}
            style={{ flex: 1, height: height }}
            className="flex-1">
            <SafeAreaView className={"px-4"}>
                <View className={"flex flex-row items-center justify-between"}>
                    <Text className={"text-2xl text-white"}>✋🏽Hi</Text>
                    <View className="rounded-full w-10 h-10">
                        <Image className={"w-full h-full rounded-full"} source={{ uri: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=3280&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }} alt={"Avatar"} />
                    </View>
                </View>
                <View className="mt-10 flex gap-5">
                    <HomeCards 
                        onPress={() => router.push("/task")}
                        title={"Task for the day"} image={require("./../../../assets/images/Lifesavers Stomach.png")}/>
                    <HomeCards
                        onPress={() => router.push("/task")}
                        title={"Medication Reminders"} image={require("./../../../assets/images/Lifesavers Electrocardiogram.png")}/>
                    <HomeCards
                        onPress={() => router.push("/task")}
                        title={"Chatroom"} image={require("./../../../assets/images/Illustration.png")}/>
                    <HomeCards
                        onPress={() => router.push("/task")}
                        title={"Emergency Contact"} image={require("./../../../assets/images/Lifesavers Bust.png")}/>

                </View>
            </SafeAreaView>
        </LinearGradient>
    )
}