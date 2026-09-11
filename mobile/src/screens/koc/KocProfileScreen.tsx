import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs"
import type { CompositeNavigationProp } from "@react-navigation/native"
import { useFocusEffect } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useCallback, useState } from "react"
import {
    Alert,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    View
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import {
    ActivityIndicator,
    Button,
    Divider,
    Surface,
    Text
} from "react-native-paper"

import type { KocStackParamList } from "../../navigation/koc/KocNavigator"
import type { KocTabParamList } from "../../navigation/koc/KocTabNavigator"
import {
    getCurrentKocProfile,
    getCurrentUser
} from "../../services/api/profileService"
import { useAppDispatch } from "../../store/hooks"
import { logout } from "../../store/slices/authSlice"
import type {
    ApprovalStatus,
    CurrentUser,
    KocProfile
} from "../../types/profile"
import {
    kocColors,
    kocStyles
} from "./kocStyles"

type Navigation = CompositeNavigationProp<
    BottomTabNavigationProp<KocTabParamList, "Profile">,
    NativeStackNavigationProp<KocStackParamList>
>

export default function KocProfileScreen({
    navigation
}: {
    navigation: Navigation
}) {
    const dispatch = useAppDispatch()

    const [user, setUser] = useState<CurrentUser | null>(null)
    const [profile, setProfile] = useState<KocProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [imageError, setImageError] = useState(false)
    const [error, setError] = useState("")

    const loadProfile = useCallback(async (refreshing = false) => {
        try {
            refreshing
                ? setIsRefreshing(true)
                : setIsLoading(true)

            setError("")

            const [userData, profileData] = await Promise.all([
                getCurrentUser(),
                getCurrentKocProfile()
            ])

            setUser(userData)
            setProfile(profileData)
            setImageError(false)
        } catch {
            setError("Không thể tải thông tin tài khoản.")
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }, [])

    useFocusEffect(
        useCallback(() => {
            loadProfile()
        }, [loadProfile])
    )

    const handleLogout = () => {
        Alert.alert(
            "Đăng xuất",
            "Bạn có chắc muốn đăng xuất khỏi AgriConnect?",
            [
                {
                    text: "Không",
                    style: "cancel"
                },
                {
                    text: "Đăng xuất",
                    style: "destructive",
                    onPress: () => dispatch(logout())
                }
            ]
        )
    }

    if (isLoading) {
        return (
            <SafeAreaView style={kocStyles.safeArea} edges={["top"]}>
                <View style={kocStyles.center}>
                    <ActivityIndicator
                        size="large"
                        color={kocColors.primary}
                    />

                    <Text>Đang tải hồ sơ...</Text>
                </View>
            </SafeAreaView>
        )
    }

    const approval = getApprovalDisplay(
        profile?.approval_status ?? "PENDING"
    )

    return (
        <SafeAreaView style={kocStyles.safeArea} edges={["top"]}>
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={() => loadProfile(true)}
                    />
                }
            >
                <View style={kocStyles.titleRow}>
                    <Text
                        variant="headlineSmall"
                        style={kocStyles.title}
                    >
                        Tài khoản
                    </Text>

                    <Button
                        mode="text"
                        compact
                        icon="pencil-outline"
                        onPress={() =>
                            navigation.navigate("KocProfileEdit")
                        }
                    >
                        Chỉnh sửa
                    </Button>
                </View>

                <Surface elevation={1} style={styles.profileCard}>
                    {user?.avatar && !imageError ? (
                        <Image
                            source={{ uri: user.avatar }}
                            style={styles.avatar}
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <MaterialCommunityIcons
                                name="account-star"
                                size={42}
                                color={kocColors.primary}
                            />
                        </View>
                    )}

                    <View style={styles.profileInfo}>
                        <Text
                            variant="titleLarge"
                            style={kocStyles.bold}
                        >
                            {profile?.koc_name
                                || user?.username
                                || "KOC/KOL"}
                        </Text>

                        <Text style={kocStyles.secondaryText}>
                            {user?.email}
                        </Text>

                        <View
                            style={[
                                styles.approvalBadge,
                                {
                                    backgroundColor:
                                        approval.backgroundColor
                                }
                            ]}
                        >
                            <MaterialCommunityIcons
                                name={approval.icon}
                                size={17}
                                color={approval.color}
                            />

                            <Text
                                style={{
                                    color: approval.color,
                                    fontWeight: "700"
                                }}
                            >
                                {approval.label}
                            </Text>
                        </View>
                    </View>
                </Surface>

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
                    style={styles.sectionTitle}
                >
                    Thông tin cá nhân
                </Text>

                <Surface elevation={0} style={styles.sectionCard}>
                    <InfoRow
                        icon="account-outline"
                        label="Họ và tên"
                        value={
                            getFullName(
                                user?.first_name,
                                user?.last_name
                            ) || "Chưa cập nhật"
                        }
                    />

                    <Divider />

                    <InfoRow
                        icon="account-circle-outline"
                        label="Tên đăng nhập"
                        value={user?.username || "Chưa cập nhật"}
                    />

                    <Divider />

                    <InfoRow
                        icon="email-outline"
                        label="Email"
                        value={user?.email || "Chưa cập nhật"}
                    />

                    <Divider />

                    <InfoRow
                        icon="phone-outline"
                        label="Số điện thoại"
                        value={user?.phone_number || "Chưa cập nhật"}
                    />
                </Surface>

                <Text
                    variant="titleMedium"
                    style={styles.sectionTitle}
                >
                    Hồ sơ KOC/KOL
                </Text>

                <Surface elevation={0} style={styles.sectionCard}>
                    <InfoRow
                        icon="account-star-outline"
                        label="Tên KOC/KOL"
                        value={profile?.koc_name || "Chưa cập nhật"}
                    />

                    <Divider />

                    <InfoRow
                        icon="web"
                        label="Nền tảng chính"
                        value={
                            profile?.social_platform
                            || "Chưa cập nhật"
                        }
                    />

                    <Divider />

                    <InfoRow
                        icon="link-variant"
                        label="Trang cá nhân"
                        value={
                            profile?.social_url
                            || "Chưa cập nhật"
                        }
                    />

                    <Divider />

                    <InfoRow
                        icon="account-group-outline"
                        label="Người theo dõi"
                        value={Number(
                            profile?.follower ?? 0
                        ).toLocaleString("vi-VN")}
                    />
                </Surface>

                <Surface elevation={0} style={styles.commissionInfo}>
                    <MaterialCommunityIcons
                        name="percent-outline"
                        size={28}
                        color={kocColors.primary}
                    />

                    <View style={styles.flex}>
                        <Text
                            variant="titleMedium"
                            style={kocStyles.bold}
                        >
                            Hoa hồng AgriConnect
                        </Text>

                        <Text style={kocStyles.secondaryText}>
                            Hoa hồng được ghi nhận từ đơn hàng có nguồn giới thiệu
                            của bạn.
                        </Text>
                    </View>
                </Surface>

                <Button
                    mode="outlined"
                    icon="logout"
                    textColor={kocColors.danger}
                    style={styles.logoutButton}
                    contentStyle={kocStyles.buttonContent}
                    onPress={handleLogout}
                >
                    Đăng xuất
                </Button>
            </ScrollView>
        </SafeAreaView>
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
                    size={21}
                    color={kocColors.primary}
                />
            </View>

            <View style={styles.flex}>
                <Text style={kocStyles.secondaryText}>
                    {label}
                </Text>

                <Text style={styles.infoValue}>
                    {value}
                </Text>
            </View>
        </View>
    )
}

function getApprovalDisplay(status: ApprovalStatus) {
    if (status === "APPROVED") {
        return {
            label: "KOC/KOL đã duyệt",
            icon: "check-decagram" as const,
            color: kocColors.primary,
            backgroundColor: kocColors.primarySoft
        }
    }

    if (status === "REJECTED") {
        return {
            label: "Hồ sơ bị từ chối",
            icon: "close-circle-outline" as const,
            color: kocColors.danger,
            backgroundColor: kocColors.dangerSoft
        }
    }

    return {
        label: "Đang chờ duyệt",
        icon: "clock-outline" as const,
        color: kocColors.warning,
        backgroundColor: kocColors.warningSoft
    }
}

function getFullName(
    firstName?: string,
    lastName?: string
) {
    return [lastName, firstName]
        .filter(Boolean)
        .join(" ")
        .trim()
}

const styles = StyleSheet.create({
    flex: {
        flex: 1
    },
    content: {
        padding: 16,
        paddingBottom: 38
    },
    profileCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderRadius: 22,
        gap: 14,
        marginTop: 16,
        backgroundColor: kocColors.surface
    },
    avatar: {
        width: 76,
        height: 76,
        borderRadius: 24
    },
    avatarPlaceholder: {
        width: 76,
        height: 76,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: kocColors.primarySoft
    },
    profileInfo: {
        flex: 1
    },
    approvalBadge: {
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 12,
        marginTop: 8
    },
    errorText: {
        flex: 1,
        color: kocColors.danger
    },
    sectionTitle: {
        fontWeight: "700",
        marginTop: 22,
        marginBottom: 9
    },
    sectionCard: {
        borderRadius: 19,
        paddingHorizontal: 14,
        backgroundColor: kocColors.surface
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 13
    },
    infoIcon: {
        width: 42,
        height: 42,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: kocColors.primarySoft
    },
    infoValue: {
        color: kocColors.text,
        fontWeight: "600",
        marginTop: 2
    },
    commissionInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 15,
        borderRadius: 18,
        marginTop: 22,
        backgroundColor: kocColors.primarySoft
    },
    logoutButton: {
        borderColor: kocColors.danger,
        borderRadius: 15,
        marginTop: 25
    }
})