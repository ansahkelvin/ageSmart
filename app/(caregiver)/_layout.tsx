import { Stack } from "expo-router";

export default function CaregiverLayout() {
    return (
        <Stack screenOptions={{
            headerShown: false,
        }}>
            <Stack.Screen name="(tabs)"/>
        </Stack>
    );
}