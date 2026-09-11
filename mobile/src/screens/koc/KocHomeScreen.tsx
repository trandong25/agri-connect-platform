import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs"
import type { CompositeNavigationProp } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { Pressable, ScrollView, StyleSheet, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Button, Surface, Text } from "react-native-paper"

import NotificationBell from "../../components/NotificationBell"
import type { KocStackParamList } from "../../navigation/koc/KocNavigator"
import type { KocTabParamList } from "../../navigation/koc/KocTabNavigator"
import {
    kocColors,
    kocStyles
} from "./kocStyles"

type Navigation = CompositeNavigationProp<
    BottomTabNavigationProp<KocTabParamList, "Home">,
    NativeStackNavigationProp<KocStackParamList>
>

export default function KocHomeScreen({
    navigation
}: {
    navigation: Navigation
}) {
    return (
        <SafeAreaView style={kocStyles.safeArea} edges={["top"]}>
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <View>
                        <Text style={kocStyles.secondaryText}>
                            AgriConnect
                        </Text>

                        <Text
                            variant="headlineSmall"
                            style={kocStyles.title}
                        >
                            KOC/KOL
                        </Text>
                    </View>

                    <View style={styles.headerActions}>
                        <NotificationBell
                            onPress={() =>
                                navigation.navigate("Notification")
                            }
                        />

                        <Pressable
                            style={({ pressed }) => [
                                styles.avatar,
                                pressed && styles.pressed
                            ]}
                            onPress={() => navigation.navigate("Profile")}
                        >
                            <MaterialCommunityIcons
                                name="account-star-outline"
                                size={28}
                                color={kocColors.primary}
                            />
                        </Pressable>
                    </View>
                </View>

                <Surface elevation={0} style={styles.hero}>
                    <View style={styles.heroContent}>
                        <Text
                            variant="headlineSmall"
                            style={styles.heroTitle}
                        >
                            Quảng bá nông sản
                        </Text>

                        <Text style={styles.heroDescription}>
                            Chọn sản phẩm, tạo mã quảng bá và giới thiệu tới
                            người mua trên AgriConnect.
                        </Text>

                        <Button
                            mode="contained"
                            icon="bullhorn-outline"
                            buttonColor={kocColors.primary}
                            style={styles.heroButton}
                            onPress={() =>
                                navigation.navigate("Affiliate")
                            }
                        >
                            Chọn sản phẩm
                        </Button>
                    </View>

                    <View style={styles.heroIcon}>
                        <MaterialCommunityIcons
                            name="sprout"
                            size={52}
                            color={kocColors.primary}
                        />
                    </View>
                </Surface>

                <Text
                    variant="titleLarge"
                    style={styles.sectionTitle}
                >
                    Thao tác nhanh
                </Text>

                <View style={styles.quickGrid}>
                    <QuickAction
                        icon="bullhorn-outline"
                        title="Quảng bá"
                        description="Chọn sản phẩm"
                        onPress={() =>
                            navigation.navigate("Affiliate")
                        }
                    />

                    <QuickAction
                        icon="post-outline"
                        title="Tạo bài"
                        description="Viết nội dung"
                        onPress={() =>
                            navigation.navigate("PromotionPostForm")
                        }
                    />

                    <QuickAction
                        icon="file-document-outline"
                        title="Bài viết"
                        description="Quản lý bài"
                        onPress={() =>
                            navigation.navigate("Posts")
                        }
                    />

                    <QuickAction
                        icon="cash-multiple"
                        title="Hoa hồng"
                        description="Theo dõi thu nhập"
                        onPress={() =>
                            navigation.navigate("Commission")
                        }
                    />
                </View>

                <Text
                    variant="titleLarge"
                    style={styles.sectionTitle}
                >
                    Cách hoạt động
                </Text>

                <Surface elevation={0} style={styles.processCard}>
                    <ProcessStep
                        number="1"
                        icon="basket-outline"
                        title="Chọn sản phẩm"
                        description="Chọn nông sản bạn muốn giới thiệu."
                    />

                    <ProcessLine />

                    <ProcessStep
                        number="2"
                        icon="link-variant"
                        title="Tạo mã quảng bá"
                        description="Hệ thống tạo mã riêng để ghi nhận nguồn KOC."
                    />

                    <ProcessLine />

                    <ProcessStep
                        number="3"
                        icon="post-outline"
                        title="Đăng nội dung"
                        description="Tạo bài quảng bá sản phẩm trên AgriConnect."
                    />

                    <ProcessLine />

                    <ProcessStep
                        number="4"
                        icon="cash-check"
                        title="Nhận hoa hồng"
                        description="Đơn đủ điều kiện sẽ được ghi nhận hoa hồng."
                    />
                </Surface>

                <Surface elevation={0} style={styles.profileCard}>
                    <View style={styles.profileIcon}>
                        <MaterialCommunityIcons
                            name="account-outline"
                            size={25}
                            color={kocColors.primary}
                        />
                    </View>

                    <View style={styles.profileContent}>
                        <Text
                            variant="titleMedium"
                            style={kocStyles.bold}
                        >
                            Tài khoản KOC/KOL
                        </Text>

                        <Text style={kocStyles.secondaryText}>
                            Xem hồ sơ và thông tin tài khoản.
                        </Text>
                    </View>

                    <Button
                        mode="text"
                        compact
                        onPress={() =>
                            navigation.navigate("Profile")
                        }
                    >
                        Xem
                    </Button>
                </Surface>
            </ScrollView>
        </SafeAreaView>
    )
}

function QuickAction({
    icon,
    title,
    description,
    onPress
}: {
    icon: keyof typeof MaterialCommunityIcons.glyphMap
    title: string
    description: string
    onPress: () => void
}) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.quickCard,
                pressed && styles.pressed
            ]}
            onPress={onPress}
        >
            <View style={styles.quickIcon}>
                <MaterialCommunityIcons
                    name={icon}
                    size={25}
                    color={kocColors.primary}
                />
            </View>

            <Text
                variant="titleMedium"
                style={kocStyles.bold}
            >
                {title}
            </Text>

            <Text style={kocStyles.secondaryText}>
                {description}
            </Text>
        </Pressable>
    )
}

function ProcessStep({
    number,
    icon,
    title,
    description
}: {
    number: string
    icon: keyof typeof MaterialCommunityIcons.glyphMap
    title: string
    description: string
}) {
    return (
        <View style={styles.processStep}>
            <View style={styles.number}>
                <Text style={styles.numberText}>
                    {number}
                </Text>
            </View>

            <View style={styles.processIcon}>
                <MaterialCommunityIcons
                    name={icon}
                    size={22}
                    color={kocColors.primary}
                />
            </View>

            <View style={styles.processContent}>
                <Text
                    variant="titleSmall"
                    style={kocStyles.bold}
                >
                    {title}
                </Text>

                <Text style={kocStyles.secondaryText}>
                    {description}
                </Text>
            </View>
        </View>
    )
}

function ProcessLine() {
    return <View style={styles.processLine} />
}

const styles = StyleSheet.create({
    content: {
        padding: 16,
        paddingBottom: 36
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 18
    },
    headerActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: kocColors.primarySoft
    },
    hero: {
        minHeight: 185,
        borderRadius: 24,
        padding: 20,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: kocColors.primarySoft
    },
    heroContent: {
        flex: 1
    },
    heroTitle: {
        color: kocColors.primaryDark,
        fontWeight: "800"
    },
    heroDescription: {
        color: kocColors.textSecondary,
        lineHeight: 20,
        marginTop: 7
    },
    heroButton: {
        alignSelf: "flex-start",
        marginTop: 14,
        borderRadius: 13
    },
    heroIcon: {
        width: 84,
        height: 84,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: kocColors.surface
    },
    sectionTitle: {
        marginTop: 24,
        marginBottom: 12,
        fontWeight: "700"
    },
    quickGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10
    },
    quickCard: {
        width: "48.5%",
        minHeight: 128,
        borderRadius: 19,
        padding: 14,
        backgroundColor: kocColors.surface
    },
    quickIcon: {
        width: 46,
        height: 46,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
        backgroundColor: kocColors.primarySoft
    },
    pressed: {
        opacity: 0.75
    },
    processCard: {
        borderRadius: 20,
        padding: 15,
        backgroundColor: kocColors.surface
    },
    processStep: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10
    },
    number: {
        width: 25,
        height: 25,
        borderRadius: 9,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: kocColors.primary
    },
    numberText: {
        color: "#FFFFFF",
        fontWeight: "700"
    },
    processIcon: {
        width: 43,
        height: 43,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: kocColors.primarySoft
    },
    processContent: {
        flex: 1,
        gap: 2
    },
    processLine: {
        width: 2,
        height: 18,
        marginLeft: 12,
        marginVertical: 3,
        backgroundColor: kocColors.border
    },
    profileCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderRadius: 19,
        padding: 14,
        marginTop: 18,
        backgroundColor: kocColors.surface
    },
    profileIcon: {
        width: 47,
        height: 47,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: kocColors.primarySoft
    },
    profileContent: {
        flex: 1,
        gap: 2
    }
})