import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs"
import type { CompositeNavigationProp } from "@react-navigation/native"
import { useFocusEffect } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { VideoView, useVideoPlayer } from "expo-video"
import { useCallback, useMemo, useState } from "react"
import {
    Alert,
    FlatList,
    Image,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    useWindowDimensions,
    View
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import {
    ActivityIndicator,
    Button,
    Chip,
    Surface,
    Text
} from "react-native-paper"

import type { KocStackParamList } from "../../navigation/koc/KocNavigator"
import type { KocTabParamList } from "../../navigation/koc/KocTabNavigator"
import {
    deletePromotionPost,
    getMyPromotionPosts,
    updatePromotionPost
} from "../../services/api/promotionPostService"
import type {
    PromotionPost,
    PromotionPostMedia,
    PromotionPostStatus
} from "../../types/promotionPost"
import {
    kocColors,
    kocStyles
} from "./kocStyles"

type Navigation = CompositeNavigationProp<
    BottomTabNavigationProp<KocTabParamList, "Posts">,
    NativeStackNavigationProp<KocStackParamList>
>

type FilterStatus = "ALL" | PromotionPostStatus

export default function KocPostsScreen({
    navigation
}: {
    navigation: Navigation
}) {
    const [posts, setPosts] = useState<PromotionPost[]>([])
    const [filter, setFilter] = useState<FilterStatus>("ALL")
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [changingPostId, setChangingPostId] = useState<number | null>(null)
    const [deletingPostId, setDeletingPostId] = useState<number | null>(null)
    const [error, setError] = useState("")

    const loadPosts = useCallback(async (refreshing = false) => {
        try {
            refreshing
                ? setIsRefreshing(true)
                : setIsLoading(true)

            setError("")

            const data = await getMyPromotionPosts()
            setPosts(data)
        } catch {
            setError("Không thể tải danh sách bài quảng bá.")
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }, [])

    useFocusEffect(
        useCallback(() => {
            loadPosts()
        }, [loadPosts])
    )

    const filteredPosts = useMemo(() => {
        if (filter === "ALL") return posts

        return posts.filter(post => post.status === filter)
    }, [posts, filter])

    const counts = useMemo(() => ({
        ALL: posts.length,
        DRAFT: posts.filter(post => post.status === "DRAFT").length,
        PUBLISHED: posts.filter(post => post.status === "PUBLISHED").length,
        HIDDEN: posts.filter(post => post.status === "HIDDEN").length
    }), [posts])

    const handleChangeStatus = async (
        post: PromotionPost,
        status: PromotionPostStatus
    ) => {
        try {
            setChangingPostId(post.id)

            const updated = await updatePromotionPost(post.id, {
                status
            })

            setPosts(current =>
                current.map(item =>
                    item.id === updated.id
                        ? updated
                        : item
                )
            )
        } catch {
            Alert.alert(
                "Không thể cập nhật",
                "Vui lòng thử lại."
            )
        } finally {
            setChangingPostId(null)
        }
    }

    const handleDelete = async (postId: number) => {
        try {
            setDeletingPostId(postId)

            await deletePromotionPost(postId)

            setPosts(current =>
                current.filter(post => post.id !== postId)
            )
        } catch {
            Alert.alert(
                "Không thể xóa",
                "Vui lòng thử lại."
            )
        } finally {
            setDeletingPostId(null)
        }
    }

    const confirmDelete = (post: PromotionPost) => {
        Alert.alert(
            "Xóa bài quảng bá?",
            "Bài viết và hình ảnh/video của bài sẽ bị xóa.",
            [
                {
                    text: "Hủy",
                    style: "cancel"
                },
                {
                    text: "Xóa",
                    style: "destructive",
                    onPress: () => handleDelete(post.id)
                }
            ]
        )
    }

    if (isLoading) {
        return (
            <SafeAreaView style={kocStyles.safeArea} edges={["top"]}>
                <View style={kocStyles.center}>
                    <ActivityIndicator
                        size="large"
                        color={kocColors.primary}
                    />

                    <Text>Đang tải bài viết...</Text>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={kocStyles.safeArea} edges={["top"]}>
            <FlatList
                data={filteredPosts}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={() => loadPosts(true)}
                    />
                }
                ListHeaderComponent={
                    <View style={styles.header}>
                        <View style={kocStyles.titleRow}>
                            <View style={styles.flex}>
                                <Text
                                    variant="headlineSmall"
                                    style={kocStyles.title}
                                >
                                    Bài viết của tôi
                                </Text>

                                <Text style={kocStyles.secondaryText}>
                                    Quản lý nội dung quảng bá của bạn trên AgriConnect.
                                </Text>
                            </View>

                            <Button
                                mode="contained"
                                compact
                                icon="plus"
                                buttonColor={kocColors.primary}
                                onPress={() =>
                                    navigation.navigate("PromotionPostForm")
                                }
                            >
                                Tạo
                            </Button>
                        </View>

                        {!!error && (
                            <Surface
                                elevation={0}
                                style={kocStyles.errorCard}
                            >
                                <MaterialCommunityIcons
                                    name="alert-circle-outline"
                                    size={20}
                                    color={kocColors.danger}
                                />

                                <Text style={styles.errorText}>
                                    {error}
                                </Text>
                            </Surface>
                        )}

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.filters}
                        >
                            <FilterChip
                                label={`Tất cả (${counts.ALL})`}
                                selected={filter === "ALL"}
                                onPress={() => setFilter("ALL")}
                            />

                            <FilterChip
                                label={`Nháp (${counts.DRAFT})`}
                                selected={filter === "DRAFT"}
                                onPress={() => setFilter("DRAFT")}
                            />

                            <FilterChip
                                label={`Đã đăng (${counts.PUBLISHED})`}
                                selected={filter === "PUBLISHED"}
                                onPress={() => setFilter("PUBLISHED")}
                            />

                            <FilterChip
                                label={`Đã ẩn (${counts.HIDDEN})`}
                                selected={filter === "HIDDEN"}
                                onPress={() => setFilter("HIDDEN")}
                            />
                        </ScrollView>
                    </View>
                }
                ListEmptyComponent={
                    <View style={kocStyles.empty}>
                        <View style={kocStyles.emptyIcon}>
                            <MaterialCommunityIcons
                                name="post-outline"
                                size={46}
                                color={kocColors.primary}
                            />
                        </View>

                        <Text
                            variant="titleMedium"
                            style={kocStyles.bold}
                        >
                            Chưa có bài viết
                        </Text>

                        <Text style={kocStyles.centerText}>
                            Tạo bài quảng bá đầu tiên cho sản phẩm bạn đang giới thiệu.
                        </Text>

                        <Button
                            mode="contained"
                            icon="plus"
                            buttonColor={kocColors.primary}
                            onPress={() =>
                                navigation.navigate("PromotionPostForm")
                            }
                        >
                            Tạo bài quảng bá
                        </Button>
                    </View>
                }
                renderItem={({ item }) => (
                    <PostCard
                        post={item}
                        changing={changingPostId === item.id}
                        deleting={deletingPostId === item.id}
                        onEdit={() =>
                            navigation.navigate(
                                "PromotionPostForm",
                                { postId: item.id }
                            )
                        }
                        onChangeStatus={status =>
                            handleChangeStatus(item, status)
                        }
                        onDelete={() => confirmDelete(item)}
                    />
                )}
            />
        </SafeAreaView>
    )
}

function FilterChip({
    label,
    selected,
    onPress
}: {
    label: string
    selected: boolean
    onPress: () => void
}) {
    return (
        <Chip
            selected={selected}
            showSelectedCheck={false}
            onPress={onPress}
        >
            {label}
        </Chip>
    )
}

function PostCard({
    post,
    changing,
    deleting,
    onEdit,
    onChangeStatus,
    onDelete
}: {
    post: PromotionPost
    changing: boolean
    deleting: boolean
    onEdit: () => void
    onChangeStatus: (status: PromotionPostStatus) => void
    onDelete: () => void
}) {
    return (
        <Surface elevation={1} style={styles.postCard}>
            <View style={styles.postHeader}>
                <View style={styles.avatar}>
                    <MaterialCommunityIcons
                        name="account-star-outline"
                        size={24}
                        color={kocColors.primary}
                    />
                </View>

                <View style={styles.flex}>
                    <Text
                        variant="titleMedium"
                        style={kocStyles.bold}
                    >
                        {post.koc_name}
                    </Text>

                    <Text style={kocStyles.secondaryText}>
                        {formatDate(
                            post.published_at ?? post.created_date
                        )}
                    </Text>
                </View>

                <StatusBadge status={post.status} />
            </View>

            <View style={styles.productRow}>
                <MaterialCommunityIcons
                    name="sprout-outline"
                    size={20}
                    color={kocColors.primary}
                />

                <Text
                    variant="titleSmall"
                    style={styles.productName}
                    numberOfLines={1}
                >
                    {post.product_name}
                </Text>
            </View>

            {!!post.content && (
                <Text style={styles.contentText}>
                    {post.content}
                </Text>
            )}

            {post.media.length > 0 && (
                <PostMedia media={post.media} />
            )}

            <View style={styles.actions}>
                <Button
                    mode="outlined"
                    compact
                    icon="pencil-outline"
                    disabled={changing || deleting}
                    onPress={onEdit}
                >
                    Sửa
                </Button>

                {post.status === "PUBLISHED" ? (
                    <Button
                        mode="outlined"
                        compact
                        icon="eye-off-outline"
                        loading={changing}
                        disabled={changing || deleting}
                        onPress={() =>
                            onChangeStatus("HIDDEN")
                        }
                    >
                        Ẩn
                    </Button>
                ) : (
                    <Button
                        mode="contained-tonal"
                        compact
                        icon="send-outline"
                        loading={changing}
                        disabled={changing || deleting}
                        onPress={() =>
                            onChangeStatus("PUBLISHED")
                        }
                    >
                        Đăng
                    </Button>
                )}

                <Pressable
                    style={styles.deleteButton}
                    disabled={changing || deleting}
                    onPress={onDelete}
                >
                    {deleting ? (
                        <ActivityIndicator
                            size={17}
                            color={kocColors.danger}
                        />
                    ) : (
                        <MaterialCommunityIcons
                            name="delete-outline"
                            size={20}
                            color={kocColors.danger}
                        />
                    )}
                </Pressable>
            </View>
        </Surface>
    )
}

function StatusBadge({
    status
}: {
    status: PromotionPostStatus
}) {
    let text = "Bản nháp"
    let icon = "file-outline"

    if (status === "PUBLISHED") {
        text = "Đã đăng"
        icon = "check-circle-outline"
    } else if (status === "HIDDEN") {
        text = "Đã ẩn"
        icon = "eye-off-outline"
    }

    return (
        <Chip
            compact
            icon={icon}
            style={{
                backgroundColor: kocColors.primarySoft
            }}
        >
            {text}
        </Chip>
    )
}

function PostMedia({
    media
}: {
    media: PromotionPostMedia[]
}) {
    const sortedMedia = [...media].sort(
        (first, second) =>
            first.display_order - second.display_order
    )

    const video = sortedMedia.find(
        item => item.media_type === "VIDEO"
    )

    if (video) {
        return <PostVideo uri={video.file} />
    }

    return <PostImages media={sortedMedia} />
}

function PostImages({
    media
}: {
    media: PromotionPostMedia[]
}) {
    const { width } = useWindowDimensions()
    const imageWidth = Math.max(260, width - 64)

    if (media.length === 1) {
        return (
            <Image
                source={{ uri: media[0].file }}
                style={[
                    styles.singleImage,
                    { width: imageWidth }
                ]}
                resizeMode="cover"
            />
        )
    }

    return (
        <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.mediaScroll}
        >
            {media.map((item, index) => (
                <View
                    key={item.id}
                    style={{ width: imageWidth }}
                >
                    <Image
                        source={{ uri: item.file }}
                        style={styles.carouselImage}
                        resizeMode="cover"
                    />

                    <View style={styles.imageCounter}>
                        <Text style={styles.imageCounterText}>
                            {index + 1}/{media.length}
                        </Text>
                    </View>
                </View>
            ))}
        </ScrollView>
    )
}

function PostVideo({ uri }: { uri: string }) {
    const player = useVideoPlayer(uri, player => {
        player.loop = false
    })

    return (
        <VideoView
            player={player}
            style={styles.video}
            nativeControls
            contentFit="cover"
            surfaceType="textureView"
        />
    )
}

function formatDate(value: string) {
    return new Date(value).toLocaleString("vi-VN")
}

const styles = StyleSheet.create({
    flex: {
        flex: 1
    },
    content: {
        padding: 16,
        paddingBottom: 36,
        gap: 12
    },
    header: {
        gap: 15,
        marginBottom: 3
    },
    filters: {
        gap: 7,
        paddingRight: 8
    },
    errorText: {
        flex: 1,
        color: kocColors.danger
    },
    postCard: {
        borderRadius: 20,
        padding: 14,
        gap: 13,
        overflow: "hidden",
        backgroundColor: kocColors.surface
    },
    postHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10
    },
    avatar: {
        width: 45,
        height: 45,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: kocColors.primarySoft
    },
    productRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        borderRadius: 13,
        paddingHorizontal: 11,
        paddingVertical: 9,
        backgroundColor: kocColors.primarySoft
    },
    productName: {
        flex: 1,
        color: kocColors.primaryDark,
        fontWeight: "700"
    },
    contentText: {
        color: kocColors.text,
        lineHeight: 21
    },
    mediaScroll: {
        borderRadius: 17,
        overflow: "hidden"
    },
    singleImage: {
        height: 235,
        borderRadius: 17,
        alignSelf: "center"
    },
    carouselImage: {
        width: "100%",
        height: 235,
        borderRadius: 17
    },
    imageCounter: {
        position: "absolute",
        right: 10,
        top: 10,
        borderRadius: 11,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: "rgba(0,0,0,0.58)"
    },
    imageCounterText: {
        color: "#FFFFFF"
    },
    video: {
        width: "100%",
        height: 230,
        borderRadius: 17
    },
    actions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8
    },
    deleteButton: {
        width: 42,
        height: 38,
        borderWidth: 1,
        borderColor: kocColors.danger,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: "auto"
    }
})