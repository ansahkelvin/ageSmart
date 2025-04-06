import {View, Text, Image, ImageSourcePropType, TouchableOpacity, GestureResponderEvent} from "react-native";

interface HomeCardsProps {
    title: string;
    image: ImageSourcePropType;
    onPress: (event: GestureResponderEvent) => void;
}

export default function HomeCards({ title, image, onPress }: HomeCardsProps) {
    return (
        <TouchableOpacity onPress={onPress}  className="h-[116px] rounded-2xl w-full bg-white flex-row justify-between items-center p-4 shadow-sm">
            <Text className="text-2xl font-semibold text-[#432C81] flex-1">{title}</Text>
            <Image
                source={image}
                resizeMode="contain"
                style={{ width: 150, height: 140 }}
                accessible={true}
                accessibilityLabel={`${title} card image`}
            />
        </TouchableOpacity>
    );
}