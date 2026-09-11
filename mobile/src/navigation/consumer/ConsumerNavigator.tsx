import { createNativeStackNavigator } from "@react-navigation/native-stack"

import ConsumerTabNavigator from "./ConsumerTabNavigator"
import CheckoutScreen from "../../screens/consumer/CheckoutScreen"
import ConsumerAddressFormScreen from "../../screens/consumer/ConsumerAddressFormScreen"
import ConsumerAddressesScreen from "../../screens/consumer/ConsumerAddressesScreen"
import ConsumerProfileEditScreen from "../../screens/consumer/ConsumerProfileEditScreen"
import NotificationScreen from "../../screens/NotificationScreen"
import OrderDetailScreen from "../../screens/consumer/OrderDetailScreen"
import ProductDetailScreen from "../../screens/consumer/ProductDetailScreen"
import { ReviewFormScreen } from "../../screens/consumer/ReviewFormScreen"
import type { Address } from "../../types/address"
import type { OrderItemReview } from "../../types/order"

export type ConsumerStackParamList = {
    ConsumerTabs: undefined

    ProductDetail: {
        productId: number
        affiliateCode?: string
        kocName?: string
    }

    Checkout: {
        cartItemIds: number[]
    }

    OrderDetail: {
        orderId: number
    }

    ReviewForm: {
        productId: number
        orderItemId: number
        productName: string
        review: OrderItemReview | null
    }

    ConsumerProfileEdit: undefined
    ConsumerAddresses: undefined

    ConsumerAddressForm: {
        address?: Address
    } | undefined

    Notification: undefined
}

const Stack =
    createNativeStackNavigator<ConsumerStackParamList>()

export default function ConsumerNavigator() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="ConsumerTabs"
                component={ConsumerTabNavigator}
                options={{ headerShown: false }}
            />

            <Stack.Screen
                name="ProductDetail"
                component={ProductDetailScreen}
                options={{ title: "Chi tiết sản phẩm" }}
            />

            <Stack.Screen
                name="Checkout"
                component={CheckoutScreen}
                options={{ title: "Đặt hàng" }}
            />

            <Stack.Screen
                name="OrderDetail"
                component={OrderDetailScreen}
                options={{ title: "Chi tiết đơn hàng" }}
            />

            <Stack.Screen
                name="ReviewForm"
                component={ReviewFormScreen}
                options={{ title: "Đánh giá sản phẩm" }}
            />

            <Stack.Screen
                name="ConsumerProfileEdit"
                component={ConsumerProfileEditScreen}
                options={{ title: "Chỉnh sửa tài khoản" }}
            />

            <Stack.Screen
                name="ConsumerAddresses"
                component={ConsumerAddressesScreen}
                options={{ title: "Địa chỉ nhận hàng" }}
            />

            <Stack.Screen
                name="ConsumerAddressForm"
                component={ConsumerAddressFormScreen}
                options={({ route }) => ({
                    title: route.params?.address
                        ? "Sửa địa chỉ"
                        : "Thêm địa chỉ"
                })}
            />

            <Stack.Screen
                name="Notification"
                component={NotificationScreen}
                options={{ title: "Thông báo" }}
            />
        </Stack.Navigator>
    )
}