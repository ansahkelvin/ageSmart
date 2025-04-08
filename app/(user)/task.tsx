import {Dimensions, View, Text, TouchableOpacity, Alert} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {SafeAreaView} from "react-native-safe-area-context";
import HomeCards from "@/app/components/HomeCards";
import {Ionicons} from "@expo/vector-icons";
import {useEffect, useState} from "react";
import { router } from "expo-router";
import {supabase} from "@/utils/config";

interface Tasks {
    id: string;
    description: string;
    completed: boolean;
}
export default function TaskPage() {
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [tasks, setTasks] = useState<Tasks[] | null>(null);
    const [loading, setLoading] = useState(false);

    const updateTask = async (task: Tasks) => {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user?.id) {
            console.error("No authenticated user found");
            return;
        }

        const { data, error } = await supabase
            .from("tasks")
            .update({ completed: true }) 
            .eq("id", task.id)
            .eq("user", user.id)
            .select();

        if (error) {
            console.error("Error updating task:", error.message);
            return;
        }

        if (data) {
            fetchTasks();  // Refresh the task list
        }
    };
    
    const fetchTasks = async () => {
        const { data: { user }  } = await supabase.auth.getUser();
        const { data, error } = await supabase.from("tasks").select("*").eq("user",user?.id)
        if(data) {
            setTasks(data as Tasks[]);
        }
        if (error) {
            Alert.alert(error.message);
        }
    }
    
    useEffect(() => {
        fetchTasks();
    }, [])

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
                {
                    currentIndex === 0 ? <View>
                        {tasks ? tasks.filter((task) => !task.completed).map((task: Tasks) => (
                            <View key={task.id} className="flex-row items-center gap-x-3 bg-[#EDECF4] py-8 px-3 rounded-2xl">
                                <Ionicons
                                    onPress={async ()=> { await updateTask(task)}}
                                    name={task.completed ? "checkmark-circle" : "ellipse-outline"}
                                    size={24}
                                    color={task.completed ? "#4CAF50" : "#757575"}
                                />
                                <Text className="text-[#432C81] font-semibold">{task.description}</Text>
                            </View>
                        )) : null }
                    </View> : <View>
                        {tasks?.filter((task => task.completed === true))
                            .map((task) => <View key={task.id} className="flex-row items-center gap-x-3 bg-[#EDECF4] py-8 px-3 rounded-2xl">
                                <Ionicons
                                    name={task.completed ? "checkmark-circle" : "ellipse-outline"}
                                    size={24}
                                    color={task.completed ? "#4CAF50" : "#757575"}
                                />
                                <Text className="text-[#432C81] font-semibold">{task.description}</Text>
                            </View>
                            )}
                    </View>
                }
                
            </SafeAreaView>
        </LinearGradient>
    );
}