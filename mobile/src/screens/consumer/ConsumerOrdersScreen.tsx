import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import {
    useFocusEffect,
    useNavigation
} from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useCallback, useState } from "react"
import {
    FlatList,
    Pressable,
    StyleSheet,
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

import type { ConsumerStackParamList } from "../../navigation/consumer/ConsumerNavigator"
import { getOrders } from "../../services/api/orderService"
import type {
    Order,
    SellerOrderStatus
} from "../../types/order"
import {
    consumerColors,
    consumerStyles
} from "./consumerStyles"

export default function ConsumerOrdersScreen() {
    const navigation =
        useNavigation<
            NativeStackNavigationProp<ConsumerStackParamList>
        >()

    const [orders, setOrders] = useState<Order[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")

    const loadOrders = async () => {
        try {
            setIsLoading(true)
            setError("")

            const data = await getOrders()
            setOrders(data)
        } catch {
            setError("Không thể tải danh sách đơn hàng.")
        } finally {
            setIsLoading(false)
        }
    }

    useFocusEffect(
        useCallback(() => {
            loadOrders()
        }, [])
    )

    if (isLoading) {
        return (
            <SafeAreaView style={consumerStyles.safeArea} edges={["top"]}>
                <View style={consumerStyles.center}>
                    <ActivityIndicator color={consumerColors.primary} />
                    <Text>Đang tải đơn hàng...</Text>
                </View>
            </SafeAreaView>
        )
    }

    if (error) {
        return (
            <SafeAreaView style={consumerStyles.safeArea} edges={["top"]}>
                <View style={consumerStyles.center}>
                    <MaterialCommunityIcons
                        name="alert-circle-outline"
                        size={48}
                        color={consumerColors.danger}
                    />

                    <Text style={consumerStyles.centerText}>
                        {error}
                    </Text>

                    <Button
                        mode="contained"
                        buttonColor={consumerColors.primary}
                        onPress={loadOrders}
                    >
                        Thử lại
                    </Button>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={consumerStyles.safeArea} edges={["top"]}>
            <View style={consumerStyles.header}>
                <Text
                    variant="headlineSmall"
                    style={consumerStyles.headerTitle}
                >
                    Đơn hàng của tôi
                </Text>

                <Text style={consumerStyles.secondaryText}>
                    Theo dõi tình trạng các đơn đã đặt
                </Text>
            </View>

            <FlatList
                data={orders}
                keyExtractor={item => item.id.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <View style={consumerStyles.emptyIcon}>
                            <MaterialCommunityIcons
                                name="package-variant-closed"
                                size={56}
                                color={consumerColors.primary}
                            />
                        </View>

                        <Text
                            variant="titleLarge"
                            style={consumerStyles.bold}
                        >
                            Chưa có đơn hàng
                        </Text>

                        <Text style={consumerStyles.centerText}>
                            Những đơn bạn đặt sẽ xuất hiện tại đây.
                        </Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <OrderCard
                        order={item}
                        onPress={() =>
                            navigation.navigate("OrderDetail", {
                                orderId: item.id
                            })
                        }
                    />
                )}
            />
        </SafeAreaView>
    )
}

function OrderCard({
    order,
    onPress
}: {
    order: Order
    onPress: () => void
}) {
    const totalItems = order.seller_orders.reduce(
        (total, sellerOrder) =>
            total + sellerOrder.items.length,
        0
    )

    return (
        <Pressable onPress={onPress}>
            {({ pressed }) => (
                <Surface
                    elevation={1}
                    style={[
                        styles.orderCard,
                        pressed && styles.pressed
                    ]}
                >
                    <View style={styles.orderTop}>
                        <View style={styles.orderCode}>
                            <View style={styles.orderIcon}>
                                <MaterialCommunityIcons
                                    name="package-variant"
                                    size={24}
                                    color={consumerColors.primary}
                                />
                            </View>

                            <View style={styles.orderCodeText}>
                                <Text
                                    variant="titleMedium"
                                    style={consumerStyles.bold}
                                >
                                    Đơn #{order.code.slice(0, 8)}
                                </Text>

                                <Text style={consumerStyles.secondaryText}>
                                    {formatDateTime(order.created_date)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.orderRight}>
                            <PaymentChip order={order} />

                            <MaterialCommunityIcons
                                name="chevron-right"
                                size={22}
                                color={consumerColors.textSecondary}
                            />
                        </View>
                    </View>

                    <View style={styles.summary}>
                        <Text style={consumerStyles.secondaryText}>
                            {totalItems} sản phẩm
                            {" · "}
                            {order.seller_orders.length} nhà vườn
                        </Text>

                        <Text
                            variant="titleLarge"
                            style={styles.total}
                        >
                            {formatMoney(order.total_amount)}
                        </Text>
                    </View>

                    <View style={styles.sellerOrders}>
                        {order.seller_orders.map(
                            (sellerOrder, index) => (
                                <View
                                    key={sellerOrder.id}
                                    style={styles.sellerRow}
                                >
                                    <View style={styles.sellerInfo}>
                                        <MaterialCommunityIcons
                                            name="storefront-outline"
                                            size={18}
                                            color={consumerColors.textSecondary}
                                        />

                                        <Text
                                            variant="bodySmall"
                                            numberOfLines={1}
                                        >
                                            Nhà vườn {index + 1}
                                        </Text>
                                    </View>

                                    <StatusChip
                                        status={sellerOrder.status}
                                    />
                                </View>
                            )
                        )}
                    </View>
                </Surface>
            )}
        </Pressable>
    )
}

function StatusChip({
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

function PaymentChip({ order }: { order: Order }) {
    const payment = order.payment

    if (!payment) return null

    let label = "Chờ thanh toán"
    let icon: keyof typeof MaterialCommunityIcons.glyphMap =
        "clock-outline"

    if (
        payment.method === "COD"
        && payment.status === "PENDING"
    ) {
        label = "COD"
        icon = "cash"
    } else if (
        payment.method === "ONLINE"
        && payment.status === "PENDING"
    ) {
        label = "Chờ thanh toán"
        icon = "credit-card-clock-outline"
    } else if (payment.status === "PAID") {
        label = "Đã thanh toán"
        icon = "check-circle-outline"
    } else if (payment.status === "FAILED") {
        label = "Thanh toán thất bại"
        icon = "alert-circle-outline"
    }

    const failed = payment.status === "FAILED"

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

function formatMoney(value: string) {
    return `${Number(value).toLocaleString("vi-VN")} đ`
}

function formatDateTime(value: string) {
    return new Date(value).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    })
}

const styles = StyleSheet.create({
    list: {
        paddingHorizontal: 16,
        paddingBottom: 24,
        gap: 12
    },
    orderCard: {
        borderRadius: 18,
        padding: 16,
        gap: 14,
        backgroundColor: consumerColors.surface
    },
    pressed: {
        opacity: 0.8
    },
    orderTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8
    },
    orderCode: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 10
    },
    orderCodeText: {
        flex: 1,
        gap: 2
    },
    orderIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: consumerColors.primarySoft
    },
    orderRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4
    },
    summary: {
        gap: 4
    },
    total: {
        color: consumerColors.primary,
        fontWeight: "700"
    },
    sellerOrders: {
        gap: 8
    },
    sellerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8
    },
    sellerInfo: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 6
    },
    empty: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 80,
        paddingHorizontal: 32,
        gap: 10
    }
})