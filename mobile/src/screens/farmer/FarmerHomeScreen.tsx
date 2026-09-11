import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs"
import type { CompositeNavigationProp } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { Pressable, ScrollView, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Button, Surface, Text } from "react-native-paper"

import QuickActionCard from "../../components/common/QuickActionCard"
import type { FarmerStackParamList } from "../../navigation/farmer/FarmerNavigator"
import type { FarmerTabParamList } from "../../navigation/farmer/FarmerTabNavigator"
import { useAppSelector } from "../../store/hooks"
import {
    farmerColors,
    farmerStyles as styles
} from "./farmerStyles"

type Navigation = CompositeNavigationProp<
    BottomTabNavigationProp<FarmerTabParamList, "Home">,
    NativeStackNavigationProp<FarmerStackParamList>
>

type Props = {
    navigation: Navigation
}

export default function FarmerHomeScreen({ navigation }: Props) {
    const user = useAppSelector(state => state.auth.user)

    return (
        <SafeAreaView style={styles.screen} edges={["top"]}>
            <ScrollView
                contentContainerStyle={styles.homeContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.homeHeader}>
                    <View style={styles.homeHeaderText}>
                        <Text
                            variant="labelLarge"
                            style={styles.homeBrand}
                        >
                            AGRICONNECT
                        </Text>

                        <Text
                            variant="headlineSmall"
                            style={styles.homeGreeting}
                        >
                            Xin chào, {user?.username ?? "Nông dân"}
                        </Text>

                        <Text
                            variant="bodyMedium"
                            style={styles.homeSubtitle}
                        >
                            Hôm nay bạn muốn làm gì?
                        </Text>
                    </View>

                    <Pressable
                        onPress={() =>
                            navigation.navigate("Profile")
                        }
                    >
                        {({ pressed }) => (
                            <Surface
                                elevation={0}
                                style={[
                                    styles.homeAvatar,
                                    pressed && styles.pressed
                                ]}
                            >
                                <MaterialCommunityIcons
                                    name="account-outline"
                                    size={29}
                                    color={farmerColors.primary}
                                />
                            </Surface>
                        )}
                    </Pressable>
                </View>

                <Surface elevation={0} style={styles.homeHero}>
                    <View style={styles.homeHeroContent}>
                        <Text
                            variant="headlineSmall"
                            style={styles.homeHeroTitle}
                        >
                            Đăng nông sản dễ dàng
                        </Text>

                        <Text
                            variant="bodyMedium"
                            style={styles.homeHeroDescription}
                        >
                            Nhập thông tin nông sản, thêm ảnh để hệ thống kiểm tra, sau đó bắt đầu đăng bán.
                        </Text>

                        <Button
                            mode="contained"
                            icon="plus"
                            buttonColor={farmerColors.primary}
                            textColor="#FFFFFF"
                            style={styles.homeHeroButton}
                            contentStyle={styles.homeHeroButtonContent}
                            onPress={() =>
                                navigation.navigate(
                                    "FarmerProductForm"
                                )
                            }
                        >
                            Thêm sản phẩm
                        </Button>
                    </View>

                    <View style={styles.homeHeroIcon}>
                        <MaterialCommunityIcons
                            name="sprout"
                            size={48}
                            color={farmerColors.primary}
                        />
                    </View>
                </Surface>

                <View style={styles.homeSection}>
                    <Text
                        variant="titleLarge"
                        style={styles.homeSectionTitle}
                    >
                        Thao tác nhanh
                    </Text>
                </View>

                <View style={styles.homeQuickGrid}>
                    <QuickActionCard
                        icon="basket-outline"
                        title="Sản phẩm"
                        description="Quản lý nông sản"
                        accentColor={farmerColors.primary}
                        softColor={farmerColors.primarySoft}
                        onPress={() =>
                            navigation.navigate("Products")
                        }
                    />

                    <QuickActionCard
                        icon="clipboard-text-outline"
                        title="Đơn hàng"
                        description="Xem đơn cần xử lý"
                        accentColor={farmerColors.primary}
                        softColor={farmerColors.primarySoft}
                        onPress={() =>
                            navigation.navigate("Orders")
                        }
                    />

                    <QuickActionCard
                        icon="plus-box-outline"
                        title="Thêm sản phẩm"
                        description="Nhập thông tin nông sản"
                        accentColor={farmerColors.primary}
                        softColor={farmerColors.primarySoft}
                        onPress={() =>
                            navigation.navigate(
                                "FarmerProductForm"
                            )
                        }
                    />

                    <QuickActionCard
                        icon="bell-outline"
                        title="Thông báo"
                        description="Xem cập nhật mới"
                        accentColor={farmerColors.primary}
                        softColor={farmerColors.primarySoft}
                        onPress={() =>
                            navigation.navigate("Notifications")
                        }
                    />
                </View>

                <View style={styles.homeSection}>
                    <Text
                        variant="titleLarge"
                        style={styles.homeSectionTitle}
                    >
                        Đăng bán trong 3 bước
                    </Text>
                </View>

                <Surface elevation={0} style={styles.homeProcess}>
                    <ProcessStep
                        number="1"
                        title="Nhập thông tin"
                        description="Điền tên, giá, số lượng và thông tin nông sản."
                    />

                    <ProcessStep
                        number="2"
                        title="Thêm và kiểm tra ảnh"
                        description="Chụp hoặc chọn ảnh để hệ thống hỗ trợ kiểm tra."
                    />

                    <ProcessStep
                        number="3"
                        title="Đăng bán"
                        description="Khi thông tin và ảnh đạt yêu cầu, bạn có thể đăng bán sản phẩm."
                    />
                </Surface>
            </ScrollView>
        </SafeAreaView>
    )
}

function ProcessStep({
    number,
    title,
    description
}: {
    number: string
    title: string
    description: string
}) {
    return (
        <View style={styles.homeProcessRow}>
            <View style={styles.homeProcessNumber}>
                <Text
                    variant="labelLarge"
                    style={{
                        color: "#FFFFFF",
                        fontWeight: "700"
                    }}
                >
                    {number}
                </Text>
            </View>

            <View style={styles.homeProcessText}>
                <Text
                    variant="titleSmall"
                    style={styles.bold}
                >
                    {title}
                </Text>

                <Text
                    variant="bodySmall"
                    style={{
                        color: farmerColors.textSecondary
                    }}
                >
                    {description}
                </Text>
            </View>
        </View>
    )
}