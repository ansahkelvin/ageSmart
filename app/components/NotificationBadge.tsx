import { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "@/utils/config";

export default function NotificationBadge() {
    const router = useRouter();
    const [unreadCount, setUnreadCount] = useState<number>(0);

    useEffect(() => {
        fetchUnreadCount();

        // Set up real-time subscription for new notifications
        const notificationsSubscription = supabase
            .channel('unread-notifications')
            .on('postgres_changes', {
                event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${supabase.auth.getUser().then(({ data }) => data.user?.id)}`
            }, () => {
                fetchUnreadCount();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(notificationsSubscription);
        };
    }, []);

    const fetchUnreadCount = async (): Promise<void> => {
        try {
            const { data } = await supabase.auth.getUser();
            const user = data.user;

            if (!user) return;

            const { count, error } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('is_read', false);

            if (error) {
                throw error;
            }

            setUnreadCount(count || 0);
        } catch (error: any) {
            console.error('Error fetching notification count:', error.message);
        }
    };

    const navigateToNotifications = (): void => {
        router.push('/notifications');
    };

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={navigateToNotifications}
        >
            <Ionicons name="notifications" size={24} color="white" />
            {unreadCount > 0 && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#FF4D4F',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
});