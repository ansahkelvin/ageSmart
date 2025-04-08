import {View, Text, TouchableOpacity} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ComponentProps } from "react";

// Extract the type for the name prop from Ionicons component
type IconName = ComponentProps<typeof Ionicons>["name"];

interface Props {
    title: string;
    icon: IconName;
    size?: number;
    color?: string;
    onPress?: () => void;
}

export default function SettingsCard({ title, icon, size = 24, color = "#000", onPress }: Props) {
    return (
        <TouchableOpacity onPress={onPress} className="flex-row items-center justify-between  p-4 rounded-xl shadow-sm mb-3">
            <View className="flex-row gap-4 items-center">
                <Ionicons name={icon} size={size} color={"#A095C1"} />
                <Text className="ml-3  text-base text-[#56428F]">{title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
    )
}