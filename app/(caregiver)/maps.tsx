import React, { useState, useEffect } from 'react';
import {View, Text, StyleSheet, ActivityIndicator, TouchableOpacity} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '@/utils/config';
import {router} from "expo-router";
import {Ionicons} from "@expo/vector-icons";

interface PatientProfile {
    id: string;
    name: string;
    email: string;
    latitude: number;
    longitude: number;
}

interface PatientRelation {
    patient_id: string;
    profiles: PatientProfile;
}

interface Coordinates {
    latitude: number;
    longitude: number;
}

export default function MapScreen(): React.ReactElement {
    const [loading, setLoading] = useState<boolean>(true);
    const [caretakerLocation, setCaretakerLocation] = useState<Coordinates | null>(null);
    const [nearbyPatients, setNearbyPatients] = useState<PatientProfile[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLocationAndPatients = async (): Promise<void> => {
            try {
                setLoading(true);

                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    setError('No active session found');
                    setLoading(false);
                    return;
                }

                const caretakerId = session.user.id;

                const { data: caretakerData, error: caretakerError } = await supabase
                    .from('profiles')
                    .select('latitude, longitude')
                    .eq('id', caretakerId)
                    .single();

                if (caretakerError) throw caretakerError;

                let caretakerCoords: Coordinates;

                if (!caretakerData.latitude || !caretakerData.longitude) {
                    const { status } = await Location.requestForegroundPermissionsAsync();

                    if (status !== 'granted') {
                        // Fallback to Ghana (Accra) if permission denied
                        caretakerCoords = {
                            latitude: 5.5600,
                            longitude: -0.2050,
                        };
                        console.warn('Location permission denied. Using fallback Ghana location.');
                    } else {
                        const location = await Location.getCurrentPositionAsync({});
                        caretakerCoords = {
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude,
                        };

                        await supabase
                            .from('profiles')
                            .update({
                                latitude: caretakerCoords.latitude,
                                longitude: caretakerCoords.longitude,
                            })
                            .eq('id', caretakerId);
                    }
                } else {
                    caretakerCoords = {
                        latitude: caretakerData.latitude,
                        longitude: caretakerData.longitude,
                    };
                }

                console.log('Caretaker location:', caretakerCoords);
                setCaretakerLocation(caretakerCoords);

                const { data: patientRelations, error: relationsError } = await supabase
                    .from('patient_caretaker')
                    .select(`
                        patient_id,
                        profiles!patient_id(id, name, email, latitude, longitude)
                    `)
                    .eq('caretaker_id', caretakerId);

                if (relationsError) throw relationsError;

                const patientsWithLocation = (patientRelations as unknown as PatientRelation[])
                    .map(relation => relation.profiles)
                    .filter((patient): patient is PatientProfile =>
                        patient &&
                        typeof patient.latitude === 'number' &&
                        typeof patient.longitude === 'number'
                    );

                const nearby = patientsWithLocation.filter(patient => {
                    const distance = calculateDistance(
                        caretakerCoords.latitude,
                        caretakerCoords.longitude,
                        patient.latitude,
                        patient.longitude
                    );
                    return distance * 1000 <= 10;
                });

                setNearbyPatients(nearby);
            } catch (err) {
                console.error('Error:', err);
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        fetchLocationAndPatients();
        const intervalId = setInterval(fetchLocationAndPatients, 60000);

        return () => clearInterval(intervalId);
    }, []);

    const calculateDistance = (
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ): number => {
        const R = 6371;
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const deg2rad = (deg: number): number => deg * (Math.PI / 180);

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color="#435C6D" />
                <Text style={styles.loadingText}>Loading map and nearby patients...</Text>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.errorText}>Error: {error}</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity onPress={() => router.back()} className="mt-2 mb-10">
                <Ionicons color={"#000000"} size={23} name={"arrow-back"} />
            </TouchableOpacity>
            <Text style={styles.header}>Nearby Patients</Text>

            {caretakerLocation ? (
                <View style={styles.mapContainer}>
                    <MapView
                        style={styles.map}
                        initialRegion={{
                            latitude: caretakerLocation.latitude,
                            longitude: caretakerLocation.longitude,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                        }}
                    >
                        <Marker
                            coordinate={caretakerLocation}
                            title="Your Location"
                            pinColor="#435C6D"
                        />

                        <Circle
                            center={caretakerLocation}
                            radius={10}
                            fillColor="rgba(67, 92, 109, 0.2)"
                            strokeColor="rgba(67, 92, 109, 0.5)"
                        />

                        {nearbyPatients.map((patient) => (
                            <Marker
                                key={patient.id}
                                coordinate={{
                                    latitude: patient.latitude,
                                    longitude: patient.longitude,
                                }}
                                title={patient.name}
                                description={patient.email}
                                pinColor="#F9D6B1"
                            />
                        ))}
                    </MapView>
                </View>
            ) : (
                <Text style={styles.errorText}>Unable to determine your location</Text>
            )}

            <View style={styles.infoContainer}>
                <Text style={styles.infoText}>
                    Showing {nearbyPatients.length} patients within 10 meters
                </Text>
                {nearbyPatients.map((patient) => (
                    <Text key={patient.id} style={styles.patientItem}>
                        • {patient.name}
                    </Text>
                ))}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#29374B',
    },
    mapContainer: {
        height: 600,
        marginBottom: 16,
        borderRadius: 8,
        overflow: 'hidden',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    infoContainer: {
        padding: 16,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
    },
    infoText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    patientItem: {
        fontSize: 14,
        marginBottom: 4,
        paddingLeft: 8,
    },
    loadingText: {
        marginTop: 16,
        textAlign: 'center',
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        margin: 16,
    },
});
