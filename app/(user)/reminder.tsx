import {Dimensions, View, Text, TouchableOpacity, ScrollView, Alert} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {SafeAreaView} from "react-native-safe-area-context";
import HomeCards from "@/app/components/HomeCards";
import {Ionicons} from "@expo/vector-icons";
import {router, useRouter} from "expo-router";
import {useEffect, useState} from "react";
import {supabase} from "@/utils/config";

interface ReminderProps {
    id:string;
    description: string;
    time: string;
    user: string;
    caregiver:string;
}
export default function ReminderPage() {
    const { height } = Dimensions.get("window");
    const router = useRouter();
    const [ medicalReminder, setMedicalReminder ] = useState<ReminderProps[]>();
    const fetchMedicalInformation = async () => {
        const { data: { user } } = await supabase.auth?.getUser();
        if(!user){
            router.replace("/splash");
        }
        const { data, error } = await supabase.from("medical_reminders").select("*").eq("user", user!.id);
        
        if(error){
            Alert.alert(error.message);
        }
        setMedicalReminder(data as ReminderProps[]);
        
    }
    useEffect(() => {
        fetchMedicalInformation()
    }, []);
    
    return (
        <LinearGradient
            colors={["#435C6D", "#F9D6B1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            locations={[0.19, 0.75]}
            style={{ flex: 1, height: height }}
            className="flex-1">
            <SafeAreaView className=" flex gap-10">
                <View className="px-3 flex gap-10">
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons color={"#FFFFFF"} size={23} name={"arrow-back"} />
                    </TouchableOpacity>
                    <HomeCards
                        onPress={() => {}}
                        title={"Medication Reminder"}
                        image={require("./../../assets/images/Lifesavers Electrocardiogram.png")}
                    />
                </View>
               
                <ScrollView className={"rounded-2xl"}>
                    <LinearGradient
                        colors={["#D7CFEC", "#FFAC54"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        locations={[0.19, 0.75]}
                        style={{ flex: 1, height: height }}
                        className="flex-1 rounded-2xl ">
                        {
                           medicalReminder?.map((reminder: ReminderProps) => (
                               <View key={reminder.id} className="mx-3 flex bg-white mt-12 rounded-2xl h-[100px] ">
                                   <View className="p-5 gap-3">
                                       <Text className="text-xl font-bold text-[#432C81]">{new Date(reminder.time).toISOString().split("T")[0]}</Text>
                                       <Text className="text-sm text-[#7B6BA8]">{reminder.description}</Text>
                                   </View>
                               </View>
                           )) 
                        }
                        
                    </LinearGradient>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
}