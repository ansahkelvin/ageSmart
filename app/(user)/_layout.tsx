import { Stack } from "expo-router";

export default function UserLayout() {
    return (
        <Stack screenOptions={{
            headerShown: false,
        }}>
            <Stack.Screen name="(tabs)"/>
            <Stack.Screen name="forum/[id]" options={{
                presentation: "card",
                animation: "slide_from_right",
            }}/>
        </Stack>
    );
}