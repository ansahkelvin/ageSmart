import { Dimensions, ScrollView, View, Text, TouchableOpacity, Alert, TextInput, ActivityIndicator, RefreshControl } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/utils/config";

// Interfaces
interface Profile {
    id: string;
    name: string | null;
    email: string | null;
    role: string | null;
}

interface Question {
    id: string;
    user_id: string;
    title: string;
    content: string;
    created_at: string;
    likes_count?: number;
    dislikes_count?: number;
    user_reaction?: 'like' | 'dislike' | null;
    profiles?: Profile;
}

interface Comment {
    id: string;
    question_id: string;
    user_id: string;
    content: string;
    created_at: string;
    likes_count?: number;
    dislikes_count?: number;
    user_reaction?: 'like' | 'dislike' | null;
    profiles?: Profile;
}

export default function ForumDetail() {
    const { height } = Dimensions.get("window");
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [question, setQuestion] = useState<Question | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        getCurrentUser();
        if (id) {
            fetchQuestionDetails();

            // Set up real-time subscription for new comments
            const commentsSubscription = supabase
                .channel(`comments-for-${id}`)
                .on('postgres_changes', {
                    event: '*', // Listen for all changes instead of just 'INSERT'
                    schema: 'public',
                    table: 'comments',
                    filter: `question_id=eq.${id}`
                }, () => {
                    fetchComments();
                })
                .subscribe();

            // Set up real-time subscription for question reactions
            const questionReactionsSubscription = supabase
                .channel(`question-reactions-${id}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'question_reactions',
                    filter: `question_id=eq.${id}`
                }, () => {
                    fetchQuestionDetails();
                })
                .subscribe();

            // Set up real-time subscription for comment reactions
            const commentReactionsSubscription = supabase
                .channel(`comment-reactions-${id}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'comment_reactions',
                    filter: `question_id=eq.${id}`
                }, () => {
                    fetchComments();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(commentsSubscription);
                supabase.removeChannel(questionReactionsSubscription);
                supabase.removeChannel(commentReactionsSubscription);
            };
        }
    }, [id]);

    async function getCurrentUser() {
        const { data, error } = await supabase.auth.getUser();
        if (data?.user) {
            setUserId(data.user.id);
        }
    }

    async function fetchQuestionDetails() {
        if (!id) return;

        try {
            setLoading(true);

            // Get question details
            const { data, error } = await supabase
                .from('questions')
                .select(`
          *,
          profiles:user_id (name, email, role)
        `)
                .eq('id', id)
                .single();

            if (error) {
                throw error;
            }

            if (data) {
                // Get question likes/dislikes count
                await fetchQuestionReactions(data);
                setQuestion(data as Question);
                fetchComments();
            }
        } catch (error: any) {
            console.error('Error fetching question details:', error.message);
            Alert.alert('Error', 'Failed to load the question details');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    async function fetchQuestionReactions(questionData: Question) {
        try {
            // Get likes count - fixed to use exact count
            const { count: likesCount, error: likesError } = await supabase
                .from('question_reactions')
                .select('*', { count: 'exact', head: true })
                .eq('question_id', questionData.id)
                .eq('reaction_type', 'like');

            // Get dislikes count - fixed to use exact count
            const { count: dislikesCount, error: dislikesError } = await supabase
                .from('question_reactions')
                .select('*', { count: 'exact', head: true })
                .eq('question_id', questionData.id)
                .eq('reaction_type', 'dislike');

            // Get user's reaction if logged in
            if (userId) {
                const { data: userReaction, error: userReactionError } = await supabase
                    .from('question_reactions')
                    .select('reaction_type')
                    .eq('question_id', questionData.id)
                    .eq('user_id', userId)
                    .single();

                if (userReaction && !userReactionError) {
                    questionData.user_reaction = userReaction.reaction_type as 'like' | 'dislike';
                }
            }

            if (!likesError && likesCount !== null) {
                questionData.likes_count = likesCount;
            }

            if (!dislikesError && dislikesCount !== null) {
                questionData.dislikes_count = dislikesCount;
            }

            return questionData;
        } catch (error) {
            console.error('Error fetching reactions:', error);
            return questionData;
        }
    }

    async function fetchComments() {
        if (!id) return;

        try {
            const { data, error } = await supabase
                .from('comments')
                .select(`
          *,
          profiles:user_id (name, email, role)
        `)
                .eq('question_id', id)
                .order('created_at', { ascending: true });

            if (error) {
                throw error;
            }

            if (data) {
                // Get reactions for each comment
                const commentsWithReactions = await Promise.all(
                    data.map(async (comment) => {
                        return await fetchCommentReactions(comment);
                    })
                );

                setComments(commentsWithReactions as Comment[]);
            }
        } catch (error: any) {
            console.error('Error fetching comments:', error.message);
        }
    }

    async function fetchCommentReactions(commentData: Comment) {
        try {
            // Get likes count - fixed to use exact count
            const { count: likesCount, error: likesError } = await supabase
                .from('comment_reactions')
                .select('*', { count: 'exact', head: true })
                .eq('comment_id', commentData.id)
                .eq('reaction_type', 'like');

            // Get dislikes count - fixed to use exact count
            const { count: dislikesCount, error: dislikesError } = await supabase
                .from('comment_reactions')
                .select('*', { count: 'exact', head: true })
                .eq('comment_id', commentData.id)
                .eq('reaction_type', 'dislike');

            // Get user's reaction if logged in
            if (userId) {
                const { data: userReaction, error: userReactionError } = await supabase
                    .from('comment_reactions')
                    .select('reaction_type')
                    .eq('comment_id', commentData.id)
                    .eq('user_id', userId)
                    .single();

                if (userReaction && !userReactionError) {
                    commentData.user_reaction = userReaction.reaction_type as 'like' | 'dislike';
                }
            }

            if (!likesError && likesCount !== null) {
                commentData.likes_count = likesCount;
            }

            if (!dislikesError && dislikesCount !== null) {
                commentData.dislikes_count = dislikesCount;
            }

            return commentData;
        } catch (error) {
            console.error('Error fetching comment reactions:', error);
            return commentData;
        }
    }

    async function handleReaction(type: 'question' | 'comment', id: string, reactionType: 'like' | 'dislike') {
        if (!userId) {
            Alert.alert('Error', 'You must be logged in to react to posts');
            return;
        }

        try {
            const table = type === 'question' ? 'question_reactions' : 'comment_reactions';
            const idField = type === 'question' ? 'question_id' : 'comment_id';

            // Check if user already reacted
            const { data: existingReaction } = await supabase
                .from(table)
                .select('*')
                .eq(idField, id)
                .eq('user_id', userId)
                .single();

            if (existingReaction) {
                if (existingReaction.reaction_type === reactionType) {
                    // Remove reaction if clicking the same button
                    await supabase
                        .from(table)
                        .delete()
                        .eq('id', existingReaction.id);
                } else {
                    // Update reaction if switching between like/dislike
                    await supabase
                        .from(table)
                        .update({ reaction_type: reactionType })
                        .eq('id', existingReaction.id);
                }
            } else {
                // Add new reaction
                await supabase
                    .from(table)
                    .insert([
                        {
                            [idField]: id,
                            user_id: userId,
                            reaction_type: reactionType
                        }
                    ]);
            }

            // Refresh data
            if (type === 'question') {
                fetchQuestionDetails();
            } else {
                fetchComments();
            }
        } catch (error: any) {
            console.error(`Error reacting to ${type}:`, error.message);
            Alert.alert('Error', `Failed to save your reaction. Please try again.`);
        }
    }

    const onRefresh = () => {
        setRefreshing(true);
        fetchQuestionDetails();
    };

    async function handleAddComment() {
        if (!newComment.trim() || !id) return;

        try {
            setSubmitting(true);

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                Alert.alert('Error', 'You must be logged in to post a comment');
                return;
            }

            const { error } = await supabase
                .from('comments')
                .insert([
                    {
                        question_id: id,
                        content: newComment,
                        user_id: user.id
                    }
                ]);

            if (error) throw error;

            setNewComment('');
            await fetchComments();

            // Scroll to bottom after a short delay to ensure the list is updated
            setTimeout(() => {
                if (scrollViewRef.current) {
                    scrollViewRef.current.scrollToEnd({ animated: true });
                }
            }, 300);
        } catch (error: any) {
            console.error('Error adding comment:', error.message);
            Alert.alert('Error', 'Failed to post your comment. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString();
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
                <View className="flex-row items-center mt-6 mb-4">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="mr-4"
                    >
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-2xl text-white font-bold">Forum Post</Text>
                </View>

                {loading && !refreshing ? (
                    <ActivityIndicator size="large" color="#ffffff" className="mt-10" />
                ) : !question ? (
                    <View className="flex-1 justify-center items-center">
                        <Text className="text-white text-lg">Question not found</Text>
                    </View>
                ) : (
                    <View className="flex-1">
                        <ScrollView
                            ref={scrollViewRef}
                            className="flex-1"
                            contentContainerStyle={{ paddingBottom: 100 }}
                            refreshControl={
                                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                            }
                        >
                            {/* Question Card */}
                            <View className="bg-white/20 rounded-xl p-5 mb-6">
                                <Text className="text-white font-bold text-xl">{question.title}</Text>
                                <View className="flex-row justify-between items-center mt-2 mb-4">
                                    <Text className="text-white/80">
                                        By {question.profiles?.name || 'Anonymous'}
                                    </Text>
                                    <Text className="text-white/60 text-xs">
                                        {formatDate(question.created_at)}
                                    </Text>
                                </View>
                                <Text className="text-white leading-5 mt-2">{question.content}</Text>

                                {/* Question Reactions */}
                                <View className="flex-row mt-4">
                                    <TouchableOpacity
                                        className="flex-row items-center mr-4"
                                        onPress={() => handleReaction('question', question.id, 'like')}
                                    >
                                        <Ionicons
                                            name={question.user_reaction === 'like' ? "thumbs-up" : "thumbs-up-outline"}
                                            size={18}
                                            color={question.user_reaction === 'like' ? "#4caf50" : "white"}
                                        />
                                        <Text className="ml-1 text-white">{question.likes_count || 0}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        className="flex-row items-center"
                                        onPress={() => handleReaction('question', question.id, 'dislike')}
                                    >
                                        <Ionicons
                                            name={question.user_reaction === 'dislike' ? "thumbs-down" : "thumbs-down-outline"}
                                            size={18}
                                            color={question.user_reaction === 'dislike' ? "#f44336" : "white"}
                                        />
                                        <Text className="ml-1 text-white">{question.dislikes_count || 0}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Comments Section */}
                            <Text className="text-white font-bold text-lg mb-3">
                                Comments ({comments.length})
                            </Text>

                            {comments.length === 0 ? (
                                <View className="bg-white/10 rounded-xl p-5 items-center">
                                    <Text className="text-white/80">No comments yet. Be the first to comment!</Text>
                                </View>
                            ) : (
                                comments.map((comment) => (
                                    <View key={comment.id} className="bg-white/10 rounded-xl p-4 mb-3">
                                        <View className="flex-row justify-between items-center mb-2">
                                            <Text className="text-white font-semibold">
                                                {comment.profiles?.name || 'Anonymous'}
                                            </Text>
                                            <Text className="text-white/60 text-xs">
                                                {formatDate(comment.created_at)}
                                            </Text>
                                        </View>
                                        <Text className="text-white/90">{comment.content}</Text>

                                        {/* Comment Reactions */}
                                        <View className="flex-row mt-3">
                                            <TouchableOpacity
                                                className="flex-row items-center mr-4"
                                                onPress={() => handleReaction('comment', comment.id, 'like')}
                                            >
                                                <Ionicons
                                                    name={comment.user_reaction === 'like' ? "thumbs-up" : "thumbs-up-outline"}
                                                    size={16}
                                                    color={comment.user_reaction === 'like' ? "#4caf50" : "white"}
                                                />
                                                <Text className="ml-1 text-white/80 text-xs">{comment.likes_count || 0}</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                className="flex-row items-center"
                                                onPress={() => handleReaction('comment', comment.id, 'dislike')}
                                            >
                                                <Ionicons
                                                    name={comment.user_reaction === 'dislike' ? "thumbs-down" : "thumbs-down-outline"}
                                                    size={16}
                                                    color={comment.user_reaction === 'dislike' ? "#f44336" : "white"}
                                                />
                                                <Text className="ml-1 text-white/80 text-xs">{comment.dislikes_count || 0}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))
                            )}
                        </ScrollView>

                        {/* Add Comment Section */}
                        <View className="absolute bottom-6 left-0 right-0 px-6">
                            <View className="flex-row items-center bg-white/20 rounded-full px-4 py-2">
                                <TextInput
                                    className="flex-1 text-white px-2"
                                    placeholder="Write a comment..."
                                    placeholderTextColor="rgba(255,255,255,0.6)"
                                    value={newComment}
                                    onChangeText={setNewComment}
                                    multiline
                                />
                                <TouchableOpacity
                                    onPress={handleAddComment}
                                    disabled={!newComment.trim() || submitting}
                                    className={`rounded-full p-2 ${!newComment.trim() || submitting ? 'bg-gray-500/50' : 'bg-white'}`}
                                >
                                    <Ionicons
                                        name="send"
                                        size={18}
                                        color={!newComment.trim() || submitting ? "#ccc" : "#29374B"}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            </SafeAreaView>
        </LinearGradient>
    );
}