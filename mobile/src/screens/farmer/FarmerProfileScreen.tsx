import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs"
import type { CompositeNavigationProp } from "@react-navigation/native"
import { useFocusEffect } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useCallback, useState } from "react"
import {
    Alert,
    Image,
    ScrollView,
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

import ScreenHeader from "../../components/common/ScreenHeader"
import type { FarmerStackParamList } from "../../navigation/farmer/FarmerNavigator"
import type { FarmerTabParamList } from "../../navigation/farmer/FarmerTabNavigator"
import {
    type CurrentUser,
    type FarmerProfile,
    getCurrentFarmerProfile,
    getCurrentUser
} from "../../services/api/farmerProfileService"
import { useAppDispatch } from "../../store/hooks"
import { logout } from "../../store/slices/authSlice"
import {
    farmerColors,
    farmerStyles as styles
} from "./farmerStyles"

type Navigation = CompositeNavigationProp<
    BottomTabNavigationProp<FarmerTabParamList, "Profile">,
    NativeStackNavigationProp<FarmerStackParamList>
>

type Props = {
    navigation: Navigation
}

export default function FarmerProfileScreen({
    navigation
}: Props) {
    const dispatch = useAppDispatch()

    const [user, setUser] = useState<CurrentUser | null>(null)
    const [profile, setProfile] =
        useState<FarmerProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")
    const [imageError, setImageError] = useState(false)

    const loadProfile = async () => {
        try {
            setIsLoading(true)
            setError("")

            const [userData, profileData] = await Promise.all([
                getCurrentUser(),
                getCurrentFarmerProfile()
            ])

            setUser(userData)
            setProfile(profileData)
            setImageError(false)
        } catch {
            setError("Không thể tải thông tin tài khoản.")
        } finally {
            setIsLoading(false)
        }
    }

    useFocusEffect(
        useCallback(() => {
            loadProfile()
        }, [])
    )

    const handleLogout = () => {
        Alert.alert(
            "Đăng xuất",
            "Bạn có chắc chắn muốn đăng xuất?",
            [
                {
                    text: "Hủy",
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
            <SafeAreaView style={styles.screen} edges={["top"]}>
                <View style={styles.center}>
                    <ActivityIndicator color={farmerColors.primary} />
                    <Text>Đang tải tài khoản...</Text>
                </View>
            </SafeAreaView>
        )
    }

    if (error || !user || !profile) {
        return (
            <SafeAreaView style={styles.screen} edges={["top"]}>
                <View style={styles.center}>
                    <MaterialCommunityIcons
                        name="alert-circle-outline"
                        size={48}
                        color={farmerColors.danger}
                    />

                    <Text style={styles.centerText}>
                        {error || "Không tìm thấy thông tin tài khoản."}
                    </Text>

                    <Button
                        mode="contained"
                        buttonColor={farmerColors.primary}
                        onPress={loadProfile}
                    >
                        Thử lại
                    </Button>
                </View>
            </SafeAreaView>
        )
    }

    const fullName =
        [user.first_name, user.last_name]
            .filter(Boolean)
            .join(" ") || user.username

    return (
        <SafeAreaView style={styles.screen} edges={["top"]}>
            <ScreenHeader
                eyebrow="NÔNG DÂN"
                title="Tài khoản"
                subtitle="Thông tin cá nhân và nhà vườn của bạn."
                accentColor={farmerColors.primary}
                textColor={farmerColors.text}
                secondaryColor={farmerColors.textSecondary}
            />

            <ScrollView
                contentContainerStyle={styles.profileContent}
                showsVerticalScrollIndicator={false}
            >
                <Surface
                    elevation={1}
                    style={styles.profileHeaderCard}
                >
                    <View style={styles.profileAvatar}>
                        {user.avatar && !imageError ? (
                            <Image
                                source={{
                                    uri: user.avatar
                                }}
                                style={styles.profileAvatarImage}
                                resizeMode="cover"
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <MaterialCommunityIcons
                                name="account-outline"
                                size={45}
                                color={farmerColors.primary}
                            />
                        )}
                    </View>

                    <Text
                        variant="titleLarge"
                        style={styles.profileName}
                    >
                        {fullName}
                    </Text>

                    <Text
                        variant="bodyMedium"
                        style={styles.profileUsername}
                    >
                        @{user.username}
                    </Text>

                    <ApprovalBadge
                        status={profile.approval_status}
                    />
                </Surface>

                <Text
                    variant="titleMedium"
                    style={styles.profileSectionTitle}
                >
                    Thông tin cá nhân
                </Text>

                <Surface
                    elevation={1}
                    style={styles.profileCard}
                >
                    <ProfileRow
                        icon="email-outline"
                        label="Email"
                        value={user.email}
                    />

                    <Divider />

                    <ProfileRow
                        icon="phone-outline"
                        label="Số điện thoại"
                        value={
                            user.phone_number ||
                            "Chưa cập nhật"
                        }
                    />
                </Surface>

                <Text
                    variant="titleMedium"
                    style={styles.profileSectionTitle}
                >
                    Thông tin nhà vườn
                </Text>

                <Surface
                    elevation={1}
                    style={styles.profileCard}
                >
                    <ProfileRow
                        icon="sprout"
                        label="Tên nhà vườn"
                        value={
                            profile.farm_name ||
                            "Chưa cập nhật"
                        }
                    />

                    <Divider />

                    <ProfileRow
                        icon="map-marker-outline"
                        label="Địa chỉ"
                        value={
                            profile.address ||
                            "Chưa cập nhật"
                        }
                    />

                    <Divider />

                    <ProfileRow
                        icon="text-box-outline"
                        label="Mô tả"
                        value={
                            profile.description ||
                            "Chưa cập nhật"
                        }
                    />
                </Surface>

                <Button
                    mode="contained"
                    icon="pencil-outline"
                    buttonColor={farmerColors.primary}
                    textColor="#FFFFFF"
                    style={styles.profileEditButton}
                    contentStyle={styles.profileButtonContent}
                    onPress={() =>
                        navigation.navigate("FarmerProfileEdit")
                    }
                >
                    Chỉnh sửa thông tin
                </Button>

                <Button
                    mode="outlined"
                    icon="logout"
                    textColor={farmerColors.danger}
                    style={styles.profileLogout}
                    contentStyle={styles.profileButtonContent}
                    onPress={handleLogout}
                >
                    Đăng xuất
                </Button>
            </ScrollView>
        </SafeAreaView>
    )
}

function ProfileRow({
    icon,
    label,
    value
}: {
    icon: keyof typeof MaterialCommunityIcons.glyphMap
    label: string
    value: string
}) {
    return (
        <View style={styles.profileRow}>
            <View style={styles.profileRowIcon}>
                <MaterialCommunityIcons
                    name={icon}
                    size={21}
                    color={farmerColors.primary}
                />
            </View>

            <View style={styles.profileRowText}>
                <Text
                    variant="bodySmall"
                    style={{
                        color: farmerColors.textSecondary
                    }}
                >
                    {label}
                </Text>

                <Text
                    variant="bodyLarge"
                    style={styles.bold}
                >
                    {value}
                </Text>
            </View>
        </View>
    )
}

function ApprovalBadge({
    status
}: {
    status: FarmerProfile["approval_status"]
}) {
    let label = "Chờ duyệt"
    let icon = "clock-outline"
    let backgroundColor = farmerColors.warningSoft
    let color = farmerColors.warning

    if (status === "APPROVED") {
        label = "Đã được duyệt"
        icon = "check-circle-outline"
        backgroundColor = farmerColors.primarySoft
        color = farmerColors.primary
    } else if (status === "REJECTED") {
        label = "Bị từ chối"
        icon = "alert-circle-outline"
        backgroundColor = farmerColors.dangerSoft
        color = farmerColors.danger
    }

    return (
        <View
            style={[
                styles.profileStatus,
                {
                    backgroundColor
                }
            ]}
        >
            <MaterialCommunityIcons
                name={icon as any}
                size={17}
                color={color}
            />

            <Text
                variant="labelLarge"
                style={{
                    color
                }}
            >
                {label}
            </Text>
        </View>
    )
}