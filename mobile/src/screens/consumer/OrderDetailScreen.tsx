import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { useFocusEffect } from "@react-navigation/native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useCallback, useState } from "react"
import {
    Alert,
    ScrollView,
    StyleSheet,
    View
} from "react-native"
import {
    ActivityIndicator,
    Button,
    Chip,
    Divider,
    Surface,
    Text
} from "react-native-paper"

import type { ConsumerStackParamList } from "../../navigation/consumer/ConsumerNavigator"
import { getOrderDetail } from "../../services/api/orderService"
import { simulatePayment } from "../../services/api/paymentService"
import type {
    Order,
    SellerOrder,
    SellerOrderStatus
} from "../../types/order"
import {
    consumerColors,
    consumerStyles
} from "./consumerStyles"

type Props = NativeStackScreenProps<
    ConsumerStackParamList,
    "OrderDetail"
>

export default function OrderDetailScreen({
    route,
    navigation
}: Props) {
    const { orderId } = route.params

    const [order, setOrder] = useState<Order | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isPaying, setIsPaying] = useState(false)
    const [error, setError] = useState("")

    const loadOrder = async () => {
        try {
            setIsLoading(true)
            setError("")

            const data = await getOrderDetail(orderId)
            setOrder(data)
        } catch {
            setError("Không thể tải chi tiết đơn hàng.")
        } finally {
            setIsLoading(false)
        }
    }

    useFocusEffect(
        useCallback(() => {
            loadOrder()
        }, [orderId])
    )

    const handlePayment = () => {
        if (!order?.payment) return

        Alert.alert(
            "Thanh toán trực tuyến",
            `Xác nhận thanh toán ${formatMoney(order.payment.amount)}?`,
            [
                {
                    text: "Hủy",
                    style: "cancel"
                },
                {
                    text: "Thanh toán",
                    onPress: async () => {
                        try {
                            setIsPaying(true)

                            await simulatePayment(
                                order.payment!.id,
                                "PAID"
                            )

                            await loadOrder()

                            Alert.alert(
                                "Thành công",
                                "Thanh toán mô phỏng đã hoàn tất."
                            )
                        } catch {
                            Alert.alert(
                                "Thanh toán thất bại",
                                "Không thể thực hiện thanh toán."
                            )
                        } finally {
                            setIsPaying(false)
                        }
                    }
                }
            ]
        )
    }

    if (isLoading && !order) {
        return (
            <View style={consumerStyles.center}>
                <ActivityIndicator color={consumerColors.primary} />
                <Text>Đang tải đơn hàng...</Text>
            </View>
        )
    }

    if (error || !order) {
        return (
            <View style={consumerStyles.center}>
                <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={48}
                    color={consumerColors.danger}
                />

                <Text style={consumerStyles.centerText}>
                    {error || "Không tìm thấy đơn hàng."}
                </Text>

                <Button
                    mode="contained"
                    buttonColor={consumerColors.primary}
                    onPress={loadOrder}
                >
                    Thử lại
                </Button>
            </View>
        )
    }

    return (
        <View style={consumerStyles.screen}>
            <ScrollView
                contentContainerStyle={consumerStyles.content}
                showsVerticalScrollIndicator={false}
            >
                <Surface elevation={1} style={consumerStyles.section}>
                    <View style={styles.orderHeaderTop}>
                        <View style={styles.orderIcon}>
                            <MaterialCommunityIcons
                                name="package-variant"
                                size={30}
                                color={consumerColors.primary}
                            />
                        </View>

                        <View style={styles.orderCode}>
                            <Text
                                variant="titleLarge"
                                style={consumerStyles.bold}
                            >
                                Đơn #{order.code.slice(0, 8)}
                            </Text>

                            <Text style={consumerStyles.secondaryText}>
                                {formatDateTime(order.created_date)}
                            </Text>
                        </View>
                    </View>

                    <Divider />

                    <View style={consumerStyles.summaryRow}>
                        <Text>Tổng thanh toán</Text>

                        <Text
                            variant="titleLarge"
                            style={styles.total}
                        >
                            {formatMoney(order.total_amount)}
                        </Text>
                    </View>
                </Surface>

                <Surface elevation={1} style={consumerStyles.section}>
                    <SectionTitle
                        icon="map-marker-outline"
                        title="Thông tin nhận hàng"
                    />

                    <View style={styles.recipient}>
                        <Text
                            variant="titleSmall"
                            style={consumerStyles.bold}
                        >
                            {order.recipient_name}
                        </Text>

                        <Text>{order.phone_number}</Text>

                        <Text style={consumerStyles.secondaryText}>
                            {order.address_detail},{" "}
                            {order.ward},{" "}
                            {order.province}
                        </Text>
                    </View>

                    {!!order.note && (
                        <View style={styles.note}>
                            <Text style={consumerStyles.secondaryText}>
                                Ghi chú
                            </Text>

                            <Text>{order.note}</Text>
                        </View>
                    )}
                </Surface>

                <PaymentSection
                    order={order}
                    isPaying={isPaying}
                    onPayment={handlePayment}
                />

                <View style={styles.sellerList}>
                    <Text
                        variant="titleLarge"
                        style={consumerStyles.bold}
                    >
                        Sản phẩm
                    </Text>

                    {order.seller_orders.map(
                        (sellerOrder, index) => (
                            <SellerOrderCard
                                key={sellerOrder.id}
                                sellerOrder={sellerOrder}
                                index={index}
                                onReview={(
                                    productId,
                                    orderItemId,
                                    productName,
                                    review
                                ) =>
                                    navigation.navigate(
                                        "ReviewForm",
                                        {
                                            productId,
                                            orderItemId,
                                            productName,
                                            review
                                        }
                                    )
                                }
                            />
                        )
                    )}
                </View>

                <Surface elevation={1} style={consumerStyles.section}>
                    <Text
                        variant="titleMedium"
                        style={consumerStyles.bold}
                    >
                        Chi tiết thanh toán
                    </Text>

                    <View style={consumerStyles.summaryRow}>
                        <Text>Tiền hàng</Text>
                        <Text>{formatMoney(order.subtotal)}</Text>
                    </View>

                    <View style={consumerStyles.summaryRow}>
                        <Text>Phí vận chuyển</Text>
                        <Text>{formatMoney(order.shipping_fee)}</Text>
                    </View>

                    <View style={consumerStyles.summaryRow}>
                        <Text>Giảm giá</Text>
                        <Text>
                            -{formatMoney(order.discount_amount)}
                        </Text>
                    </View>

                    <Divider />

                    <View style={consumerStyles.summaryRow}>
                        <Text
                            variant="titleMedium"
                            style={consumerStyles.bold}
                        >
                            Tổng cộng
                        </Text>

                        <Text
                            variant="titleLarge"
                            style={styles.total}
                        >
                            {formatMoney(order.total_amount)}
                        </Text>
                    </View>
                </Surface>
            </ScrollView>
        </View>
    )
}

function PaymentSection({
    order,
    isPaying,
    onPayment
}: {
    order: Order
    isPaying: boolean
    onPayment: () => void
}) {
    const payment = order.payment

    if (!payment) return null

    const isOnlinePending =
        payment.method === "ONLINE"
        && payment.status === "PENDING"

    return (
        <Surface elevation={1} style={consumerStyles.section}>
            <SectionTitle
                icon="credit-card-outline"
                title="Thanh toán"
            />

            <View style={consumerStyles.summaryRow}>
                <Text>Phương thức</Text>

                <Text style={styles.rightText}>
                    {payment.method === "COD"
                        ? "Thanh toán khi nhận hàng"
                        : "Thanh toán trực tuyến"}
                </Text>
            </View>

            <View style={consumerStyles.summaryRow}>
                <Text>Trạng thái</Text>

                <PaymentStatusChip
                    method={payment.method}
                    status={payment.status}
                />
            </View>

            {!!payment.transaction_code && (
                <View style={consumerStyles.summaryRow}>
                    <Text>Mã giao dịch</Text>

                    <Text style={styles.rightText}>
                        {payment.transaction_code}
                    </Text>
                </View>
            )}

            {!!payment.paid_at && (
                <View style={consumerStyles.summaryRow}>
                    <Text>Thanh toán lúc</Text>

                    <Text style={styles.rightText}>
                        {formatDateTime(payment.paid_at)}
                    </Text>
                </View>
            )}

            {isOnlinePending && (
                <Button
                    mode="contained"
                    icon="credit-card-check-outline"
                    buttonColor={consumerColors.primary}
                    loading={isPaying}
                    disabled={isPaying}
                    contentStyle={consumerStyles.buttonContent}
                    onPress={onPayment}
                >
                    Thanh toán trực tuyến
                </Button>
            )}
        </Surface>
    )
}

function PaymentStatusChip({
    method,
    status
}: {
    method: "COD" | "ONLINE"
    status: "PENDING" | "PAID" | "FAILED"
}) {
    let label = "Chờ thanh toán"
    let icon: keyof typeof MaterialCommunityIcons.glyphMap =
        "clock-outline"

    if (method === "COD" && status === "PENDING") {
        label = "Thanh toán khi nhận hàng"
        icon = "cash"
    } else if (status === "PAID") {
        label = "Đã thanh toán"
        icon = "check-circle-outline"
    } else if (status === "FAILED") {
        label = "Thất bại"
        icon = "alert-circle-outline"
    }

    const failed = status === "FAILED"

    return (
        <Chip
            compact
            icon={icon}
            textStyle={{
                color: failed
                    ? consumerColors.danger
                    : consumerColors.primary
            }}
            style={{
                backgroundColor: failed
                    ? consumerColors.dangerSoft
                    : consumerColors.primarySoft
            }}
        >
            {label}
        </Chip>
    )
}

function SellerOrderCard({
    sellerOrder,
    index,
    onReview
}: {
    sellerOrder: SellerOrder
    index: number
    onReview: (
        productId: number,
        orderItemId: number,
        productName: string,
        review: SellerOrder["items"][number]["review"]
    ) => void
}) {
    const canReview =
        sellerOrder.status === "COMPLETED"

    return (
        <Surface elevation={1} style={consumerStyles.section}>
            <View style={styles.sellerHeader}>
                <View>
                    <Text
                        variant="titleMedium"
                        style={consumerStyles.bold}
                    >
                        Nhà vườn {index + 1}
                    </Text>

                    <Text style={consumerStyles.secondaryText}>
                        Mã phần đơn #{sellerOrder.id}
                    </Text>
                </View>

                <OrderStatusChip status={sellerOrder.status} />
            </View>

            <Divider />

            {sellerOrder.items.map(item => {
                const review = item.review

                return (
                    <View
                        key={item.id}
                        style={styles.orderItemContainer}
                    >
                        <View style={styles.orderItem}>
                            <View style={styles.productIcon}>
                                <MaterialCommunityIcons
                                    name="food-apple-outline"
                                    size={28}
                                    color={consumerColors.primary}
                                />
                            </View>

                            <View style={styles.itemInfo}>
                                <Text
                                    variant="titleSmall"
                                    style={consumerStyles.bold}
                                    numberOfLines={2}
                                >
                                    {item.product_name}
                                </Text>

                                <Text style={consumerStyles.secondaryText}>
                                    {formatQuantity(item.quantity)}
                                    {" "}
                                    {item.unit_name}
                                    {" × "}
                                    {formatMoney(item.unit_price)}
                                </Text>
                            </View>

                            <Text
                                variant="titleSmall"
                                style={consumerStyles.bold}
                            >
                                {formatMoney(item.subtotal)}
                            </Text>
                        </View>

                        {review ? (
                            <View style={styles.reviewBox}>
                                <View style={styles.reviewHeader}>
                                    <RatingStars rating={review.rating} />

                                    <View style={styles.reviewStatus}>
                                        <MaterialCommunityIcons
                                            name="check-circle-outline"
                                            size={16}
                                            color={consumerColors.primary}
                                        />

                                        <Text style={styles.reviewStatusText}>
                                            Đã đánh giá
                                        </Text>
                                    </View>
                                </View>

                                {!!review.comment && (
                                    <Text style={styles.reviewComment}>
                                        {review.comment}
                                    </Text>
                                )}

                                <Text style={consumerStyles.secondaryText}>
                                    {formatDateTime(review.updated_date)}
                                </Text>

                                <Button
                                    mode="text"
                                    compact
                                    icon="pencil-outline"
                                    style={styles.editReviewButton}
                                    onPress={() =>
                                        onReview(
                                            item.product,
                                            item.id,
                                            item.product_name,
                                            review
                                        )
                                    }
                                >
                                    Sửa đánh giá
                                </Button>
                            </View>
                        ) : canReview ? (
                            <View style={styles.reviewAction}>
                                <View style={styles.reviewActionText}>
                                    <MaterialCommunityIcons
                                        name="star-outline"
                                        size={22}
                                        color={consumerColors.primary}
                                    />

                                    <View style={styles.reviewActionInfo}>
                                        <Text
                                            variant="titleSmall"
                                            style={consumerStyles.bold}
                                        >
                                            Bạn thấy sản phẩm thế nào?
                                        </Text>

                                        <Text style={consumerStyles.secondaryText}>
                                            Chia sẻ trải nghiệm của bạn.
                                        </Text>
                                    </View>
                                </View>

                                <Button
                                    mode="outlined"
                                    compact
                                    onPress={() =>
                                        onReview(
                                            item.product,
                                            item.id,
                                            item.product_name,
                                            null
                                        )
                                    }
                                >
                                    Đánh giá
                                </Button>
                            </View>
                        ) : (
                            <View style={styles.reviewLocked}>
                                <MaterialCommunityIcons
                                    name="lock-outline"
                                    size={15}
                                    color={consumerColors.textSecondary}
                                />

                                <Text style={consumerStyles.secondaryText}>
                                    Có thể đánh giá sau khi đơn hàng hoàn thành.
                                </Text>
                            </View>
                        )}
                    </View>
                )
            })}

            <Divider />

            <View style={consumerStyles.summaryRow}>
                <Text variant="titleSmall">
                    Tổng phần đơn
                </Text>

                <Text
                    variant="titleMedium"
                    style={styles.total}
                >
                    {formatMoney(sellerOrder.total_amount)}
                </Text>
            </View>

            <OrderTimeline sellerOrder={sellerOrder} />
        </Surface>
    )
}

function OrderTimeline({
    sellerOrder
}: {
    sellerOrder: SellerOrder
}) {
    const steps: {
        status: SellerOrderStatus
        label: string
    }[] = [
        {
            status: "PENDING",
            label: "Chờ xác nhận"
        },
        {
            status: "CONFIRMED",
            label: "Đã xác nhận"
        },
        {
            status: "SHIPPING",
            label: "Đang giao hàng"
        },
        {
            status: "COMPLETED",
            label: "Đã hoàn thành"
        }
    ]

    const statusOrder: SellerOrderStatus[] = [
        "PENDING",
        "CONFIRMED",
        "SHIPPING",
        "COMPLETED"
    ]

    const currentIndex =
        statusOrder.indexOf(sellerOrder.status)

    return (
        <View style={styles.timeline}>
            <Text
                variant="titleSmall"
                style={consumerStyles.bold}
            >
                Trạng thái đơn
            </Text>

            {steps.map((step, index) => {
                const completed = index <= currentIndex

                const log = sellerOrder.status_logs.find(
                    item => item.new_status === step.status
                )

                return (
                    <View
                        key={step.status}
                        style={styles.timelineRow}
                    >
                        <View style={styles.timelineIndicator}>
                            <View
                                style={[
                                    styles.timelineDot,
                                    {
                                        backgroundColor: completed
                                            ? consumerColors.primary
                                            : consumerColors.border
                                    }
                                ]}
                            />

                            {index < steps.length - 1 && (
                                <View
                                    style={[
                                        styles.timelineLine,
                                        {
                                            backgroundColor:
                                                index < currentIndex
                                                    ? consumerColors.primary
                                                    : consumerColors.border
                                        }
                                    ]}
                                />
                            )}
                        </View>

                        <View style={styles.timelineContent}>
                            <Text
                                style={
                                    completed
                                        ? consumerStyles.bold
                                        : consumerStyles.secondaryText
                                }
                            >
                                {step.label}
                            </Text>

                            {log && (
                                <Text style={consumerStyles.secondaryText}>
                                    {formatDateTime(log.created_date)}
                                </Text>
                            )}

                            {!!log?.note && (
                                <Text>{log.note}</Text>
                            )}
                        </View>
                    </View>
                )
            })}
        </View>
    )
}

function OrderStatusChip({
    status
}: {
    status: SellerOrderStatus
}) {
    const labels: Record<SellerOrderStatus, string> = {
        PENDING: "Chờ xác nhận",
        CONFIRMED: "Đã xác nhận",
        SHIPPING: "Đang giao",
        COMPLETED: "Hoàn thành"
    }

    let icon: keyof typeof MaterialCommunityIcons.glyphMap =
        "clock-outline"

    if (status === "CONFIRMED") {
        icon = "check-circle-outline"
    } else if (status === "SHIPPING") {
        icon = "truck-delivery-outline"
    } else if (status === "COMPLETED") {
        icon = "check-decagram-outline"
    }

    return (
        <Chip
            compact
            icon={icon}
            textStyle={{ color: consumerColors.primary }}
            style={{ backgroundColor: consumerColors.primarySoft }}
        >
            {labels[status]}
        </Chip>
    )
}

function SectionTitle({
    icon,
    title
}: {
    icon: keyof typeof MaterialCommunityIcons.glyphMap
    title: string
}) {
    return (
        <View style={consumerStyles.titleRow}>
            <MaterialCommunityIcons
                name={icon}
                size={22}
                color={consumerColors.primary}
            />

            <Text
                variant="titleMedium"
                style={consumerStyles.bold}
            >
                {title}
            </Text>
        </View>
    )
}

function RatingStars({
    rating
}: {
    rating: number
}) {
    return (
        <View style={styles.reviewStars}>
            {[1, 2, 3, 4, 5].map(star => (
                <MaterialCommunityIcons
                    key={star}
                    name={
                        star <= rating
                            ? "star"
                            : "star-outline"
                    }
                    size={18}
                    color="#F5A623"
                />
            ))}
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

function formatDateTime(value: string) {
    return new Date(value).toLocaleString("vi-VN")
}

const styles = StyleSheet.create({
    orderHeaderTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12
    },
    orderIcon: {
        width: 54,
        height: 54,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: consumerColors.primarySoft
    },
    orderCode: {
        flex: 1,
        gap: 3
    },
    total: {
        color: consumerColors.primary,
        fontWeight: "800"
    },
    rightText: {
        flex: 1,
        textAlign: "right"
    },
    recipient: {
        gap: 4
    },
    note: {
        padding: 12,
        borderRadius: 12,
        gap: 3,
        backgroundColor: consumerColors.background
    },
    sellerList: {
        gap: 12
    },
    sellerHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8
    },
    orderItemContainer: {
        gap: 10
    },
    orderItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10
    },
    productIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: consumerColors.primarySoft
    },
    itemInfo: {
        flex: 1,
        gap: 3
    },
    reviewBox: {
        borderRadius: 14,
        padding: 12,
        gap: 8,
        backgroundColor: consumerColors.primarySoft
    },
    reviewHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8
    },
    reviewStars: {
        flexDirection: "row",
        gap: 2
    },
    reviewStatus: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4
    },
    reviewStatusText: {
        color: consumerColors.primary
    },
    reviewComment: {
        lineHeight: 19
    },
    editReviewButton: {
        alignSelf: "flex-start",
        marginLeft: -8
    },
    reviewAction: {
        borderWidth: 1,
        borderColor: consumerColors.border,
        borderRadius: 14,
        padding: 11,
        gap: 10
    },
    reviewActionText: {
        flexDirection: "row",
        alignItems: "center",
        gap: 9
    },
    reviewActionInfo: {
        flex: 1,
        gap: 2
    },
    reviewLocked: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5
    },
    timeline: {
        gap: 10,
        marginTop: 4
    },
    timelineRow: {
        flexDirection: "row",
        gap: 12
    },
    timelineIndicator: {
        width: 14,
        alignItems: "center"
    },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginTop: 4
    },
    timelineLine: {
        width: 2,
        flex: 1,
        minHeight: 30,
        marginTop: 3
    },
    timelineContent: {
        flex: 1,
        gap: 2,
        paddingBottom: 6
    }
})