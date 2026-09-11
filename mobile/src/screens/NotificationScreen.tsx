import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import {
    useFocusEffect,
    useNavigation
} from "@react-navigation/native"
import type {
    NavigationProp,
    NavigatorScreenParams
} from "@react-navigation/native"
import { useCallback, useState } from "react"
import {
    FlatList,
    Pressable,
    RefreshControl,
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

import type { KocTabParamList } from "../navigation/koc/KocTabNavigator"
import {
    getNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead
} from "../services/api/notificationService"
import { useAppSelector } from "../store/hooks"
import type {
    AppNotification,
    NotificationType
} from "../types/notification"

type NotificationNavigationParamList = {
    OrderDetail: {
        orderId: number
    }

    SellerOrderDetail: {
        sellerOrderId: number
    }

    KocTabs: NavigatorScreenParams<KocTabParamList>
}

type NotificationNavigation = NavigationProp<NotificationNavigationParamList>

type IconName = keyof typeof MaterialCommunityIcons.glyphMap

const colors = {
    primary: "#2F6B3B",
    primaryDark: "#24552E",
    primarySoft: "#E7F1E5",
    background: "#F7F8F4",
    surface: "#FFFFFF",
    text: "#20251F",
    textSecondary: "#70766D",
    border: "#E2E6DE",
    danger: "#C94A45",
    dangerSoft: "#FCE8E6"
}

export default function NotificationScreen() {
    const navigation = useNavigation<NotificationNavigation>()
    const user = useAppSelector(state => state.auth.user)

    const [notifications, setNotifications] = useState<AppNotification[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [isReadingAll, setIsReadingAll] = useState(false)
    const [showUnreadOnly, setShowUnreadOnly] = useState(false)
    const [error, setError] = useState("")

    const loadNotifications = useCallback(
        async (unreadOnly: boolean, refreshing = false) => {
            try {
                if (refreshing) {
                    setIsRefreshing(true)
                } else {
                    setIsLoading(true)
                }

                setError("")

                const data = await getNotifications(
                    unreadOnly ? false : undefined
                )

                setNotifications(data)
            } catch {
                setError("Không thể tải thông báo.")
            } finally {
                setIsLoading(false)
                setIsRefreshing(false)
            }
        },
        []
    )

    useFocusEffect(
        useCallback(() => {
            loadNotifications(showUnreadOnly)
        }, [loadNotifications, showUnreadOnly])
    )

    const openNotification = (notification: AppNotification) => {
        const data = notification.data

        if (notification.notification_type === "ORDER") {
            if (
                user?.role === "CONSUMER" &&
                typeof data.order_id === "number"
            ) {
                navigation.navigate("OrderDetail", {
                    orderId: data.order_id
                })
                return
            }

            if (
                user?.role === "FARMER" &&
                typeof data.seller_order_id === "number"
            ) {
                navigation.navigate("SellerOrderDetail", {
                    sellerOrderId: data.seller_order_id
                })
                return
            }
        }

        if (
            notification.notification_type === "COMMISSION" &&
            user?.role === "KOC"
        ) {
            navigation.navigate("KocTabs", {
                screen: "Commission"
            })
            return
        }

        if (
            notification.notification_type === "PAYMENT" &&
            user?.role === "CONSUMER" &&
            typeof data.order_id === "number"
        ) {
            navigation.navigate("OrderDetail", {
                orderId: data.order_id
            })
        }
    }

    const handleNotificationPress = async (
        notification: AppNotification
    ) => {
        if (!notification.is_read) {
            try {
                const updated = await markNotificationAsRead(
                    notification.id
                )

                if (showUnreadOnly) {
                    setNotifications(current =>
                        current.filter(item => item.id !== notification.id)
                    )
                } else {
                    setNotifications(current =>
                        current.map(item =>
                            item.id === notification.id ? updated : item
                        )
                    )
                }
            } catch {
                setError("Không thể đánh dấu thông báo đã đọc.")
            }
        }

        openNotification(notification)
    }

    const handleReadAll = async () => {
        try {
            setIsReadingAll(true)
            setError("")

            await markAllNotificationsAsRead()

            if (showUnreadOnly) {
                setNotifications([])
            } else {
                setNotifications(current =>
                    current.map(item => ({
                        ...item,
                        is_read: true
                    }))
                )
            }
        } catch {
            setError("Không thể đánh dấu tất cả thông báo đã đọc.")
        } finally {
            setIsReadingAll(false)
        }
    }

    const unreadCount = notifications.filter(
        item => !item.is_read
    ).length

    if (isLoading && notifications.length === 0) {
        return (
            <SafeAreaView style={styles.screen} edges={["top"]}>
                <View style={styles.center}>
                    <ActivityIndicator color={colors.primary} />

                    <Text style={styles.loadingText}>
                        Đang tải thông báo...
                    </Text>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.screen} edges={["top"]}>
            <FlatList
                data={notifications}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                        onRefresh={() =>
                            loadNotifications(showUnreadOnly, true)
                        }
                    />
                }
                ListHeaderComponent={
                    <View style={styles.header}>
                        <View style={styles.pageHeader}>
                            <Text
                                variant="labelLarge"
                                style={styles.eyebrow}
                            >
                                AGRICONNECT
                            </Text>

                            <Text
                                variant="headlineSmall"
                                style={styles.pageTitle}
                            >
                                Thông báo
                            </Text>

                            <Text
                                variant="bodyMedium"
                                style={styles.pageSubtitle}
                            >
                                Theo dõi các cập nhật quan trọng của bạn.
                            </Text>

                            <View style={styles.headerAccent} />
                        </View>

                        <Surface
                            elevation={0}
                            style={styles.summaryCard}
                        >
                            <View style={styles.summaryIcon}>
                                <MaterialCommunityIcons
                                    name="bell-outline"
                                    size={27}
                                    color={colors.primary}
                                />
                            </View>

                            <View style={styles.summaryText}>
                                <Text
                                    variant="titleMedium"
                                    style={styles.bold}
                                >
                                    Thông báo của bạn
                                </Text>

                                <Text
                                    variant="bodySmall"
                                    style={styles.summaryDescription}
                                >
                                    {unreadCount > 0
                                        ? `${unreadCount} thông báo chưa đọc`
                                        : "Bạn đã đọc tất cả thông báo"}
                                </Text>
                            </View>
                        </Surface>

                        <View style={styles.actionRow}>
                            <View style={styles.filters}>
                                <Chip
                                    selected={!showUnreadOnly}
                                    showSelectedCheck={false}
                                    selectedColor={colors.primary}
                                    style={[
                                        styles.filterChip,
                                        !showUnreadOnly &&
                                            styles.filterChipSelected
                                    ]}
                                    onPress={() =>
                                        setShowUnreadOnly(false)
                                    }
                                >
                                    Tất cả
                                </Chip>

                                <Chip
                                    selected={showUnreadOnly}
                                    showSelectedCheck={false}
                                    selectedColor={colors.primary}
                                    style={[
                                        styles.filterChip,
                                        showUnreadOnly &&
                                            styles.filterChipSelected
                                    ]}
                                    onPress={() =>
                                        setShowUnreadOnly(true)
                                    }
                                >
                                    Chưa đọc
                                </Chip>
                            </View>

                            <Button
                                mode="text"
                                compact
                                textColor={colors.primary}
                                loading={isReadingAll}
                                disabled={
                                    isReadingAll ||
                                    unreadCount === 0
                                }
                                onPress={handleReadAll}
                            >
                                Đọc tất cả
                            </Button>
                        </View>

                        {!!error && (
                            <Surface
                                elevation={0}
                                style={styles.errorBox}
                            >
                                <MaterialCommunityIcons
                                    name="alert-circle-outline"
                                    size={20}
                                    color={colors.danger}
                                />

                                <Text
                                    variant="bodySmall"
                                    style={styles.errorText}
                                >
                                    {error}
                                </Text>
                            </Surface>
                        )}
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <View style={styles.emptyIcon}>
                            <MaterialCommunityIcons
                                name={
                                    showUnreadOnly
                                        ? "check-all"
                                        : "bell-off-outline"
                                }
                                size={42}
                                color={colors.primary}
                            />
                        </View>

                        <Text
                            variant="titleMedium"
                            style={styles.bold}
                        >
                            {showUnreadOnly
                                ? "Không có thông báo chưa đọc"
                                : "Chưa có thông báo"}
                        </Text>

                        <Text
                            variant="bodyMedium"
                            style={styles.emptyText}
                        >
                            {showUnreadOnly
                                ? "Bạn đã xem tất cả thông báo."
                                : "Các cập nhật về đơn hàng, tài khoản và hoa hồng sẽ xuất hiện tại đây."}
                        </Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <NotificationItem
                        notification={item}
                        onPress={() =>
                            handleNotificationPress(item)
                        }
                    />
                )}
                ItemSeparatorComponent={() => (
                    <View style={styles.separator} />
                )}
            />
        </SafeAreaView>
    )
}

function NotificationItem({
    notification,
    onPress
}: {
    notification: AppNotification
    onPress: () => void
}) {
    const icon = getNotificationIcon(
        notification.notification_type
    )

    return (
        <Pressable onPress={onPress}>
            {({ pressed }) => (
                <Surface
                    elevation={notification.is_read ? 0 : 1}
                    style={[
                        styles.notificationCard,
                        !notification.is_read &&
                            styles.notificationUnread,
                        pressed && styles.pressed
                    ]}
                >
                    <View
                        style={[
                            styles.notificationIcon,
                            notification.is_read &&
                                styles.notificationIconRead
                        ]}
                    >
                        <MaterialCommunityIcons
                            name={icon}
                            size={23}
                            color={colors.primary}
                        />
                    </View>

                    <View style={styles.notificationContent}>
                        <View style={styles.notificationTitleRow}>
                            <Text
                                variant="titleSmall"
                                style={
                                    notification.is_read
                                        ? styles.notificationTitleRead
                                        : styles.bold
                                }
                            >
                                {notification.title}
                            </Text>

                            {!notification.is_read && (
                                <View style={styles.unreadDot} />
                            )}
                        </View>

                        <Text
                            variant="bodyMedium"
                            style={styles.notificationMessage}
                        >
                            {notification.message}
                        </Text>

                        <View style={styles.notificationFooter}>
                            <Text
                                variant="bodySmall"
                                style={styles.notificationDate}
                            >
                                {formatDateTime(
                                    notification.created_date
                                )}
                            </Text>

                            <Text
                                variant="labelSmall"
                                style={styles.notificationType}
                            >
                                {getTypeLabel(
                                    notification.notification_type
                                )}
                            </Text>
                        </View>
                    </View>
                </Surface>
            )}
        </Pressable>
    )
}

function getNotificationIcon(type: NotificationType): IconName {
    switch (type) {
        case "ORDER":
            return "package-variant-closed"

        case "PAYMENT":
            return "credit-card-outline"

        case "COMMISSION":
            return "cash-multiple"

        case "ACCOUNT":
            return "account-circle-outline"

        default:
            return "information-outline"
    }
}

function getTypeLabel(type: NotificationType) {
    const labels: Record<NotificationType, string> = {
        ACCOUNT: "Tài khoản",
        ORDER: "Đơn hàng",
        PAYMENT: "Thanh toán",
        COMMISSION: "Hoa hồng",
        SYSTEM: "Hệ thống"
    }

    return labels[type]
}

function formatDateTime(value: string) {
    return new Date(value).toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    })
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.background
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        gap: 12
    },
    loadingText: {
        color: colors.textSecondary
    },
    content: {
        paddingBottom: 32
    },
    header: {
        gap: 14,
        marginBottom: 14
    },
    pageHeader: {
        paddingHorizontal: 16,
        paddingTop: 14
    },
    eyebrow: {
        color: colors.primary,
        fontWeight: "700",
        marginBottom: 2
    },
    pageTitle: {
        color: colors.text,
        fontWeight: "800"
    },
    pageSubtitle: {
        color: colors.textSecondary,
        marginTop: 4
    },
    headerAccent: {
        width: 38,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.primary,
        marginTop: 10
    },
    summaryCard: {
        marginHorizontal: 16,
        borderRadius: 18,
        padding: 15,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: colors.primarySoft
    },
    summaryIcon: {
        width: 50,
        height: 50,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.surface
    },
    summaryText: {
        flex: 1,
        gap: 3
    },
    summaryDescription: {
        color: "#46634C"
    },
    actionRow: {
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8
    },
    filters: {
        flexDirection: "row",
        gap: 7
    },
    filterChip: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border
    },
    filterChipSelected: {
        backgroundColor: colors.primarySoft,
        borderColor: colors.primarySoft
    },
    errorBox: {
        marginHorizontal: 16,
        borderRadius: 12,
        padding: 11,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: colors.dangerSoft
    },
    errorText: {
        flex: 1,
        color: colors.danger
    },
    notificationCard: {
        marginHorizontal: 16,
        borderRadius: 18,
        padding: 14,
        flexDirection: "row",
        gap: 12,
        backgroundColor: colors.surface
    },
    notificationUnread: {
        backgroundColor: "#F0F7EE"
    },
    notificationIcon: {
        width: 46,
        height: 46,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.surface
    },
    notificationIconRead: {
        backgroundColor: "#F0F2EE"
    },
    notificationContent: {
        flex: 1,
        gap: 6
    },
    notificationTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8
    },
    notificationTitleRead: {
        color: colors.text
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.primary
    },
    notificationMessage: {
        color: colors.textSecondary,
        lineHeight: 20
    },
    notificationFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8
    },
    notificationDate: {
        color: colors.textSecondary
    },
    notificationType: {
        color: colors.primary,
        fontWeight: "700"
    },
    separator: {
        height: 10
    },
    empty: {
        paddingVertical: 70,
        paddingHorizontal: 30,
        alignItems: "center",
        gap: 10
    },
    emptyIcon: {
        width: 76,
        height: 76,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.primarySoft
    },
    emptyText: {
        color: colors.textSecondary,
        textAlign: "center",
        lineHeight: 20
    },
    pressed: {
        opacity: 0.75
    },
    bold: {
        fontWeight: "700"
    }
})