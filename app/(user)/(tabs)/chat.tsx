import {View, Text, Dimensions} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {SafeAreaView} from "react-native-safe-area-context";

export default function Stats() {
  
    const { height } = Dimensions.get("window");
    return (
        <LinearGradient
            colors={["#435C6D", "#F9D6B1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            locations={[0.19, 0.75]}
            style={{ flex: 1, height: height }}
            className="flex-1">
            <SafeAreaView>
                <Text>Chats</Text>
            </SafeAreaView>
        </LinearGradient>
    )
}