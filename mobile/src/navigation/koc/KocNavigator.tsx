import type { NavigatorScreenParams } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"

import NotificationScreen from "../../screens/NotificationScreen"
import KocProfileEditScreen from "../../screens/koc/KocProfileEditScreen"
import PromotionPostFormScreen from "../../screens/koc/PromotionPostFormScreen"
import KocTabNavigator, {
    type KocTabParamList
} from "./KocTabNavigator"

export type KocStackParamList = {
    KocTabs: NavigatorScreenParams<KocTabParamList>

    PromotionPostForm:
        | {
            postId?: number
            affiliateLinkId?: number
        }
        | undefined

    KocProfileEdit: undefined
    Notification: undefined
}

const Stack = createNativeStackNavigator<KocStackParamList>()

export default function KocNavigator() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="KocTabs"
                component={KocTabNavigator}
                options={{ headerShown: false }}
            />

            <Stack.Screen
                name="PromotionPostForm"
                component={PromotionPostFormScreen}
                options={{ title: "Bài quảng bá" }}
            />

            <Stack.Screen
                name="KocProfileEdit"
                component={KocProfileEditScreen}
                options={{ title: "Chỉnh sửa thông tin" }}
            />

            <Stack.Screen
                name="Notification"
                component={NotificationScreen}
                options={{ title: "Thông báo" }}
            />
        </Stack.Navigator>
    )
}