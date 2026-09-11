import {
    StyleSheet,
    View
} from "react-native"
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import {
    ActivityIndicator,
    Button,
    Surface,
    Text,
    useTheme
} from "react-native-paper"

import type {
    ApprovalStatus
} from "../types/profile"

type Props = {
    status: ApprovalStatus
    role: "FARMER" | "KOC"
    isRefreshing: boolean
    onRefresh: () => void
    onLogout: () => void
}

export default function ProfileApproval({
    status,
    role,
    isRefreshing,
    onRefresh,
    onLogout
}: Props) {
    const theme = useTheme()

    const isRejected =
        status === "REJECTED"

    return (
        <View
            style={[
                styles.screen,
                {
                    backgroundColor:
                        theme.colors.background
                }
            ]}
        >
            <Surface
                elevation={1}
                style={[
                    styles.card,
                    {
                        backgroundColor:
                            theme.colors.surface
                    }
                ]}
            >
                <View
                    style={[
                        styles.iconContainer,
                        {
                            backgroundColor:
                                isRejected
                                    ? theme.colors
                                        .errorContainer
                                    : theme.colors
                                        .primaryContainer
                        }
                    ]}
                >
                    <MaterialCommunityIcons
                        name={
                            isRejected
                                ? "alert-circle-outline"
                                : "clock-outline"
                        }
                        size={54}
                        color={
                            isRejected
                                ? theme.colors.error
                                : theme.colors.primary
                        }
                    />
                </View>

                <Text
                    variant="headlineSmall"
                    style={styles.title}
                >
                    {isRejected
                        ? "Hồ sơ chưa được duyệt"
                        : "Đang chờ xét duyệt"}
                </Text>

                <Text
                    variant="bodyMedium"
                    style={[
                        styles.description,
                        {
                            color:
                                theme.colors
                                    .onSurfaceVariant
                        }
                    ]}
                >
                    {isRejected
                        ? "Hồ sơ của bạn chưa được chấp thuận. Vui lòng kiểm tra lại thông tin."
                        : role === "FARMER"
                            ? "Hồ sơ nông dân đã được gửi. Bạn có thể sử dụng các chức năng dành cho nông dân sau khi được duyệt."
                            : "Hồ sơ KOC/KOL đã được gửi. Bạn có thể quảng bá sản phẩm sau khi được duyệt."}
                </Text>

                <View
                    style={[
                        styles.statusBadge,
                        {
                            backgroundColor:
                                isRejected
                                    ? theme.colors
                                        .errorContainer
                                    : theme.colors
                                        .primaryContainer
                        }
                    ]}
                >
                    <MaterialCommunityIcons
                        name={
                            isRejected
                                ? "close-circle-outline"
                                : "timer-sand"
                        }
                        size={20}
                        color={
                            isRejected
                                ? theme.colors.error
                                : theme.colors.primary
                        }
                    />

                    <Text
                        variant="labelLarge"
                        style={{
                            fontWeight: "700",
                            color:
                                isRejected
                                    ? theme.colors.error
                                    : theme.colors.primary
                        }}
                    >
                        {isRejected
                            ? "Từ chối"
                            : "Chờ duyệt"}
                    </Text>
                </View>

                <Button
                    mode="contained"
                    icon="refresh"
                    disabled={
                        isRefreshing
                    }
                    onPress={
                        onRefresh
                    }
                    contentStyle={
                        styles.buttonContent
                    }
                    style={
                        styles.button
                    }
                >
                    {isRefreshing
                        ? "Đang kiểm tra..."
                        : "Kiểm tra lại"}
                </Button>

                {isRefreshing && (
                    <ActivityIndicator
                        size="small"
                        style={{
                            marginTop: 12
                        }}
                    />
                )}
                <Button
                    mode="text"
                    icon="logout"
                    textColor={theme.colors.error}
                    style={styles.logoutButton}
                    onPress={onLogout}
                >
                    Đăng xuất
                </Button>
            </Surface>
        </View>
    )
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        justifyContent: "center",
        padding: 24
    },
    card: {
        borderRadius: 26,
        padding: 24,
        alignItems: "center"
    },
    iconContainer: {
        width: 108,
        height: 108,
        borderRadius: 36,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20
    },
    title: {
        fontWeight: "800",
        textAlign: "center"
    },
    description: {
        textAlign: "center",
        lineHeight: 21,
        marginTop: 10
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 9,
        marginTop: 20
    },
    button: {
        width: "100%",
        borderRadius: 15,
        marginTop: 24
    },
    buttonContent: {
        height: 50
    },
    logoutButton: {
        marginTop: 12
    }
})