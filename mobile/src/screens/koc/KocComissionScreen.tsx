import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { useFocusEffect } from "@react-navigation/native"
import { useCallback, useMemo, useState } from "react"
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    View
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import {
    ActivityIndicator,
    Chip,
    Surface,
    Text
} from "react-native-paper"

import { getCommissions } from "../../services/api/commissionService"
import type {
    Commission,
    CommissionStatus
} from "../../types/commission"
import {
    kocColors,
    kocStyles
} from "./kocStyles"

type FilterStatus = "ALL" | CommissionStatus

export default function KocCommissionScreen() {
    const [commissions, setCommissions] = useState<Commission[]>([])
    const [filter, setFilter] = useState<FilterStatus>("ALL")
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [error, setError] = useState("")

    const loadCommissions = useCallback(async (refreshing = false) => {
        try {
            refreshing
                ? setIsRefreshing(true)
                : setIsLoading(true)

            setError("")

            const data = await getCommissions()
            setCommissions(data)
        } catch {
            setError("Không thể tải thông tin hoa hồng.")
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }, [])

    useFocusEffect(
        useCallback(() => {
            loadCommissions()
        }, [loadCommissions])
    )

    const summary = useMemo(() => {
        let total = 0
        let pending = 0
        let approved = 0
        let paid = 0

        commissions.forEach(commission => {
            const amount = Number(commission.amount)

            total += amount

            if (commission.status === "PENDING") {
                pending += amount
            } else if (commission.status === "APPROVED") {
                approved += amount
            } else if (commission.status === "PAID") {
                paid += amount
            }
        })

        return {
            total,
            pending,
            approved,
            paid
        }
    }, [commissions])

    const filteredCommissions = useMemo(() => {
        if (filter === "ALL") return commissions

        return commissions.filter(
            commission => commission.status === filter
        )
    }, [commissions, filter])

    if (isLoading) {
        return (
            <SafeAreaView style={kocStyles.safeArea} edges={["top"]}>
                <View style={kocStyles.center}>
                    <ActivityIndicator
                        size="large"
                        color={kocColors.primary}
                    />

                    <Text>Đang tải hoa hồng...</Text>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={kocStyles.safeArea} edges={["top"]}>
            <FlatList
                data={filteredCommissions}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={() => loadCommissions(true)}
                    />
                }
                ListHeaderComponent={
                    <View style={styles.header}>
                        <View style={kocStyles.header}>
                            <Text
                                variant="headlineSmall"
                                style={kocStyles.title}
                            >
                                Hoa hồng
                            </Text>

                            <Text style={kocStyles.secondaryText}>
                                Theo dõi thu nhập từ các đơn hàng bạn giới thiệu.
                            </Text>
                        </View>

                        <Surface elevation={0} style={styles.totalCard}>
                            <View style={styles.totalIcon}>
                                <MaterialCommunityIcons
                                    name="cash-multiple"
                                    size={30}
                                    color={kocColors.primary}
                                />
                            </View>

                            <View style={styles.flex}>
                                <Text style={styles.totalLabel}>
                                    Tổng hoa hồng
                                </Text>

                                <Text
                                    variant="headlineSmall"
                                    style={styles.totalValue}
                                >
                                    {formatMoney(summary.total)}
                                </Text>
                            </View>
                        </Surface>

                        <View style={styles.summaryGrid}>
                            <SummaryCard
                                icon="clock-outline"
                                label="Chờ ghi nhận"
                                value={summary.pending}
                            />

                            <SummaryCard
                                icon="check-circle-outline"
                                label="Đã ghi nhận"
                                value={summary.approved}
                            />

                            <SummaryCard
                                icon="wallet-outline"
                                label="Đã trả"
                                value={summary.paid}
                            />
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

                        <Text
                            variant="titleMedium"
                            style={kocStyles.bold}
                        >
                            Lịch sử hoa hồng
                        </Text>

                        <View style={styles.filters}>
                            <StatusFilter
                                label="Tất cả"
                                selected={filter === "ALL"}
                                onPress={() => setFilter("ALL")}
                            />

                            <StatusFilter
                                label="Chờ"
                                selected={filter === "PENDING"}
                                onPress={() => setFilter("PENDING")}
                            />

                            <StatusFilter
                                label="Đã ghi nhận"
                                selected={filter === "APPROVED"}
                                onPress={() => setFilter("APPROVED")}
                            />

                            <StatusFilter
                                label="Đã trả"
                                selected={filter === "PAID"}
                                onPress={() => setFilter("PAID")}
                            />
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    <View style={kocStyles.empty}>
                        <View style={kocStyles.emptyIcon}>
                            <MaterialCommunityIcons
                                name="cash-remove"
                                size={46}
                                color={kocColors.primary}
                            />
                        </View>

                        <Text
                            variant="titleMedium"
                            style={kocStyles.bold}
                        >
                            Chưa có hoa hồng
                        </Text>

                        <Text style={kocStyles.centerText}>
                            Hoa hồng sẽ xuất hiện khi đơn hàng từ nguồn giới thiệu
                            của bạn đủ điều kiện.
                        </Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <CommissionCard commission={item} />
                )}
            />
        </SafeAreaView>
    )
}

function SummaryCard({
    icon,
    label,
    value
}: {
    icon: keyof typeof MaterialCommunityIcons.glyphMap
    label: string
    value: number
}) {
    return (
        <Surface elevation={1} style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
                <MaterialCommunityIcons
                    name={icon}
                    size={21}
                    color={kocColors.primary}
                />
            </View>

            <Text
                style={kocStyles.secondaryText}
                numberOfLines={1}
            >
                {label}
            </Text>

            <Text
                variant="titleSmall"
                style={kocStyles.bold}
                numberOfLines={1}
            >
                {formatMoney(value)}
            </Text>
        </Surface>
    )
}

function StatusFilter({
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

function CommissionCard({
    commission
}: {
    commission: Commission
}) {
    const status = getCommissionStatus(commission.status)

    return (
        <Surface elevation={1} style={styles.commissionCard}>
            <View style={styles.commissionTop}>
                <View style={styles.productIcon}>
                    <MaterialCommunityIcons
                        name="sprout-outline"
                        size={24}
                        color={kocColors.primary}
                    />
                </View>

                <View style={styles.flex}>
                    <Text
                        variant="titleMedium"
                        style={kocStyles.bold}
                        numberOfLines={1}
                    >
                        {commission.product_name}
                    </Text>

                    <Text
                        style={kocStyles.secondaryText}
                        numberOfLines={1}
                    >
                        Đơn #{commission.order_code}
                    </Text>
                </View>

                <Chip compact icon={status.icon}>
                    {status.label}
                </Chip>
            </View>

            <View style={styles.commissionDetails}>
                <View>
                    <Text style={kocStyles.secondaryText}>
                        Tỷ lệ
                    </Text>

                    <Text
                        variant="titleSmall"
                        style={kocStyles.bold}
                    >
                        {formatRate(commission.rate)}
                    </Text>
                </View>

                <View style={styles.amount}>
                    <Text style={kocStyles.secondaryText}>
                        Hoa hồng
                    </Text>

                    <Text
                        variant="titleLarge"
                        style={styles.amountValue}
                    >
                        {formatMoney(Number(commission.amount))}
                    </Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.dateRow}>
                <MaterialCommunityIcons
                    name="calendar-outline"
                    size={16}
                    color={kocColors.textSecondary}
                />

                <Text style={kocStyles.secondaryText}>
                    Ghi nhận {formatDate(commission.created_date)}
                </Text>
            </View>

            {!!commission.paid_at && (
                <View style={styles.dateRow}>
                    <MaterialCommunityIcons
                        name="cash-check"
                        size={16}
                        color={kocColors.primary}
                    />

                    <Text style={styles.paidText}>
                        Thanh toán {formatDate(commission.paid_at)}
                    </Text>
                </View>
            )}
        </Surface>
    )
}

function getCommissionStatus(status: CommissionStatus) {
    if (status === "APPROVED") {
        return {
            label: "Đã ghi nhận",
            icon: "check-circle-outline"
        }
    }

    if (status === "PAID") {
        return {
            label: "Đã thanh toán",
            icon: "wallet-check-outline"
        }
    }

    return {
        label: "Chờ ghi nhận",
        icon: "clock-outline"
    }
}

function formatMoney(value: number) {
    return `${value.toLocaleString("vi-VN")} đ`
}

function formatRate(value: string) {
    return `${Number(value).toLocaleString("vi-VN", {
        maximumFractionDigits: 2
    })}%`
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
        gap: 11
    },
    header: {
        gap: 15,
        marginBottom: 3
    },
    totalCard: {
        minHeight: 112,
        borderRadius: 22,
        padding: 17,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        backgroundColor: kocColors.primary
    },
    totalIcon: {
        width: 58,
        height: 58,
        borderRadius: 19,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF"
    },
    totalLabel: {
        color: "#FFFFFF"
    },
    totalValue: {
        color: "#FFFFFF",
        fontWeight: "800"
    },
    summaryGrid: {
        flexDirection: "row",
        gap: 8
    },
    summaryCard: {
        flex: 1,
        borderRadius: 17,
        padding: 11,
        gap: 5,
        backgroundColor: kocColors.surface
    },
    summaryIcon: {
        width: 37,
        height: 37,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: kocColors.primarySoft
    },
    filters: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 7
    },
    errorText: {
        flex: 1,
        color: kocColors.danger
    },
    commissionCard: {
        padding: 15,
        borderRadius: 20,
        gap: 12,
        backgroundColor: kocColors.surface
    },
    commissionTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10
    },
    productIcon: {
        width: 46,
        height: 46,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: kocColors.primarySoft
    },
    commissionDetails: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between"
    },
    amount: {
        alignItems: "flex-end"
    },
    amountValue: {
        color: kocColors.primary,
        fontWeight: "800"
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: kocColors.border
    },
    dateRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5
    },
    paidText: {
        color: kocColors.primary
    }
})