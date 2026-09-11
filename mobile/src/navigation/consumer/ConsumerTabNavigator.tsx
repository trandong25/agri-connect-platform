import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"

import ConsumerCartScreen from "../../screens/consumer/ConsumerCartScreen"
import ConsumerHomeScreen from "../../screens/consumer/ConsumerHomeScreen"
import ConsumerOrdersScreen from "../../screens/consumer/ConsumerOrdersScreen"
import ConsumerProfileScreen from "../../screens/consumer/ConsumerProfileScreen"

export type ConsumerTabParamList = {
    Home: undefined
    Cart: undefined
    Orders: undefined
    Profile: undefined
}

const Tab = createBottomTabNavigator<ConsumerTabParamList>()

export default function ConsumerTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarActiveTintColor: "#2F6B3B",
                tabBarInactiveTintColor: "#70766D",
                tabBarStyle: {
                    height: 64,
                    paddingTop: 6,
                    paddingBottom: 7
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: "600"
                },
                tabBarIcon: ({ color, size, focused }) => {
                    const iconName =
                        getTabIcon(route.name, focused)

                    return (
                        <MaterialCommunityIcons
                            name={iconName}
                            color={color}
                            size={size}
                        />
                    )
                }
            })}
        >
            <Tab.Screen
                name="Home"
                component={ConsumerHomeScreen}
                options={{
                    title: "Trang chủ",
                    headerShown: false
                }}
            />

            <Tab.Screen
                name="Cart"
                component={ConsumerCartScreen}
                options={{
                    title: "Giỏ hàng",
                    headerShown: false
                }}
            />

            <Tab.Screen
                name="Orders"
                component={ConsumerOrdersScreen}
                options={{
                    title: "Đơn hàng",
                    headerShown: false
                }}
            />

            <Tab.Screen
                name="Profile"
                component={ConsumerProfileScreen}
                options={{
                    title: "Tài khoản",
                    headerShown: false
                }}
            />
        </Tab.Navigator>
    )
}

function getTabIcon(
    route: keyof ConsumerTabParamList,
    focused: boolean
): keyof typeof MaterialCommunityIcons.glyphMap {
    if (route === "Home") {
        return focused ? "home" : "home-outline"
    }

    if (route === "Cart") {
        return focused ? "cart" : "cart-outline"
    }

    if (route === "Orders") {
        return focused
            ? "clipboard-list"
            : "clipboard-list-outline"
    }

    return focused ? "account" : "account-outline"
}