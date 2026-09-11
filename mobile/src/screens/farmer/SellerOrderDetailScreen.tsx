import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { useFocusEffect } from "@react-navigation/native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useCallback, useState } from "react"
import { Alert, ScrollView, StyleSheet, View } from "react-native"
import {
    ActivityIndicator,
    Button,
    Chip,
    Surface,
    Text,
    TextInput
} from "react-native-paper"

import type { FarmerStackParamList } from "../../navigation/farmer/FarmerNavigator"
import {
    getSellerOrderDetail,
    updateSellerOrderStatus
} from "../../services/api/sellerOrderService"
import type {
    FarmerSellerOrder,
    SellerOrderStatus
} from "../../types/order"
import { farmerColors } from "./farmerStyles"

type Props = NativeStackScreenProps<
    FarmerStackParamList,
    "SellerOrderDetail"
>

export default function SellerOrderDetailScreen({
    route
}: Props) {
    const { sellerOrderId } = route.params

    const [order, setOrder] = useState<FarmerSellerOrder | null>(null)
    const [note, setNote] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isUpdating, setIsUpdating] = useState(false)
    const [error, setError] = useState("")

    const loadOrder = async () => {
        try {
            setIsLoading(true)
            setError("")

            const data = await getSellerOrderDetail(sellerOrderId)
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
        }, [sellerOrderId])
    )

    const handleUpdateStatus = () => {
        if (!order) return

        const nextStatus = getNextStatus(order.status)
        if (!nextStatus) return

        Alert.alert(
            getActionLabel(order.status),
            getConfirmMessage(order.status),
            [
                {
                    text: "Hủy",
                    style: "cancel"
                },
                {
                    text: "Xác nhận",
                    onPress: async () => {
                        try {
                            setIsUpdating(true)

                            const updated = await updateSellerOrderStatus(
                                order.id,
                                {
                                    status: nextStatus,
                                    note: note.trim()
                                }
                            )

                            setOrder(updated)
                            setNote("")
                        } catch {
                            Alert.alert(
                                "Không thể cập nhật",
                                "Trạng thái đơn hàng chưa được thay đổi."
                            )
                        } finally {
                            setIsUpdating(false)
                        }
                    }
                }
            ]
        )
    }

    if (isLoading && !order) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={farmerColors.primary} />
                <Text>Đang tải đơn hàng...</Text>
            </View>
        )
    }

    if (error || !order) {
        return (
            <View style={styles.center}>
                <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={48}
                    color={farmerColors.danger}
                />

                <Text style={styles.centerText}>
                    {error || "Không tìm thấy đơn hàng."}
                </Text>

                <Button
                    mode="contained"
                    buttonColor={farmerColors.primary}
                    textColor="#FFFFFF"
                    onPress={loadOrder}
                >
                    Thử lại
                </Button>
            </View>
        )
    }

    const nextStatus = getNextStatus(order.status)

    return (
        <View style={styles.screen}>
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <Surface elevation={1} style={styles.section}>
                    <View style={styles.orderTop}>
                        <View style={styles.orderTitle}>
                            <Text variant="titleLarge" style={styles.bold}>
                                Đơn #{order.order_code.slice(0, 8)}
                            </Text>

                            <Text
                                variant="bodySmall"
                                style={styles.secondaryText}
                            >
                                {formatDateTime(order.created_date)}
                            </Text>
                        </View>

                        <StatusChip status={order.status} />
                    </View>

                    <View style={styles.totalBox}>
                        <Text style={styles.secondaryText}>
                            Tổng tiền
                        </Text>

                        <Text
                            variant="headlineSmall"
                            style={styles.totalAmount}
                        >
                            {formatMoney(order.total_amount)}
                        </Text>
                    </View>
                </Surface>

                <Surface elevation={1} style={styles.section}>
                    <SectionTitle
                        icon="map-marker-outline"
                        title="Thông tin nhận hàng"
                    />

                    <View style={styles.recipientRow}>
                        <View style={styles.sectionIcon}>
                            <MaterialCommunityIcons
                                name="account-outline"
                                size={24}
                                color={farmerColors.primary}
                            />
                        </View>

                        <View style={styles.recipientInfo}>
                            <Text variant="titleSmall" style={styles.bold}>
                                {order.recipient_name}
                            </Text>

                            <Text style={styles.secondaryText}>
                                {order.phone_number}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.addressBox}>
                        <Text style={styles.addressText}>
                            {order.address_detail}, {order.ward}, {order.province}
                        </Text>
                    </View>

                    {!!order.consumer_note && (
                        <View style={styles.customerNote}>
                            <MaterialCommunityIcons
                                name="message-text-outline"
                                size={19}
                                color={farmerColors.warning}
                            />

                            <View style={styles.customerNoteContent}>
                                <Text
                                    variant="bodySmall"
                                    style={styles.secondaryText}
                                >
                                    Ghi chú của khách
                                </Text>

                                <Text>{order.consumer_note}</Text>
                            </View>
                        </View>
                    )}
                </Surface>

                <Surface elevation={1} style={styles.section}>
                    <SectionTitle
                        icon="basket-outline"
                        title="Sản phẩm"
                    />

                    {order.items.map(item => (
                        <View key={item.id} style={styles.product}>
                            <View style={styles.productIcon}>
                                <MaterialCommunityIcons
                                    name="food-apple-outline"
                                    size={28}
                                    color={farmerColors.primary}
                                />
                            </View>

                            <View style={styles.productInfo}>
                                <Text
                                    variant="titleSmall"
                                    numberOfLines={2}
                                    style={styles.bold}
                                >
                                    {item.product_name}
                                </Text>

                                <Text
                                    variant="bodySmall"
                                    style={styles.secondaryText}
                                >
                                    {Number(item.quantity)} {item.unit_name}
                                    {" × "}
                                    {formatMoney(item.unit_price)}
                                </Text>
                            </View>

                            <Text variant="titleSmall" style={styles.bold}>
                                {formatMoney(item.subtotal)}
                            </Text>
                        </View>
                    ))}
                </Surface>

                <Surface elevation={1} style={styles.section}>
                    <SectionTitle
                        icon="timeline-clock-outline"
                        title="Trạng thái đơn hàng"
                    />

                    {order.status_logs.map((log, index) => (
                        <View key={log.id} style={styles.log}>
                            <View style={styles.logIndicator}>
                                <View style={styles.dot} />

                                {index < order.status_logs.length - 1 && (
                                    <View style={styles.logLine} />
                                )}
                            </View>

                            <View style={styles.logContent}>
                                <Text variant="bodyMedium" style={styles.bold}>
                                    {getStatusLabel(log.new_status)}
                                </Text>

                                <Text
                                    variant="bodySmall"
                                    style={styles.secondaryText}
                                >
                                    {formatDateTime(log.created_date)}
                                </Text>

                                {!!log.note && (
                                    <Text variant="bodySmall">
                                        {log.note}
                                    </Text>
                                )}
                            </View>
                        </View>
                    ))}
                </Surface>

                {nextStatus && (
                    <Surface elevation={1} style={styles.section}>
                        <SectionTitle
                            icon="clipboard-check-outline"
                            title="Xử lý đơn hàng"
                        />

                        <Text style={styles.secondaryText}>
                            {getActionDescription(order.status)}
                        </Text>

                        <TextInput
                            mode="outlined"
                            label="Ghi chú"
                            placeholder="Có thể bỏ trống"
                            value={note}
                            onChangeText={setNote}
                            multiline
                            numberOfLines={3}
                            outlineColor={farmerColors.border}
                            activeOutlineColor={farmerColors.primary}
                            style={styles.noteInput}
                        />

                        <Button
                            mode="contained"
                            icon={getActionIcon(order.status)}
                            buttonColor={farmerColors.primary}
                            textColor="#FFFFFF"
                            loading={isUpdating}
                            disabled={isUpdating}
                            contentStyle={styles.actionButton}
                            onPress={handleUpdateStatus}
                        >
                            {getActionLabel(order.status)}
                        </Button>
                    </Surface>
                )}

                {order.status === "COMPLETED" && (
                    <Surface elevation={0} style={styles.completed}>
                        <MaterialCommunityIcons
                            name="check-circle-outline"
                            size={32}
                            color={farmerColors.primary}
                        />

                        <View style={styles.completedContent}>
                            <Text variant="titleMedium" style={styles.bold}>
                                Đơn hàng đã hoàn thành
                            </Text>

                            <Text
                                variant="bodySmall"
                                style={styles.secondaryText}
                            >
                                Không cần thực hiện thêm thao tác.
                            </Text>
                        </View>
                    </Surface>
                )}
            </ScrollView>
        </View>
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
        <View style={styles.titleRow}>
            <MaterialCommunityIcons
                name={icon}
                size={22}
                color={farmerColors.primary}
            />

            <Text variant="titleMedium" style={styles.bold}>
                {title}
            </Text>
        </View>
    )
}

function StatusChip({
    status
}: {
    status: SellerOrderStatus
}) {
    const label = getStatusLabel(status)

    let backgroundColor = farmerColors.primarySoft
    let textColor = farmerColors.primary

    if (status === "PENDING") {
        backgroundColor = farmerColors.warningSoft
        textColor = farmerColors.warning
    }

    if (status === "COMPLETED") {
        backgroundColor = farmerColors.primarySoft
        textColor = farmerColors.primaryDark
    }

    return (
        <Chip
            compact
            style={{ backgroundColor }}
            textStyle={{ color: textColor }}
        >
            {label}
        </Chip>
    )
}

function getNextStatus(
    status: SellerOrderStatus
): Exclude<SellerOrderStatus, "PENDING"> | null {
    if (status === "PENDING") return "CONFIRMED"
    if (status === "CONFIRMED") return "SHIPPING"
    if (status === "SHIPPING") return "COMPLETED"

    return null
}

function getActionLabel(status: SellerOrderStatus) {
    if (status === "PENDING") return "Xác nhận đơn"
    if (status === "CONFIRMED") return "Bắt đầu giao hàng"
    if (status === "SHIPPING") return "Hoàn thành đơn"

    return ""
}

function getActionDescription(status: SellerOrderStatus) {
    if (status === "PENDING") {
        return "Xác nhận khi bạn đã kiểm tra và có thể chuẩn bị đơn hàng."
    }

    if (status === "CONFIRMED") {
        return "Cập nhật khi đơn hàng đã bắt đầu được giao cho khách."
    }

    if (status === "SHIPPING") {
        return "Chỉ hoàn thành khi đơn hàng đã được giao thành công."
    }

    return ""
}

function getConfirmMessage(status: SellerOrderStatus) {
    if (status === "PENDING") {
        return "Bạn xác nhận sẽ chuẩn bị đơn hàng này?"
    }

    if (status === "CONFIRMED") {
        return "Bạn xác nhận đơn hàng đã bắt đầu được giao?"
    }

    if (status === "SHIPPING") {
        return "Bạn xác nhận đơn hàng đã được giao thành công?"
    }

    return ""
}

function getActionIcon(
    status: SellerOrderStatus
): keyof typeof MaterialCommunityIcons.glyphMap {
    if (status === "PENDING") return "check-outline"
    if (status === "CONFIRMED") return "truck-delivery-outline"
    if (status === "SHIPPING") return "check-circle-outline"

    return "check"
}

function getStatusLabel(status: SellerOrderStatus) {
    const labels: Record<SellerOrderStatus, string> = {
        PENDING: "Chờ xác nhận",
        CONFIRMED: "Đã xác nhận",
        SHIPPING: "Đang giao hàng",
        COMPLETED: "Đã hoàn thành"
    }

    return labels[status]
}

function formatMoney(value: string | number) {
    return `${Number(value).toLocaleString("vi-VN")} đ`
}

function formatDateTime(value: string) {
    return new Date(value).toLocaleString("vi-VN")
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: farmerColors.background
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        gap: 12,
        backgroundColor: farmerColors.background
    },
    centerText: {
        textAlign: "center",
        color: farmerColors.textSecondary
    },
    content: {
        padding: 16,
        paddingBottom: 36,
        gap: 16
    },
    section: {
        padding: 16,
        borderRadius: 18,
        gap: 14,
        backgroundColor: farmerColors.surface
    },
    bold: {
        fontWeight: "700"
    },
    secondaryText: {
        color: farmerColors.textSecondary
    },
    orderTop: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12
    },
    orderTitle: {
        flex: 1,
        gap: 3
    },
    totalBox: {
        paddingTop: 14,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: farmerColors.border,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    },
    totalAmount: {
        color: farmerColors.primary,
        fontWeight: "800"
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8
    },
    recipientRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10
    },
    sectionIcon: {
        width: 42,
        height: 42,
        borderRadius: 13,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: farmerColors.primarySoft
    },
    recipientInfo: {
        flex: 1,
        gap: 2
    },
    addressBox: {
        padding: 12,
        borderRadius: 12,
        backgroundColor: farmerColors.background
    },
    addressText: {
        color: farmerColors.text,
        lineHeight: 20
    },
    customerNote: {
        padding: 12,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
        backgroundColor: farmerColors.warningSoft
    },
    customerNoteContent: {
        flex: 1,
        gap: 3
    },
    product: {
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
        backgroundColor: farmerColors.primarySoft
    },
    productInfo: {
        flex: 1,
        gap: 3
    },
    log: {
        flexDirection: "row",
        gap: 10
    },
    logIndicator: {
        width: 14,
        alignItems: "center"
    },
    dot: {
        width: 11,
        height: 11,
        borderRadius: 6,
        marginTop: 5,
        backgroundColor: farmerColors.primary
    },
    logLine: {
        width: 2,
        flex: 1,
        minHeight: 28,
        marginTop: 4,
        backgroundColor: farmerColors.border
    },
    logContent: {
        flex: 1,
        gap: 2,
        paddingBottom: 8
    },
    noteInput: {
        backgroundColor: farmerColors.surface
    },
    actionButton: {
        minHeight: 50
    },
    completed: {
        padding: 16,
        borderRadius: 18,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: farmerColors.primarySoft
    },
    completedContent: {
        flex: 1,
        gap: 3
    }
})