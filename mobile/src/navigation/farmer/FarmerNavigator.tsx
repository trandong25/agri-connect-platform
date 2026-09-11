import type { NavigatorScreenParams } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"

import NotificationScreen from "../../screens/NotificationScreen"
import FarmerProductAnalyzeImageScreen from "../../screens/farmer/FarmerProductAnalyzeImageScreen"
import FarmerProductDetailScreen from "../../screens/farmer/FarmerProductDetailScreen"
import FarmerProductFormScreen from "../../screens/farmer/FarmerProductFormScreen"
import FarmerProductImagesScreen from "../../screens/farmer/FarmerProductImagesScreen"
import FarmerProfileEditScreen from "../../screens/farmer/FarmerProfileEditScreen"
import SellerOrderDetailScreen from "../../screens/farmer/SellerOrderDetailScreen"
import FarmerTabNavigator, {
    FarmerTabParamList
} from "./FarmerTabNavigator"

export type FarmerStackParamList = {
    FarmerTabs: NavigatorScreenParams<FarmerTabParamList>

    SellerOrderDetail: {
        sellerOrderId: number
    }

    FarmerProductDetail: {
        productId: number
    }

    FarmerProductForm:
        | {
            productId?: number
        }
        | undefined

    FarmerProductImages: {
        productId: number
    }

    FarmerProductAnalyzeImage: {
        productId: number
        displayOrder: number
    }

    FarmerProfileEdit: undefined
    Notification: undefined
}

const Stack = createNativeStackNavigator<FarmerStackParamList>()

export default function FarmerNavigator() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: {
                    backgroundColor: "#F7F8F4"
                },
                headerTintColor: "#2F6B3B",
                headerTitleStyle: {
                    fontWeight: "700"
                },
                headerShadowVisible: false,
                contentStyle: {
                    backgroundColor: "#F7F8F4"
                }
            }}
        >
            <Stack.Screen
                name="FarmerTabs"
                component={FarmerTabNavigator}
                options={{
                    headerShown: false
                }}
            />

            <Stack.Screen
                name="SellerOrderDetail"
                component={SellerOrderDetailScreen}
                options={{
                    title: "Chi tiết đơn hàng"
                }}
            />

            <Stack.Screen
                name="FarmerProductDetail"
                component={FarmerProductDetailScreen}
                options={{
                    title: "Chi tiết sản phẩm"
                }}
            />

            <Stack.Screen
                name="FarmerProductForm"
                component={FarmerProductFormScreen}
                options={({ route }) => ({
                    title: route.params?.productId
                        ? "Chỉnh sửa sản phẩm"
                        : "Thêm sản phẩm"
                })}
            />

            <Stack.Screen
                name="FarmerProductImages"
                component={FarmerProductImagesScreen}
                options={{
                    title: "Ảnh sản phẩm"
                }}
            />

            <Stack.Screen
                name="FarmerProductAnalyzeImage"
                component={FarmerProductAnalyzeImageScreen}
                options={{
                    title: "Kiểm tra ảnh"
                }}
            />

            <Stack.Screen
                name="FarmerProfileEdit"
                component={FarmerProfileEditScreen}
                options={{
                    headerShown: false
                }}
            />

            <Stack.Screen
                name="Notification"
                component={NotificationScreen}
                options={{
                    headerShown: false
                }}
            />
        </Stack.Navigator>
    )
}