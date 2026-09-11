import apiClient from "./apiClient"
import type {
    FarmerSellerOrder,
    UpdateSellerOrderStatusRequest
} from "../../types/order"

export const getSellerOrders = async () => {
    const response = await apiClient.get<FarmerSellerOrder[]>(
        "seller-orders/"
    )

    return response.data
}

export const getSellerOrderDetail = async (id: number) => {
    const response = await apiClient.get<FarmerSellerOrder>(
        `seller-orders/${id}/`
    )

    return response.data
}

export const updateSellerOrderStatus = async (
    id: number,
    data: UpdateSellerOrderStatusRequest
) => {
    const response = await apiClient.patch<FarmerSellerOrder>(
        `seller-orders/${id}/status/`,
        data
    )

    return response.data
}