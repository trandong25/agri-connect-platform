import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useEffect, useState } from "react"
import {Alert,Image,ScrollView,StyleSheet,View} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import {ActivityIndicator,Button,Chip,Divider,Surface,Text} from "react-native-paper"

import type { ConsumerStackParamList } from "../../navigation/consumer/ConsumerNavigator"
import { getProductReviews } from "../../services/api/reviewService"
import { useAppDispatch, useAppSelector } from "../../store/hooks"
import { addItemToCart } from "../../store/slices/cartSlice"
import { fetchProductDetail } from "../../store/slices/productSlice"
import type { Review } from "../../types/review"
import {consumerColors,consumerStyles} from "./consumerStyles"

type Props = NativeStackScreenProps<
    ConsumerStackParamList,
    "ProductDetail"
>

export default function ProductDetailScreen({route}: Props) {
    const dispatch = useAppDispatch()
    const { isMutating } = useAppSelector(state => state.cart)

    const { productId, affiliateCode, kocName } = route.params

    const {
        selectedProduct: product,
        isDetailLoading,
        detailError
    } = useAppSelector(state => state.product)

    const [reviews, setReviews] = useState<Review[]>([])
    const [isReviewsLoading, setIsReviewsLoading] = useState(true)
    const [reviewsError, setReviewsError] = useState("")
    const [imageError, setImageError] = useState(false)

    const loadReviews = async () => {
        try {
            setIsReviewsLoading(true)
            setReviewsError("")

            const data = await getProductReviews(productId)
            setReviews(data)
        } catch {
            setReviewsError("Không thể tải đánh giá.")
        } finally {
            setIsReviewsLoading(false)
        }
    }

    useEffect(() => {
        setImageError(false)
        dispatch(fetchProductDetail(productId))
    }, [dispatch, productId])

    useEffect(() => {
        loadReviews()
    }, [productId])
    const handleAddToCart = async () => {
        if (!product) return

        try {
            await dispatch(
                addItemToCart({
                    product: product.id,
                    quantity: product.minimum_order_quantity,
                    affiliate_code: affiliateCode ?? null
                })
            ).unwrap()

            Alert.alert(
                "Đã thêm vào giỏ",
                `${product.name} đã được thêm vào giỏ hàng.`
            )
        } catch (error) {
            Alert.alert(
                "Không thể thêm vào giỏ",
                typeof error === "string"
                    ? error
                    : "Vui lòng thử lại."
            )
        }
    }

    if (isDetailLoading) {
        return (
            <View style={consumerStyles.center}>
                <ActivityIndicator color={consumerColors.primary} />
                <Text>Đang tải sản phẩm...</Text>
            </View>
        )
    }

    if (detailError || !product) {
        return (
            <View style={consumerStyles.center}>
                <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={48}
                    color={consumerColors.danger}
                />

                <Text style={consumerStyles.centerText}>
                    {detailError ?? "Không tìm thấy sản phẩm."}
                </Text>

                <Button
                    mode="contained"
                    buttonColor={consumerColors.primary}
                    onPress={() =>
                        dispatch(fetchProductDetail(productId))
                    }
                >
                    Thử lại
                </Button>
            </View>
        )
    }

    const primaryImage =
        product.images.find(image => image.is_primary)
        ?? product.images[0]

    const hasReviews =
        product.review_count > 0
        && product.average_rating !== null

    return (
        <View style={consumerStyles.screen}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
            >
                {primaryImage && !imageError ? (
                    <Image
                        source={{ uri: primaryImage.image }}
                        style={styles.productImage}
                        resizeMode="cover"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <MaterialCommunityIcons
                            name="image-outline"
                            size={76}
                            color={consumerColors.primary}
                        />
                    </View>
                )}

                {!!affiliateCode && (
                    <Surface elevation={0} style={styles.affiliateCard}>
                        <View style={styles.affiliateIcon}>
                            <MaterialCommunityIcons
                                name="account-star-outline"
                                size={23}
                                color={consumerColors.primary}
                            />
                        </View>

                        <View style={styles.flex}>
                            <Text style={consumerStyles.secondaryText}>
                                Được giới thiệu bởi
                            </Text>

                            <Text
                                variant="titleSmall"
                                style={consumerStyles.bold}
                            >
                                {kocName ?? "KOC/KOL AgriConnect"}
                            </Text>
                        </View>

                        <MaterialCommunityIcons
                            name="check-decagram"
                            size={22}
                            color={consumerColors.primary}
                        />
                    </Surface>
                )}

                <View style={styles.mainInfo}>
                    <View style={styles.statusRow}>
                        <Chip
                            compact
                            icon="check-circle-outline"
                            textStyle={{ color: consumerColors.primary }}
                            style={{
                                backgroundColor:
                                    consumerColors.primarySoft
                            }}
                        >
                            Đang bán
                        </Chip>
                    </View>

                    <Text
                        variant="headlineSmall"
                        style={styles.productName}
                    >
                        {product.name}
                    </Text>

                    <View style={styles.farmerRow}>
                        <MaterialCommunityIcons
                            name="storefront-outline"
                            size={18}
                            color={consumerColors.textSecondary}
                        />

                        <Text style={consumerStyles.secondaryText}>
                            {product.farmer_name}
                        </Text>
                    </View>

                    <View style={styles.ratingSummary}>
                        {hasReviews ? (
                            <>
                                <RatingStars
                                    rating={Number(product.average_rating)}
                                    size={20}
                                />

                                <Text
                                    variant="titleSmall"
                                    style={consumerStyles.bold}
                                >
                                    {Number(product.average_rating).toFixed(1)}
                                </Text>

                                <Text style={consumerStyles.secondaryText}>
                                    ({product.review_count} đánh giá)
                                </Text>
                            </>
                        ) : (
                            <>
                                <MaterialCommunityIcons
                                    name="star-outline"
                                    size={20}
                                    color={consumerColors.textSecondary}
                                />

                                <Text style={consumerStyles.secondaryText}>
                                    Chưa có đánh giá
                                </Text>
                            </>
                        )}
                    </View>

                    <View style={styles.priceRow}>
                        <Text
                            variant="headlineSmall"
                            style={styles.price}
                        >
                            {formatMoney(product.price)}
                        </Text>

                        <Text style={consumerStyles.secondaryText}>
                            /{product.unit_symbol}
                        </Text>
                    </View>
                </View>

                <Surface elevation={1} style={consumerStyles.section}>
                    <Text
                        variant="titleMedium"
                        style={consumerStyles.bold}
                    >
                        Thông tin sản phẩm
                    </Text>

                    <Divider />

                    <InfoRow
                        icon="map-marker-outline"
                        label="Xuất xứ"
                        value={product.origin || "Chưa cập nhật"}
                    />

                    <InfoRow
                        icon="package-variant"
                        label="Tồn kho"
                        value={`${formatQuantity(product.stock_quantity)} ${product.unit_symbol}`}
                    />

                    <InfoRow
                        icon="scale-balance"
                        label="Đặt tối thiểu"
                        value={`${formatQuantity(product.minimum_order_quantity)} ${product.unit_symbol}`}
                    />

                    <InfoRow
                        icon="calendar-outline"
                        label="Ngày thu hoạch"
                        value={
                            product.harvest_date
                                ? formatDate(product.harvest_date)
                                : "Chưa cập nhật"
                        }
                    />

                    <InfoRow
                        icon="calendar-clock-outline"
                        label="Hạn sử dụng"
                        value={
                            product.expiry_date
                                ? formatDate(product.expiry_date)
                                : "Chưa cập nhật"
                        }
                    />
                </Surface>

                <Surface elevation={1} style={consumerStyles.section}>
                    <Text
                        variant="titleMedium"
                        style={consumerStyles.bold}
                    >
                        Mô tả sản phẩm
                    </Text>

                    <Divider />

                    <Text style={styles.description}>
                        {product.description || "Sản phẩm chưa có mô tả."}
                    </Text>
                </Surface>

                <Surface elevation={1} style={consumerStyles.section}>
                    <View style={styles.reviewTitleRow}>
                        <View style={styles.reviewTitle}>
                            <MaterialCommunityIcons
                                name="star-outline"
                                size={22}
                                color={consumerColors.primary}
                            />

                            <Text
                                variant="titleMedium"
                                style={consumerStyles.bold}
                            >
                                Đánh giá từ người mua
                            </Text>
                        </View>

                        {product.review_count > 0 && (
                            <Chip compact>
                                {product.review_count}
                            </Chip>
                        )}
                    </View>

                    <Divider />

                    {isReviewsLoading ? (
                        <View style={styles.reviewLoading}>
                            <ActivityIndicator size="small" />

                            <Text style={consumerStyles.secondaryText}>
                                Đang tải đánh giá...
                            </Text>
                        </View>
                    ) : reviewsError ? (
                        <View style={styles.reviewEmpty}>
                            <MaterialCommunityIcons
                                name="alert-circle-outline"
                                size={34}
                                color={consumerColors.textSecondary}
                            />

                            <Text style={consumerStyles.secondaryText}>
                                {reviewsError}
                            </Text>

                            <Button
                                mode="text"
                                compact
                                onPress={loadReviews}
                            >
                                Thử lại
                            </Button>
                        </View>
                    ) : reviews.length === 0 ? (
                        <View style={styles.reviewEmpty}>
                            <MaterialCommunityIcons
                                name="comment-text-outline"
                                size={40}
                                color={consumerColors.textSecondary}
                            />

                            <Text
                                variant="titleSmall"
                                style={consumerStyles.bold}
                            >
                                Chưa có đánh giá
                            </Text>

                            <Text style={consumerStyles.centerText}>
                                Hãy là người đầu tiên chia sẻ trải nghiệm
                                về sản phẩm này.
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.reviewList}>
                            {reviews.map((review, index) => (
                                <View key={review.id}>
                                    <ReviewItem review={review} />

                                    {index < reviews.length - 1 && (
                                        <Divider />
                                    )}
                                </View>
                            ))}
                        </View>
                    )}
                </Surface>
            </ScrollView>

            <SafeAreaView edges={["bottom"]}>
                <Surface elevation={4} style={styles.bottomBar}>
                    <View style={styles.bottomPrice}>
                        <Text style={consumerStyles.secondaryText}>
                            Giá sản phẩm
                        </Text>

                        <Text
                            variant="titleMedium"
                            style={styles.bottomPriceText}
                        >
                            {formatMoney(product.price)}
                        </Text>
                    </View>

                    <Button
                        mode="contained"
                        icon="cart-plus"
                        buttonColor={consumerColors.primary}
                        style={styles.cartButton}
                        contentStyle={consumerStyles.buttonContent}
                        loading={isMutating}
                        disabled={isMutating}
                        onPress={handleAddToCart}
                    >
                        Thêm vào giỏ
                    </Button>
                </Surface>
            </SafeAreaView>
        </View>
    )
}

function ReviewItem({
    review
}: {
    review: Review
}) {
    return (
        <View style={styles.reviewItem}>
            <View style={styles.reviewerRow}>
                <View style={styles.avatar}>
                    <MaterialCommunityIcons
                        name="account-outline"
                        size={21}
                        color={consumerColors.primary}
                    />
                </View>

                <View style={styles.reviewerInfo}>
                    <Text
                        variant="titleSmall"
                        style={consumerStyles.bold}
                    >
                        {review.reviewer_name}
                    </Text>

                    <Text style={consumerStyles.secondaryText}>
                        {formatDate(review.created_date)}
                    </Text>
                </View>

                <View style={styles.reviewRating}>
                    <MaterialCommunityIcons
                        name="star"
                        size={17}
                        color="#F5A623"
                    />

                    <Text
                        variant="titleSmall"
                        style={consumerStyles.bold}
                    >
                        {review.rating}
                    </Text>
                </View>
            </View>

            <RatingStars rating={review.rating} size={18} />

            {!!review.comment ? (
                <Text style={styles.reviewComment}>
                    {review.comment}
                </Text>
            ) : (
                <Text style={consumerStyles.secondaryText}>
                    Người mua không để lại nhận xét.
                </Text>
            )}
        </View>
    )
}

function RatingStars({
    rating,
    size
}: {
    rating: number
    size: number
}) {
    return (
        <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map(star => {
                let icon:
                    keyof typeof MaterialCommunityIcons.glyphMap =
                    "star-outline"

                if (rating >= star) {
                    icon = "star"
                } else if (rating >= star - 0.5) {
                    icon = "star-half-full"
                }

                return (
                    <MaterialCommunityIcons
                        key={star}
                        name={icon}
                        size={size}
                        color="#F5A623"
                    />
                )
            })}
        </View>
    )
}

function InfoRow({
    icon,
    label,
    value
}: {
    icon: keyof typeof MaterialCommunityIcons.glyphMap
    label: string
    value: string
}) {
    return (
        <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
                <MaterialCommunityIcons
                    name={icon}
                    size={20}
                    color={consumerColors.primary}
                />
            </View>

            <View style={styles.infoText}>
                <Text style={consumerStyles.secondaryText}>
                    {label}
                </Text>

                <Text>{value}</Text>
            </View>
        </View>
    )
}

function formatMoney(value: string) {
    return `${Number(value).toLocaleString("vi-VN")} đ`
}

function formatQuantity(value: string) {
    return Number(value).toLocaleString("vi-VN", {
        maximumFractionDigits: 2
    })
}

function formatDate(value: string) {
    return new Date(value).toLocaleDateString("vi-VN")
}

const styles = StyleSheet.create({
    content: {
        padding: 16,
        gap: 16,
        paddingBottom: 24
    },
    flex: {
        flex: 1
    },
    productImage: {
        width: "100%",
        height: 300,
        borderRadius: 22
    },
    imagePlaceholder: {
        height: 300,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: consumerColors.primarySoft
    },
    affiliateCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 11,
        borderRadius: 17,
        padding: 13,
        backgroundColor: consumerColors.primarySoft
    },
    affiliateIcon: {
        width: 45,
        height: 45,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: consumerColors.surface
    },
    mainInfo: {
        gap: 10
    },
    statusRow: {
        flexDirection: "row"
    },
    productName: {
        color: consumerColors.text,
        fontWeight: "800"
    },
    farmerRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6
    },
    ratingSummary: {
        flexDirection: "row",
        alignItems: "center",
        gap: 7
    },
    stars: {
        flexDirection: "row",
        alignItems: "center",
        gap: 1
    },
    priceRow: {
        flexDirection: "row",
        alignItems: "baseline",
        gap: 4
    },
    price: {
        color: consumerColors.primary,
        fontWeight: "800"
    },
    description: {
        color: consumerColors.text,
        lineHeight: 22
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12
    },
    infoIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: consumerColors.primarySoft
    },
    infoText: {
        flex: 1,
        gap: 2
    },
    reviewTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8
    },
    reviewTitle: {
        flexDirection: "row",
        alignItems: "center",
        gap: 7
    },
    reviewLoading: {
        paddingVertical: 24,
        alignItems: "center",
        gap: 9
    },
    reviewEmpty: {
        paddingVertical: 22,
        alignItems: "center",
        gap: 8
    },
    reviewList: {
        gap: 14
    },
    reviewItem: {
        gap: 9,
        paddingVertical: 4
    },
    reviewerRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: consumerColors.primarySoft
    },
    reviewerInfo: {
        flex: 1,
        gap: 2
    },
    reviewRating: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3
    },
    reviewComment: {
        lineHeight: 21
    },
    bottomBar: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        backgroundColor: consumerColors.surface
    },
    bottomPrice: {
        flex: 1,
        gap: 2
    },
    bottomPriceText: {
        color: consumerColors.primary,
        fontWeight: "800"
    },
    cartButton: {
        minWidth: 150
    }
})