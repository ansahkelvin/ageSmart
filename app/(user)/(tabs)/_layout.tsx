import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
    return (
        <Tabs
            options={{
                headerShown: false,
            }}
            screenOptions={{
                tabBarShowLabel: false,
                tabBarActiveTintColor: '#433AA8',
                tabBarInactiveTintColor: '#9590B5',
                tabBarStyle: {
                    height: 80,
                    paddingBottom: 10,
                }
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    headerShown: false,
                    tabBarIcon: ({ color }: { color: string }) => (
                        <Ionicons name="grid" size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="chat"
                options={{
                    headerShown: false,
                    tabBarIcon: ({ color }: { color: string }) => (
                        <Ionicons name="stats-chart" size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="notifications"
                options={{
                    headerShown: false,
                    tabBarIcon: ({ color }: { color: string }) => (
                        <Ionicons name="notifications" size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    headerShown: false,
                    tabBarIcon: ({ color }: { color: string }) => (
                        <Ionicons name="settings" size={24} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}