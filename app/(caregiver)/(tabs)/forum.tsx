import {Dimensions, ScrollView, View, Text, TouchableOpacity, Alert, TextInput, ActivityIndicator} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {SafeAreaView} from "react-native-safe-area-context";
import {Ionicons} from "@expo/vector-icons";
import {useRouter} from "expo-router";
import {useEffect, useState} from "react";
import {supabase} from "@/utils/config";

// Simple interfaces
interface Profile {
    id: string;
    name: string | null;
    email: string | null;
    role: string | null;
}

interface CommentCount {
    count: number;
}

interface Question {
    id: string;
    user_id: string;
    title: string;
    content: string;
    created_at: string;
    profiles?: Profile;
    comments?: CommentCount[];
    comment_count?: number;
}

export default function Forum() {
    const { height } = Dimensions.get("window");
    const router = useRouter();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddQuestion, setShowAddQuestion] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchQuestions();
    }, []);

    async function fetchQuestions() {
        try {
            setLoading(true);

            // Get questions with profiles and comment count
            const { data, error } = await supabase
                .from('questions')
                .select(`
          *,
          profiles:user_id (name, email, role),
          comments(count)
        `)
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }

            if (data) {
                setQuestions(data as Question[]);
            }
        } catch (error: any) {
            console.error('Error fetching questions:', error.message);
            Alert.alert('Error', 'Failed to load forum questions');
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateQuestion() {
        if (!title.trim() || !content.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        try {
            setSubmitting(true);

            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                Alert.alert('Error', 'You must be logged in to post a question');
                return;
            }

            const { error } = await supabase
                .from('questions')
                .insert([
                    { title, content, user_id: user.id }
                ]);

            if (error) throw error;

            // Clear form and refresh
            setTitle("");
            setContent("");
            setShowAddQuestion(false);
            fetchQuestions();

        } catch (error: any) {
            console.error('Error creating question:', error.message);
            Alert.alert('Error', 'Failed to post your question');
        } finally {
            setSubmitting(false);
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    return (
        <LinearGradient
            colors={["#29374B", "#F9D6B1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            locations={[0.19, 0.75]}
            style={{ flex: 1, height: height }}
            className="flex-1 rounded-2xl">
            <SafeAreaView className="flex-1 relative px-6">
                <Text className="text-2xl text-white font-bold mt-6 mb-4">Forum</Text>

                {loading ? (
                    <ActivityIndicator size="large" color="#ffffff" className="mt-10" />
                ) : showAddQuestion ? (
                    // Add Question Form
                    <View className="bg-white/20 rounded-xl p-5">
                        <Text className="text-white font-bold text-lg mb-3">Ask a Question</Text>

                        <Text className="text-white mb-1">Title</Text>
                        <TextInput
                            className="bg-white/30 rounded-lg p-3 mb-4 text-white"
                            placeholder="What's your question about?"
                            placeholderTextColor="rgba(255,255,255,0.5)"
                            value={title}
                            onChangeText={setTitle}
                        />

                        <Text className="text-white mb-1">Details</Text>
                        <TextInput
                            className="bg-white/30 rounded-lg p-3 mb-4 h-28 text-white"
                            placeholder="Provide more details..."
                            placeholderTextColor="rgba(255,255,255,0.5)"
                            value={content}
                            onChangeText={setContent}
                            multiline
                            textAlignVertical="top"
                        />

                        <View className="flex-row mt-2">
                            <TouchableOpacity
                                className="flex-1 bg-white/30 rounded-lg p-3 mr-2"
                                onPress={() => setShowAddQuestion(false)}
                            >
                                <Text className="text-white text-center font-bold">Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                className={`flex-1 rounded-lg p-3 ${submitting ? 'bg-gray-400' : 'bg-white'}`}
                                onPress={handleCreateQuestion}
                                disabled={submitting}
                            >
                                <Text className={`text-center font-bold ${submitting ? 'text-white' : 'text-[#29374B]'}`}>
                                    {submitting ? 'Posting...' : 'Post'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    // Forum Question List
                    <>
                        <ScrollView className="flex-1">
                            {questions.length === 0 ? (
                                <View className="py-8 px-4 bg-white/20 rounded-xl mt-2 items-center">
                                    <Text className="text-white text-lg font-medium">No questions yet</Text>
                                    <Text className="text-white/80 text-center mt-2">Be the first to start a discussion!</Text>
                                </View>
                            ) : (
                                questions.map((question) => (
                                    <TouchableOpacity
                                        key={question.id}
                                        className="mb-4 bg-white/20 rounded-xl p-4"
                                        onPress={() => router.push(`/forum/${question.id}`)}
                                    >
                                        <Text className="text-white font-bold text-lg">{question.title}</Text>
                                        <View className="flex-row justify-between items-center mt-2">
                                            <Text className="text-white/80">
                                                By {question.profiles?.name || 'Anonymous'}
                                            </Text>
                                            <Text className="text-white/60 text-xs">
                                                {formatDate(question.created_at)}
                                            </Text>
                                        </View>
                                        <View className="flex-row items-center mt-3">
                                            <Ionicons name="chatbubble-outline" size={16} color="white" />
                                            <Text className="text-white/80 ml-1">
                                                {question.comments && question.comments[0] ? question.comments[0].count : 0} comments
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>

                        {/* Floating Action Button */}
                        <TouchableOpacity
                            className="absolute bottom-8 right-6 bg-white w-14 h-14 rounded-full items-center justify-center shadow-lg"
                            onPress={() => setShowAddQuestion(true)}
                        >
                            <Ionicons name="add" size={30} color="#29374B" />
                        </TouchableOpacity>
                    </>
                )}
            </SafeAreaView>
        </LinearGradient>
    );
}