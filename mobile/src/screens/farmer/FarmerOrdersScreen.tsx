import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import {
    useFocusEffect,
    useNavigation
} from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useCallback, useState } from "react"
import { FlatList, Pressable, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import {
    ActivityIndicator,
    Button,
    Chip,
    Surface,
    Text
} from "react-native-paper"

import ScreenHeader from "../../components/common/ScreenHeader"
import type { FarmerStackParamList } from "../../navigation/farmer/FarmerNavigator"
import { getSellerOrders } from "../../services/api/sellerOrderService"
import type {
    FarmerSellerOrder,
    SellerOrderStatus
} from "../../types/order"
import {
    farmerColors,
    farmerStyles as styles
} from "./farmerStyles"

export default function FarmerOrdersScreen() {
    const navigation =
        useNavigation<NativeStackNavigationProp<FarmerStackParamList>>()

    const [orders, setOrders] = useState<FarmerSellerOrder[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")

    const loadOrders = async () => {
        try {
            setIsLoading(true)
            setError("")

            const data = await getSellerOrders()
            setOrders(data)
        } catch {
            setError("Không thể tải đơn hàng.")
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
            <SafeAreaView style={styles.screen} edges={["top"]}>
                <View style={styles.center}>
                    <ActivityIndicator color={farmerColors.primary} />
                    <Text>Đang tải đơn hàng...</Text>
                </View>
            </SafeAreaView>
        )
    }

    if (error) {
        return (
            <SafeAreaView style={styles.screen} edges={["top"]}>
                <View style={styles.center}>
                    <MaterialCommunityIcons
                        name="alert-circle-outline"
                        size={48}
                        color={farmerColors.danger}
                    />

                    <Text style={styles.centerText}>
                        {error}
                    </Text>

                    <Button
                        mode="contained"
                        buttonColor={farmerColors.primary}
                        onPress={loadOrders}
                    >
                        Thử lại
                    </Button>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.screen} edges={["top"]}>
            <ScreenHeader
                eyebrow="NÔNG DÂN"
                title="Đơn hàng"
                subtitle="Theo dõi và xử lý đơn hàng của khách."
                accentColor={farmerColors.primary}
                textColor={farmerColors.text}
                secondaryColor={farmerColors.textSecondary}
            />

            <View style={styles.orderListCount}>
                <Text
                    variant="bodyMedium"
                    style={{
                        color: farmerColors.textSecondary
                    }}
                >
                    {orders.length} đơn hàng
                </Text>
            </View>

            <FlatList
                data={orders}
                keyExtractor={item => item.id.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.orderListContent}
                ListEmptyComponent={
                    <View style={styles.orderListEmpty}>
                        <View style={styles.orderListEmptyIcon}>
                            <MaterialCommunityIcons
                                name="clipboard-text-outline"
                                size={54}
                                color={farmerColors.primary}
                            />
                        </View>

                        <Text
                            variant="titleLarge"
                            style={styles.bold}
                        >
                            Chưa có đơn hàng
                        </Text>

                        <Text style={styles.centerText}>
                            Khi khách mua nông sản, đơn hàng sẽ xuất hiện tại đây.
                        </Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <OrderCard
                        order={item}
                        onPress={() =>
                            navigation.navigate(
                                "SellerOrderDetail",
                                {
                                    sellerOrderId: item.id
                                }
                            )
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
    order: FarmerSellerOrder
    onPress: () => void
}) {
    return (
        <Pressable onPress={onPress}>
            {({ pressed }) => (
                <Surface
                    elevation={1}
                    style={[
                        styles.orderListCard,
                        pressed && styles.pressed
                    ]}
                >
                    <View style={styles.orderListTop}>
                        <View style={styles.orderListTitleRow}>
                            <View style={styles.orderListIcon}>
                                <MaterialCommunityIcons
                                    name="package-variant-closed"
                                    size={24}
                                    color={farmerColors.primary}
                                />
                            </View>

                            <View style={styles.orderListTitle}>
                                <Text
                                    variant="titleMedium"
                                    style={styles.bold}
                                >
                                    Đơn #{order.order_code.slice(0, 8)}
                                </Text>

                                <Text
                                    variant="bodySmall"
                                    style={{
                                        color: farmerColors.textSecondary
                                    }}
                                >
                                    {new Date(
                                        order.created_date
                                    ).toLocaleString("vi-VN")}
                                </Text>
                            </View>
                        </View>

                        <MaterialCommunityIcons
                            name="chevron-right"
                            size={24}
                            color={farmerColors.textSecondary}
                        />
                    </View>

                    <View style={styles.orderListCustomer}>
                        <MaterialCommunityIcons
                            name="account-outline"
                            size={18}
                            color={farmerColors.textSecondary}
                        />

                        <Text variant="bodyMedium">
                            {order.recipient_name}
                        </Text>
                    </View>

                    <View style={styles.orderListSummary}>
                        <View>
                            <Text
                                variant="bodySmall"
                                style={{
                                    color: farmerColors.textSecondary
                                }}
                            >
                                Số sản phẩm
                            </Text>

                            <Text
                                variant="titleMedium"
                                style={styles.bold}
                            >
                                {order.items.length}
                            </Text>
                        </View>

                        <View style={styles.orderListAmount}>
                            <Text
                                variant="bodySmall"
                                style={{
                                    color: farmerColors.textSecondary
                                }}
                            >
                                Tổng tiền
                            </Text>

                            <Text
                                variant="titleLarge"
                                style={{
                                    color: farmerColors.primary,
                                    fontWeight: "700"
                                }}
                            >
                                {Number(
                                    order.total_amount
                                ).toLocaleString("vi-VN")} đ
                            </Text>
                        </View>
                    </View>

                    <StatusChip status={order.status} />
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

    const icons: Record<SellerOrderStatus, string> = {
        PENDING: "clock-outline",
        CONFIRMED: "check-circle-outline",
        SHIPPING: "truck-outline",
        COMPLETED: "check-all"
    }

    let backgroundColor = farmerColors.warningSoft
    let textColor = farmerColors.warning

    if (status === "CONFIRMED") {
        backgroundColor = farmerColors.primarySoft
        textColor = farmerColors.primary
    } else if (status === "SHIPPING") {
        backgroundColor = "#E7EFF8"
        textColor = "#35658F"
    } else if (status === "COMPLETED") {
        backgroundColor = farmerColors.primarySoft
        textColor = farmerColors.primaryDark
    }

    return (
        <View style={styles.orderListChipRow}>
            <Chip
                compact
                icon={icons[status]}
                style={{
                    backgroundColor
                }}
                textStyle={{
                    color: textColor
                }}
            >
                {labels[status]}
            </Chip>
        </View>
    )
}