import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"

import KocAffiliateScreen from "../../screens/koc/KocAffiliateScreen"
import KocCommissionScreen from "../../screens/koc/KocComissionScreen"
import KocHomeScreen from "../../screens/koc/KocHomeScreen"
import KocPostsScreen from "../../screens/koc/KocPostsScreen"
import KocProfileScreen from "../../screens/koc/KocProfileScreen"

export type KocTabParamList = {
    Home: undefined
    Affiliate: undefined
    Posts: undefined
    Commission: undefined
    Profile: undefined
}

const Tab = createBottomTabNavigator<KocTabParamList>()

export default function KocTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarHideOnKeyboard: true,
                tabBarActiveTintColor: "#2F6B3B",
                tabBarInactiveTintColor: "#70766D",
                tabBarStyle: {
                    height: 64,
                    paddingTop: 6,
                    paddingBottom: 7
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: "600"
                },
                tabBarIcon: ({ color, size, focused }) => (
                    <MaterialCommunityIcons
                        name={getTabIcon(route.name, focused)}
                        color={color}
                        size={size}
                    />
                )
            })}
        >
            <Tab.Screen
                name="Home"
                component={KocHomeScreen}
                options={{ title: "Trang chủ" }}
            />

            <Tab.Screen
                name="Affiliate"
                component={KocAffiliateScreen}
                options={{ title: "Quảng bá" }}
            />

            <Tab.Screen
                name="Posts"
                component={KocPostsScreen}
                options={{ title: "Bài viết" }}
            />

            <Tab.Screen
                name="Commission"
                component={KocCommissionScreen}
                options={{ title: "Hoa hồng" }}
            />

            <Tab.Screen
                name="Profile"
                component={KocProfileScreen}
                options={{ title: "Tài khoản" }}
            />
        </Tab.Navigator>
    )
}

function getTabIcon(
    route: keyof KocTabParamList,
    focused: boolean
): keyof typeof MaterialCommunityIcons.glyphMap {
    if (route === "Home") {
        return focused ? "home" : "home-outline"
    }

    if (route === "Affiliate") {
        return focused ? "bullhorn" : "bullhorn-outline"
    }

    if (route === "Posts") {
        return focused ? "post" : "post-outline"
    }

    if (route === "Commission") {
        return "cash-multiple"
    }

    return focused ? "account" : "account-outline"
}