import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
    FlatList,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    View
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { VideoView, useVideoPlayer } from "expo-video"
import {
    ActivityIndicator,
    Button,
    Searchbar,
    Surface,
    Text
} from "react-native-paper"

import NotificationBell from "../../components/NotificationBell"
import ProductCard from "../../components/product/ProductCard"
import type { ConsumerStackParamList } from "../../navigation/consumer/ConsumerNavigator"
import { getPublicPromotionPosts } from "../../services/api/promotionPostService"
import { useAppDispatch, useAppSelector } from "../../store/hooks"
import { fetchProducts } from "../../store/slices/productSlice"
import type {
    PromotionPost,
    PromotionPostMedia
} from "../../types/promotionPost"
import {
    consumerColors,
    consumerStyles
} from "./consumerStyles"

type Navigation = NativeStackNavigationProp<ConsumerStackParamList>

export default function ConsumerHomeScreen() {
    const dispatch = useAppDispatch()
    const navigation = useNavigation<Navigation>()

    const { products, isLoading, error } = useAppSelector(state => state.product)

    const [promotionPosts, setPromotionPosts] = useState<PromotionPost[]>([])
    const [isPostsLoading, setIsPostsLoading] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [postsError, setPostsError] = useState("")
    const [search, setSearch] = useState("")

    const loadPosts = useCallback(async () => {
        try {
            setIsPostsLoading(true)
            setPostsError("")

            const data = await getPublicPromotionPosts()
            setPromotionPosts(data)
        } catch {
            setPostsError("Không thể tải bài giới thiệu.")
        } finally {
            setIsPostsLoading(false)
        }
    }, [])

    useEffect(() => {
        dispatch(fetchProducts())
        loadPosts()
    }, [dispatch, loadPosts])

    const handleRefresh = async () => {
        try {
            setIsRefreshing(true)

            await Promise.all([
                dispatch(fetchProducts()),
                loadPosts()
            ])
        } finally {
            setIsRefreshing(false)
        }
    }

    const filteredProducts = useMemo(() => {
        const keyword = search.trim().toLowerCase()

        if (!keyword) return products

        return products.filter(product =>
            product.name.toLowerCase().includes(keyword)
            || product.farmer_name.toLowerCase().includes(keyword)
            || product.origin.toLowerCase().includes(keyword)
        )
    }, [products, search])

    if (isLoading && products.length === 0) {
        return (
            <SafeAreaView style={consumerStyles.safeArea} edges={["top"]}>
                <View style={consumerStyles.center}>
                    <ActivityIndicator color={consumerColors.primary} />
                    <Text>Đang tải sản phẩm...</Text>
                </View>
            </SafeAreaView>
        )
    }

    if (error && products.length === 0) {
        return (
            <SafeAreaView style={consumerStyles.safeArea} edges={["top"]}>
                <View style={consumerStyles.center}>
                    <MaterialCommunityIcons
                        name="alert-circle-outline"
                        size={46}
                        color={consumerColors.danger}
                    />

                    <Text style={consumerStyles.centerText}>
                        {error}
                    </Text>

                    <Button
                        mode="contained"
                        buttonColor={consumerColors.primary}
                        onPress={() => {
                            dispatch(fetchProducts())
                            loadPosts()
                        }}
                    >
                        Thử lại
                    </Button>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={consumerStyles.safeArea} edges={["top"]}>
            <FlatList
                data={filteredProducts}
                numColumns={2}
                keyExtractor={item => item.id.toString()}
                columnWrapperStyle={styles.productRow}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                    />
                }
                ListHeaderComponent={
                    <View style={styles.header}>
                        <Surface elevation={0} style={styles.hero}>
                            <View style={styles.heroTop}>
                                <View style={styles.heroText}>
                                    <Text
                                        variant="headlineSmall"
                                        style={styles.heroTitle}
                                    >
                                        AgriConnect
                                    </Text>

                                    <Text style={styles.heroSubtitle}>
                                        Nông sản tươi từ nhà vườn
                                    </Text>
                                </View>

                                <View style={styles.notification}>
                                    <NotificationBell
                                        onPress={() =>
                                            navigation.navigate("Notification")
                                        }
                                    />
                                </View>
                            </View>

                            <View style={styles.heroBottom}>
                                <View style={styles.heroMessage}>
                                    <MaterialCommunityIcons
                                        name="leaf"
                                        size={18}
                                        color="#FFFFFF"
                                    />

                                    <Text
                                        variant="bodySmall"
                                        style={styles.heroSubtitle}
                                    >
                                        Mua trực tiếp từ người nông dân
                                    </Text>
                                </View>

                                <MaterialCommunityIcons
                                    name="sprout"
                                    size={42}
                                    color="#FFFFFF"
                                />
                            </View>
                        </Surface>

                        <Searchbar
                            placeholder="Tìm nông sản, nhà vườn..."
                            value={search}
                            onChangeText={setSearch}
                            elevation={1}
                            style={styles.search}
                        />

                        <PromotionSection
                            posts={promotionPosts}
                            isLoading={isPostsLoading}
                            error={postsError}
                            onProductPress={post =>
                                navigation.navigate("ProductDetail", {
                                    productId: post.product,
                                    affiliateCode: post.affiliate_code,
                                    kocName: post.koc_name
                                })
                            }
                        />

                        <View style={styles.sectionHeader}>
                            <View>
                                <Text
                                    variant="titleLarge"
                                    style={consumerStyles.bold}
                                >
                                    Nông sản
                                </Text>

                                <Text style={consumerStyles.secondaryText}>
                                    Sản phẩm đang được bán
                                </Text>
                            </View>

                            <Text style={styles.productCount}>
                                {filteredProducts.length} sản phẩm
                            </Text>
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <View style={styles.emptyIcon}>
                            <MaterialCommunityIcons
                                name="magnify"
                                size={40}
                                color={consumerColors.primary}
                            />
                        </View>

                        <Text
                            variant="titleMedium"
                            style={consumerStyles.bold}
                        >
                            Không tìm thấy sản phẩm
                        </Text>

                        <Text style={consumerStyles.centerText}>
                            Thử tìm với từ khóa khác.
                        </Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <View style={styles.productItem}>
                        <ProductCard
                            product={item}
                            onPress={() =>
                                navigation.navigate("ProductDetail", {
                                    productId: item.id
                                })
                            }
                        />
                    </View>
                )}
            />
        </SafeAreaView>
    )
}

function PromotionSection({
    posts,
    isLoading,
    error,
    onProductPress
}: {
    posts: PromotionPost[]
    isLoading: boolean
    error: string
    onProductPress: (post: PromotionPost) => void
}) {
    if (!isLoading && posts.length === 0 && !error) return null

    return (
        <View style={styles.promotionSection}>
            <View style={styles.sectionHeader}>
                <View>
                    <Text
                        variant="titleLarge"
                        style={consumerStyles.bold}
                    >
                        KOC giới thiệu
                    </Text>

                    <Text style={consumerStyles.secondaryText}>
                        Gợi ý sản phẩm từ cộng đồng
                    </Text>
                </View>

                <MaterialCommunityIcons
                    name="account-star-outline"
                    size={24}
                    color={consumerColors.primary}
                />
            </View>

            {isLoading && posts.length === 0 ? (
                <View style={styles.postLoading}>
                    <ActivityIndicator size="small" />

                    <Text style={consumerStyles.secondaryText}>
                        Đang tải bài giới thiệu...
                    </Text>
                </View>
            ) : error && posts.length === 0 ? (
                <Surface elevation={0} style={consumerStyles.warning}>
                    <Text style={{ color: consumerColors.danger }}>
                        {error}
                    </Text>
                </Surface>
            ) : (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.promotionList}
                >
                    {posts.map(post => (
                        <PromotionPostCard
                            key={post.id}
                            post={post}
                            onProductPress={() => onProductPress(post)}
                        />
                    ))}
                </ScrollView>
            )}
        </View>
    )
}

function PromotionPostCard({
    post,
    onProductPress
}: {
    post: PromotionPost
    onProductPress: () => void
}) {
    return (
        <Surface elevation={1} style={styles.postCard}>
            <View style={styles.postHeader}>
                <View style={styles.kocAvatar}>
                    <MaterialCommunityIcons
                        name="account-star-outline"
                        size={22}
                        color={consumerColors.primary}
                    />
                </View>

                <View style={styles.postHeaderText}>
                    <Text
                        variant="titleSmall"
                        style={consumerStyles.bold}
                        numberOfLines={1}
                    >
                        {post.koc_name}
                    </Text>

                    <Text style={consumerStyles.secondaryText}>
                        KOC/KOL
                    </Text>
                </View>

                <MaterialCommunityIcons
                    name="check-decagram"
                    size={19}
                    color={consumerColors.primary}
                />
            </View>

            {post.media.length > 0 ? (
                <PromotionMediaPreview media={post.media} />
            ) : (
                <View style={styles.postMediaPlaceholder}>
                    <MaterialCommunityIcons
                        name="sprout"
                        size={46}
                        color={consumerColors.primary}
                    />
                </View>
            )}

            <View style={styles.postBody}>
                <Text
                    variant="titleMedium"
                    style={consumerStyles.bold}
                    numberOfLines={1}
                >
                    {post.product_name}
                </Text>

                {!!post.content && (
                    <Text
                        variant="bodySmall"
                        numberOfLines={2}
                        style={styles.postContent}
                    >
                        {post.content}
                    </Text>
                )}

                <Button
                    mode="contained-tonal"
                    icon="basket-outline"
                    style={styles.viewProductButton}
                    onPress={onProductPress}
                >
                    Xem sản phẩm
                </Button>
            </View>
        </Surface>
    )
}

function PromotionMediaPreview({
    media
}: {
    media: PromotionPostMedia[]
}) {
    const sorted = [...media].sort(
        (first, second) => first.display_order - second.display_order
    )

    const first = sorted[0]

    if (first.media_type === "VIDEO") {
        return <PromotionVideo uri={first.file} />
    }

    return (
        <View style={styles.postMediaContainer}>
            <Image
                source={{ uri: first.file }}
                style={styles.postMedia}
                resizeMode="cover"
            />

            {sorted.length > 1 && (
                <View style={styles.mediaCount}>
                    <MaterialCommunityIcons
                        name="image-multiple"
                        size={14}
                        color="#FFFFFF"
                    />

                    <Text style={styles.mediaCountText}>
                        {sorted.length}
                    </Text>
                </View>
            )}
        </View>
    )
}

function PromotionVideo({ uri }: { uri: string }) {
    const player = useVideoPlayer(uri, player => {
        player.loop = false
    })

    return (
        <VideoView
            player={player}
            style={styles.postMedia}
            nativeControls
            contentFit="cover"
        />
    )
}

const styles = StyleSheet.create({
    list: {
        padding: 16,
        paddingBottom: 36
    },
    header: {
        gap: 18,
        marginBottom: 18
    },
    hero: {
        minHeight: 150,
        borderRadius: 22,
        padding: 18,
        gap: 18,
        backgroundColor: consumerColors.primary
    },
    heroTop: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12
    },
    heroText: {
        flex: 1,
        gap: 4
    },
    heroTitle: {
        color: "#FFFFFF",
        fontWeight: "800"
    },
    heroSubtitle: {
        color: "#FFFFFF"
    },
    notification: {
        alignItems: "center",
        justifyContent: "center"
    },
    heroBottom: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 12
    },
    heroMessage: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 6
    },
    search: {
        borderRadius: 16
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12
    },
    productCount: {
        color: consumerColors.primary,
        fontWeight: "600"
    },
    promotionSection: {
        gap: 12
    },
    promotionList: {
        gap: 12,
        paddingRight: 4
    },
    postCard: {
        width: 290,
        borderRadius: 18,
        overflow: "hidden",
        backgroundColor: consumerColors.surface
    },
    postHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 9,
        padding: 12
    },
    postHeaderText: {
        flex: 1
    },
    kocAvatar: {
        width: 40,
        height: 40,
        borderRadius: 13,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: consumerColors.primarySoft
    },
    postMediaContainer: {
        position: "relative"
    },
    postMedia: {
        width: "100%",
        height: 165
    },
    postMediaPlaceholder: {
        height: 165,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: consumerColors.primarySoft
    },
    mediaCount: {
        position: "absolute",
        top: 8,
        right: 8,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 5,
        backgroundColor: "rgba(0,0,0,0.6)"
    },
    mediaCountText: {
        color: "#FFFFFF"
    },
    postBody: {
        padding: 12,
        gap: 8
    },
    postContent: {
        color: consumerColors.textSecondary,
        lineHeight: 18
    },
    viewProductButton: {
        borderRadius: 12
    },
    postLoading: {
        height: 120,
        alignItems: "center",
        justifyContent: "center",
        gap: 8
    },
    productRow: {
        gap: 12
    },
    productItem: {
        flex: 1,
        marginBottom: 12
    },
    empty: {
        alignItems: "center",
        paddingVertical: 60,
        gap: 9
    },
    emptyIcon: {
        width: 76,
        height: 76,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: consumerColors.primarySoft
    }
})