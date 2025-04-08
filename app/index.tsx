import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import {supabase} from "@/utils/config";

export default function Index() {
    const router = useRouter();
    const [isReady, setIsReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Set a small delay to ensure the Root Layout is mounted
        const timer = setTimeout(() => {
            setIsReady(true);
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (isReady) {
            // Check if user is logged in
            const checkAuth = async () => {
                try {
                    // Get current session
                    const { data: { session } } = await supabase.auth.getSession();

                    if (session?.user) {
                        // User is logged in, get their role from profiles table
                        const { data: profileData, error } = await supabase
                            .from('profiles')
                            .select('role')
                            .eq('id', session.user.id)
                            .single();

                        if (error) {
                            throw error;
                        }

                        // Navigate based on role
                        if (profileData?.role === 'caregiver') {
                            router.replace('/(caregiver)/(tabs)');
                        } else {
                            router.replace('/(user)/(tabs)');
                        }
                    } else {
                        // No user logged in, go to splash screen
                        router.replace('/splash');
                    }
                } catch (error) {
                    console.error('Error checking auth:', error);
                    // On error, default to splash screen
                    router.replace('/splash');
                } finally {
                    setIsLoading(false);
                }
            };

            checkAuth();
        }
    }, [isReady]);

    // Show a loading indicator while checking auth
    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#435C6D" />
            </View>
        );
    }

    // Return an empty view if not loading
    return <View />;
}