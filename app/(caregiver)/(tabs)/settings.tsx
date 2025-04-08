import {View, Text, Dimensions, Alert} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {SafeAreaView} from "react-native-safe-area-context";
import SettingsCard from "@/app/components/SettingsCard";
import {supabase} from "@/utils/config";
import {useRouter} from "expo-router";
import {useEffect, useState} from "react";

export interface User {
    id: string;
    name: string;
    email: string;
}

export default function SettingsPage() {
    const { height } = Dimensions.get("window");
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();

            if (!authUser?.id) {
                return;
            }

            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", authUser.id)
                .single();

            if (error) {
                Alert.alert("An error occurred", error.message);
                return;
            }

            if (data) {
                setUser(data as User);
            }
        };

        fetchUser();
    }, []);

    const logout = async () => {
        await supabase.auth.signOut();
        router.push("/splash");
    };

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
                        <Text>{ user?.name.split(" ")[0][0]} | { user?.name.split(" ")[1][0]} </Text>
                    </View>
                    <Text className={"text-2xl font-semibold text-white pt-2"}>
                        {user?.name}
                    </Text>
                    <Text className={"text-base text-white pt-2"}>
                        {user?.email}
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
    );
}