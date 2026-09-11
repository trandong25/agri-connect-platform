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
import type { ConsumerStackParamList } from "../../navigation/consumer/ConsumerNavigator"
import type { ConsumerTabParamList } from "../../navigation/consumer/ConsumerTabNavigator"
import {
    type CurrentUser,
    getCurrentConsumer
} from "../../services/api/consumerProfileService"
import { useAppDispatch } from "../../store/hooks"
import { logout } from "../../store/slices/authSlice"
import {
    consumerColors,
    consumerStyles as styles
} from "./consumerStyles"

type Navigation = CompositeNavigationProp<
    BottomTabNavigationProp<ConsumerTabParamList, "Profile">,
    NativeStackNavigationProp<ConsumerStackParamList>
>

export default function ConsumerProfileScreen({
    navigation
}: {
    navigation: Navigation
}) {
    const dispatch = useAppDispatch()

    const [user, setUser] = useState<CurrentUser | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")
    const [imageError, setImageError] = useState(false)

    const loadProfile = async () => {
        try {
            setIsLoading(true)
            setError("")

            const data = await getCurrentConsumer()

            setUser(data)
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
                    <ActivityIndicator color={consumerColors.primary} />
                    <Text>Đang tải tài khoản...</Text>
                </View>
            </SafeAreaView>
        )
    }

    if (error || !user) {
        return (
            <SafeAreaView style={styles.screen} edges={["top"]}>
                <View style={styles.center}>
                    <MaterialCommunityIcons
                        name="alert-circle-outline"
                        size={48}
                        color={consumerColors.danger}
                    />

                    <Text style={styles.centerText}>
                        {error || "Không tìm thấy thông tin tài khoản."}
                    </Text>

                    <Button
                        mode="contained"
                        buttonColor={consumerColors.primary}
                        textColor="#FFFFFF"
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
                eyebrow="NGƯỜI MUA"
                title="Tài khoản"
                subtitle="Thông tin cá nhân và địa chỉ nhận hàng."
                accentColor={consumerColors.primary}
                textColor={consumerColors.text}
                secondaryColor={consumerColors.textSecondary}
            />

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <Surface elevation={1} style={styles.profileHeaderCard}>
                    <View style={styles.profileAvatar}>
                        {user.avatar && !imageError ? (
                            <Image
                                source={{ uri: user.avatar }}
                                style={styles.profileAvatarImage}
                                resizeMode="cover"
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <MaterialCommunityIcons
                                name="account-outline"
                                size={44}
                                color={consumerColors.primary}
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
                </Surface>

                <Text variant="titleMedium" style={styles.sectionTitle}>
                    Thông tin cá nhân
                </Text>

                <Surface elevation={1} style={styles.card}>
                    <ProfileRow
                        icon="email-outline"
                        label="Email"
                        value={user.email}
                    />

                    <Divider />

                    <ProfileRow
                        icon="phone-outline"
                        label="Số điện thoại"
                        value={user.phone_number || "Chưa cập nhật"}
                    />
                </Surface>

                <Button
                    mode="contained"
                    icon="pencil-outline"
                    buttonColor={consumerColors.primary}
                    textColor="#FFFFFF"
                    contentStyle={styles.buttonContent}
                    onPress={() =>
                        navigation.navigate("ConsumerProfileEdit")
                    }
                >
                    Chỉnh sửa thông tin
                </Button>

                <Button
                    mode="outlined"
                    icon="map-marker-outline"
                    textColor={consumerColors.primary}
                    contentStyle={styles.buttonContent}
                    onPress={() =>
                        navigation.navigate("ConsumerAddresses")
                    }
                >
                    Địa chỉ nhận hàng
                </Button>

                <Button
                    mode="outlined"
                    icon="logout"
                    textColor={consumerColors.danger}
                    contentStyle={styles.buttonContent}
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
                    color={consumerColors.primary}
                />
            </View>

            <View style={styles.profileRowText}>
                <Text variant="bodySmall" style={styles.label}>
                    {label}
                </Text>

                <Text variant="bodyLarge" style={styles.bold}>
                    {value}
                </Text>
            </View>
        </View>
    )
}