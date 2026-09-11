import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"

import NotificationScreen from "../../screens/NotificationScreen"
import FarmerHomeScreen from "../../screens/farmer/FarmerHomeScreen"
import FarmerOrdersScreen from "../../screens/farmer/FarmerOrdersScreen"
import FarmerProductsScreen from "../../screens/farmer/FarmerProductsScreen"
import FarmerProfileScreen from "../../screens/farmer/FarmerProfileScreen"

export type FarmerTabParamList = {
    Home: undefined
    Products: undefined
    Orders: undefined
    Notifications: undefined
    Profile: undefined
}

const Tab = createBottomTabNavigator<FarmerTabParamList>()

const PRIMARY_COLOR = "#2F6B3B"
const INACTIVE_COLOR = "#70766D"
const SURFACE_COLOR = "#FFFFFF"
const BORDER_COLOR = "#E2E6DE"

export default function FarmerTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarHideOnKeyboard: true,
                tabBarActiveTintColor: PRIMARY_COLOR,
                tabBarInactiveTintColor: INACTIVE_COLOR,
                tabBarStyle: {
                    minHeight: 66,
                    paddingTop: 6,
                    paddingBottom: 7,
                    backgroundColor: SURFACE_COLOR,
                    borderTopColor: BORDER_COLOR
                },
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: "600"
                },
                tabBarIcon: ({ color, size }) => {
                    let icon:
                        keyof typeof MaterialCommunityIcons.glyphMap =
                        "home-outline"

                    if (route.name === "Products") {
                        icon = "package-variant-closed"
                    } else if (route.name === "Orders") {
                        icon = "clipboard-text-outline"
                    } else if (route.name === "Notifications") {
                        icon = "bell-outline"
                    } else if (route.name === "Profile") {
                        icon = "account-outline"
                    }

                    return (
                        <MaterialCommunityIcons
                            name={icon}
                            color={color}
                            size={size}
                        />
                    )
                }
            })}
        >
            <Tab.Screen
                name="Home"
                component={FarmerHomeScreen}
                options={{
                    title: "Trang chủ"
                }}
            />

            <Tab.Screen
                name="Products"
                component={FarmerProductsScreen}
                options={{
                    title: "Sản phẩm"
                }}
            />

            <Tab.Screen
                name="Orders"
                component={FarmerOrdersScreen}
                options={{
                    title: "Đơn hàng"
                }}
            />

            <Tab.Screen
                name="Notifications"
                component={NotificationScreen}
                options={{
                    title: "Thông báo"
                }}
            />

            <Tab.Screen
                name="Profile"
                component={FarmerProfileScreen}
                options={{
                    title: "Tài khoản"
                }}
            />
        </Tab.Navigator>
    )
}