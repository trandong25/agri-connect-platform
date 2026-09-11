import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs"
import type { CompositeNavigationProp } from "@react-navigation/native"
import {
    useFocusEffect,
    useNavigation
} from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useCallback, useMemo, useState } from "react"
import {
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    View
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import {
    ActivityIndicator,
    Button,
    Searchbar,
    Surface,
    Text
} from "react-native-paper"

import type { KocStackParamList } from "../../navigation/koc/KocNavigator"
import type { KocTabParamList } from "../../navigation/koc/KocTabNavigator"
import {
    createAffiliateLink,
    getAffiliateLinks
} from "../../services/api/affiliateService"
import { getProducts } from "../../services/api/productService"
import type { AffiliateLink } from "../../types/affiliate"
import type { Product } from "../../types/product"
import {
    kocColors,
    kocStyles
} from "./kocStyles"

type Navigation = CompositeNavigationProp<
    BottomTabNavigationProp<KocTabParamList, "Affiliate">,
    NativeStackNavigationProp<KocStackParamList>
>

export default function KocAffiliateScreen() {
    const navigation = useNavigation<Navigation>()

    const [products, setProducts] = useState<Product[]>([])
    const [links, setLinks] = useState<AffiliateLink[]>([])
    const [search, setSearch] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [creatingProductId, setCreatingProductId] =
        useState<number | null>(null)

    const [error, setError] = useState("")

    const loadData = useCallback(async (refreshing = false) => {
        try {
            refreshing
                ? setIsRefreshing(true)
                : setIsLoading(true)

            setError("")

            const [productData, affiliateData] = await Promise.all([
                getProducts(),
                getAffiliateLinks()
            ])

            setProducts(productData)
            setLinks(affiliateData)
        } catch {
            setError("Không thể tải danh sách sản phẩm.")
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }, [])

    useFocusEffect(
        useCallback(() => {
            loadData()
        }, [loadData])
    )

    const linkByProductId = useMemo(() => {
        const map = new Map<number, AffiliateLink>()

        links.forEach(link => {
            map.set(link.product, link)
        })

        return map
    }, [links])

    const filteredProducts = useMemo(() => {
        const keyword = search.trim().toLowerCase()

        if (!keyword) return products

        return products.filter(product =>
            product.name.toLowerCase().includes(keyword)
            || product.farmer_name.toLowerCase().includes(keyword)
        )
    }, [products, search])

    const openPostForm = (affiliateLinkId: number) => {
        navigation.navigate("PromotionPostForm", {
            affiliateLinkId
        })
    }

    const handlePromote = async (product: Product) => {
        try {
            setCreatingProductId(product.id)
            setError("")

            const affiliateLink =
                await createAffiliateLink(product.id)

            setLinks(current => {
                const exists = current.some(
                    item => item.id === affiliateLink.id
                )

                return exists
                    ? current
                    : [affiliateLink, ...current]
            })

            openPostForm(affiliateLink.id)
        } catch {
            setError("Không thể tạo mã quảng bá.")
        } finally {
            setCreatingProductId(null)
        }
    }

    if (isLoading) {
        return (
            <SafeAreaView style={kocStyles.safeArea} edges={["top"]}>
                <View style={kocStyles.center}>
                    <ActivityIndicator
                        size="large"
                        color={kocColors.primary}
                    />

                    <Text>Đang tải sản phẩm...</Text>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={kocStyles.safeArea} edges={["top"]}>
            <FlatList
                data={filteredProducts}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={() => loadData(true)}
                    />
                }
                ListHeaderComponent={
                    <View style={styles.header}>
                        <View style={kocStyles.header}>
                            <Text
                                variant="headlineSmall"
                                style={kocStyles.title}
                            >
                                Quảng bá sản phẩm
                            </Text>

                            <Text style={kocStyles.secondaryText}>
                                Chọn nông sản để tạo mã giới thiệu và bài quảng bá.
                            </Text>
                        </View>

                        <Surface elevation={0} style={styles.infoCard}>
                            <MaterialCommunityIcons
                                name="link-variant"
                                size={27}
                                color={kocColors.primary}
                            />

                            <View style={styles.flex}>
                                <Text
                                    variant="titleSmall"
                                    style={kocStyles.bold}
                                >
                                    Mã quảng bá
                                </Text>

                                <Text style={kocStyles.secondaryText}>
                                    Mỗi sản phẩm có một mã riêng để hệ thống
                                    ghi nhận nguồn giới thiệu của bạn.
                                </Text>
                            </View>
                        </Surface>

                        <Searchbar
                            placeholder="Tìm sản phẩm..."
                            value={search}
                            onChangeText={setSearch}
                            style={styles.search}
                        />

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

                        <Text
                            variant="titleLarge"
                            style={kocStyles.bold}
                        >
                            Sản phẩm đang bán
                        </Text>
                    </View>
                }
                ListEmptyComponent={
                    <View style={kocStyles.empty}>
                        <View style={kocStyles.emptyIcon}>
                            <MaterialCommunityIcons
                                name="magnify"
                                size={46}
                                color={kocColors.primary}
                            />
                        </View>

                        <Text
                            variant="titleMedium"
                            style={kocStyles.bold}
                        >
                            Không tìm thấy sản phẩm
                        </Text>
                    </View>
                }
                renderItem={({ item }) => {
                    const affiliateLink =
                        linkByProductId.get(item.id)

                    return (
                        <ProductCard
                            product={item}
                            affiliateLink={affiliateLink}
                            loading={
                                creatingProductId === item.id
                            }
                            onPromote={() =>
                                handlePromote(item)
                            }
                            onCreatePost={() => {
                                if (affiliateLink) {
                                    openPostForm(affiliateLink.id)
                                }
                            }}
                        />
                    )
                }}
            />
        </SafeAreaView>
    )
}

function ProductCard({
    product,
    affiliateLink,
    loading,
    onPromote,
    onCreatePost
}: {
    product: Product
    affiliateLink?: AffiliateLink
    loading: boolean
    onPromote: () => void
    onCreatePost: () => void
}) {
    const image =
        product.images.find(item => item.is_primary)
        ?? product.images[0]

    return (
        <Surface elevation={1} style={styles.productCard}>
            {image ? (
                <Image
                    source={{ uri: image.image }}
                    style={styles.productImage}
                    resizeMode="cover"
                />
            ) : (
                <View
                    style={[
                        styles.productImage,
                        styles.placeholder
                    ]}
                >
                    <MaterialCommunityIcons
                        name="food-apple-outline"
                        size={37}
                        color={kocColors.primary}
                    />
                </View>
            )}

            <View style={styles.productBody}>
                <View>
                    <Text
                        variant="titleMedium"
                        numberOfLines={2}
                        style={kocStyles.bold}
                    >
                        {product.name}
                    </Text>

                    <Text
                        numberOfLines={1}
                        style={kocStyles.secondaryText}
                    >
                        {product.farmer_name}
                    </Text>
                </View>

                <Text style={styles.price}>
                    {formatMoney(product.price)}
                    <Text style={kocStyles.secondaryText}>
                        /{product.unit_symbol}
                    </Text>
                </Text>

                {!affiliateLink ? (
                    <Button
                        mode="contained-tonal"
                        icon="bullhorn-outline"
                        loading={loading}
                        disabled={loading}
                        onPress={onPromote}
                    >
                        Quảng bá
                    </Button>
                ) : (
                    <View style={styles.linkActions}>
                        <View style={styles.createdRow}>
                            <MaterialCommunityIcons
                                name="check-circle"
                                size={17}
                                color={kocColors.primary}
                            />

                            <Text style={styles.createdText}>
                                Đã có mã quảng bá
                            </Text>
                        </View>

                        <Button
                            mode="contained"
                            icon="post-outline"
                            buttonColor={kocColors.primary}
                            onPress={onCreatePost}
                        >
                            Tạo bài viết
                        </Button>
                    </View>
                )}
            </View>
        </Surface>
    )
}

function formatMoney(value: string) {
    return `${Number(value).toLocaleString("vi-VN")} đ`
}

const styles = StyleSheet.create({
    flex: {
        flex: 1
    },
    content: {
        padding: 16,
        paddingBottom: 36,
        gap: 11
    },
    header: {
        gap: 14,
        marginBottom: 4
    },
    infoCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 14,
        borderRadius: 18,
        backgroundColor: kocColors.primarySoft
    },
    search: {
        borderRadius: 16,
        backgroundColor: kocColors.surface
    },
    errorText: {
        flex: 1,
        color: kocColors.danger
    },
    productCard: {
        flexDirection: "row",
        gap: 12,
        padding: 11,
        borderRadius: 18,
        backgroundColor: kocColors.surface
    },
    productImage: {
        width: 110,
        height: 125,
        borderRadius: 15
    },
    placeholder: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: kocColors.primarySoft
    },
    productBody: {
        flex: 1,
        gap: 7,
        justifyContent: "space-between"
    },
    price: {
        color: kocColors.primary,
        fontWeight: "700"
    },
    linkActions: {
        gap: 7
    },
    createdRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5
    },
    createdText: {
        color: kocColors.primary,
        fontWeight: "700"
    }
})