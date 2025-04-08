import {View, Text, Dimensions, Alert} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {SafeAreaView} from "react-native-safe-area-context";
import SettingsCard from "@/app/components/SettingsCard";
import {supabase} from "@/utils/config";
import {useRouter} from "expo-router";
import {useState, useEffect} from "react"; // Added useEffect import
import {User} from "@/app/(caregiver)/(tabs)/settings";

export default function SettingsPage() {
    const { height } = Dimensions.get("window");
    const router = useRouter();
    const [profile, setProfile] = useState<User | null>(null)

    const profileInfo = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push("/splash");
            return; // Added return to prevent further execution
        }

        const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()
        if (error) {
            Alert.alert(error.message);
            return;
        }
        if(data) {
            setProfile(data as User)
        }
    }

    useEffect(() => {
        profileInfo();
    }, []);

    const logout = async () => {
        await supabase.auth.signOut(); // Added await
        router.push("/splash");
    }

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
                    <View className="h-32 w-32 bg-white flex-row items-center justify-center font-bold text-2xl rounded-full">
                        <Text>{ profile?.name.split(" ")[0][0]} | { profile?.name.split(" ")[1][0]} </Text>
                    </View>
                    <Text className={"text-2xl font-semibold text-white pt-2"}>
                        {profile?.name || "Loading..."}
                    </Text>
                    <Text className={"text-base text-white pt-2"}>
                        {profile?.email || "Loading..."}
                    </Text>
                </View>
                <View className={"mt-14 px-1"}>
                    <SettingsCard title={"Accounts"} icon={"person-outline"} color="#432C81" />
                    <SettingsCard title={"Notification"} icon={"notifications-outline"} color="#432C81" />
                    <SettingsCard title={"Privacy & Security"} icon={"shield-outline"} color="#432C81" />
                    <SettingsCard title={"Sound"} icon={"volume-high-outline"} color="#432C81" />
                    <SettingsCard title={"Language"} icon={"language-outline"} color="#432C81" />
                    <SettingsCard onPress={logout} title={"Logout"} icon={"exit"} color="#432C81" />
                </View>
            </SafeAreaView>
        </LinearGradient>
    )
}