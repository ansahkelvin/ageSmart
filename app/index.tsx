import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator, Alert } from "react-native";
import { supabase } from "@/utils/config";
import * as Location from 'expo-location';

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

    // Function to request and get location
    const getUserLocation = async () => {
        try {
            // Request location permissions
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert(
                    'Permission Denied',
                    'Permission to access location was denied. Some features may be limited.',
                    [{ text: 'OK' }]
                );
                return null;
            }

            // Get current position
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            return {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            };
        } catch (error) {
            console.error('Error getting location:', error);
            return null;
        }
    };

    // Function to update user location in profiles table
    const updateUserLocation = async (userId: string, locationData: { latitude: any; longitude: any; }) => {
        if (!locationData) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    latitude: locationData.latitude,
                    longitude: locationData.longitude
                })
                .eq('id', userId);

            if (error) {
                throw error;
            }

            console.log('Location updated successfully');
        } catch (error) {
            console.error('Error updating location:', error);
        }
    };

    useEffect(() => {
        if (isReady) {
            // Check if user is logged in
            const checkAuth = async () => {
                try {
                    // Get current session
                    const { data: { session } } = await supabase.auth.getSession();

                    if (session?.user) {
                        // Get user location
                        const locationData = await getUserLocation();

                        // Update location in database if permissions granted
                        if (locationData) {
                            await updateUserLocation(session.user.id, locationData);
                        }

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