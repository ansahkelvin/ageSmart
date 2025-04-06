import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

export default function Index() {
    const router = useRouter();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Set a small delay to ensure the Root Layout is mounted
        const timer = setTimeout(() => {
            setIsReady(true);
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (isReady) {
            router.replace("/splash");
        }
    }, [isReady]);

    // Return an empty view that doesn't display anything
    return <View />;
}