import { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    SafeAreaView
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "@/utils/config";

// Define notification type interface
interface NotificationActor {
    id?: string;
    name?: string | null;
    email?: string | null;
}

interface Notification {
    id: number;
    user_id: string;
    type: 'reaction' | 'comment' | 'medical_reminder' | 'task';
    source_table: string;
    source_id: string;
    actor_id: string | null;
    title: string;
    content: string;
    is_read: boolean;
    created_at: string;
    updated_at: string;
    actor?: NotificationActor | null;
}

// Define icon mapping with proper types
const NOTIFICATION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
    reaction: "thumbs-up",
    comment: "chatbubble-ellipses",
    medical_reminder: "medkit",
    task: "calendar"
};

export default function Notifications() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [unreadCount, setUnreadCount] = useState<number>(0);

    useEffect(() => {
        fetchNotifications();

        // Set up real-time subscription for new notifications
        const notificationsSubscription = supabase
            .channel('public:notifications')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${supabase.auth.getUser().then(({ data }) => data.user?.id)}`
            }, () => {
                fetchNotifications();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(notificationsSubscription);
        };
    }, []);

    const fetchNotifications = async (): Promise<void> => {
        try {
            setLoading(true);

            const { data } = await supabase.auth.getUser();
            const user = data.user;

            if (!user) return;

            const { data: notificationsData, error } = await supabase
                .from('notifications')
                .select(`
                    *,
                    actor:actor_id (name, email)
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            if (notificationsData) {
                setNotifications(notificationsData as Notification[]);
                const unread = notificationsData.filter(notification => !notification.is_read).length;
                setUnreadCount(unread);
            }
        } catch (error: any) {
            console.error('Error fetching notifications:', error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const markAsRead = async (notificationId: number): Promise<void> => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true, updated_at: new Date().toISOString() })
                .eq('id', notificationId);

            if (error) {
                throw error;
            }

            // Update local state
            setNotifications(prevNotifications =>
                prevNotifications.map(notification =>
                    notification.id === notificationId
                        ? { ...notification, is_read: true }
                        : notification
                )
            );

            // Update unread count
            setUnreadCount(prevCount => Math.max(0, prevCount - 1));
        } catch (error: any) {
            console.error('Error marking notification as read:', error.message);
        }
    };

    const markAllAsRead = async (): Promise<void> => {
        try {
            const { data } = await supabase.auth.getUser();
            const user = data.user;

            if (!user) return;

            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true, updated_at: new Date().toISOString() })
                .eq('user_id', user.id)
                .eq('is_read', false);

            if (error) {
                throw error;
            }

            // Update local state
            setNotifications(prevNotifications =>
                prevNotifications.map(notification => ({ ...notification, is_read: true }))
            );

            // Reset unread count
            setUnreadCount(0);
        } catch (error: any) {
            console.error('Error marking all notifications as read:', error.message);
        }
    };

    const handleNotificationPress = async (notification: Notification): Promise<void> => {
        // Mark as read
        if (!notification.is_read) {
            await markAsRead(notification.id);
        }

        // Navigate based on notification type
        switch (notification.type) {
            case 'reaction':
            case 'comment':
                if (notification.source_table === 'questions') {
                    router.push(`/forum/${notification.source_id}`);
                }
                break;
            case 'medical_reminder':
                router.push('/(user)/reminder');
                break;
            case 'task':
                router.push('/(user)/task');
                break;
            default:
                break;
        }
    };

    const onRefresh = (): void => {
        setRefreshing(true);
        fetchNotifications();
    };

    const getTimeAgo = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return `${seconds} seconds ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} minutes ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hours ago`;
        const days = Math.floor(hours / 24);
        if (days < 30) return `${days} days ago`;
        const months = Math.floor(days / 30);
        return `${months} months ago`;
    };

    // Helper function to get a valid icon name
    const getIconName = (type: string): keyof typeof Ionicons.glyphMap => {
        return NOTIFICATION_ICONS[type] || "notifications";
    };

    const renderNotificationItem = ({ item }: { item: Notification }) => (
        <TouchableOpacity
            style={[
                styles.notificationItem,
                item.is_read ? styles.readNotification : styles.unreadNotification
            ]}
            onPress={() => handleNotificationPress(item)}
        >
            <View style={styles.iconContainer}>
                <Ionicons
                    name={getIconName(item.type)}
                    size={24}
                    color="#29374B"
                />
            </View>
            <View style={styles.contentContainer}>
                <Text style={styles.notificationTitle}>{item.title}</Text>
                <Text style={styles.notificationContent}>{item.content}</Text>
                <View style={styles.notificationFooter}>
                    <Text style={styles.timeAgo}>{getTimeAgo(item.created_at)}</Text>
                    {item.actor && (
                        <Text style={styles.actorName}>By: {item.actor.name || 'System'}</Text>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <LinearGradient
            colors={["#29374B", "#F9D6B1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            locations={[0.19, 0.75]}
            style={styles.gradient}
        >
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                  
                    <Text style={styles.headerTitle}>Notifications</Text>
                    {unreadCount > 0 && (
                        <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
                            <Text style={styles.markAllText}>Mark all as read</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {loading && !refreshing ? (
                    <ActivityIndicator size="large" color="#ffffff" style={styles.loader} />
                ) : notifications.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="notifications-off" size={48} color="#ffffff" />
                        <Text style={styles.emptyText}>No notifications yet</Text>
                    </View>
                ) : (
                    <FlatList
                        data={notifications}
                        renderItem={renderNotificationItem}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.listContainer}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor="#ffffff"
                            />
                        }
                    />
                )}
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    container: {
        flex: 1,
        paddingHorizontal: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 20,
        marginBottom: 16,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        flex: 1,
        marginLeft: 16,
    },
    markAllButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    markAllText: {
        color: 'white',
        fontSize: 12,
    },
    listContainer: {
        paddingBottom: 24,
    },
    notificationItem: {
        flexDirection: 'row',
        borderRadius: 12,
        marginBottom: 12,
        padding: 16,
    },
    unreadNotification: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderLeftWidth: 4,
        borderLeftColor: '#29374B',
    },
    readNotification: {
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(249, 214, 177, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    contentContainer: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#29374B',
        marginBottom: 4,
    },
    notificationContent: {
        fontSize: 14,
        color: '#333',
        marginBottom: 8,
    },
    notificationFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timeAgo: {
        fontSize: 12,
        color: '#666',
    },
    actorName: {
        fontSize: 12,
        color: '#666',
    },
    loader: {
        marginTop: 48,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 18,
        color: 'white',
        marginTop: 16,
    },
});