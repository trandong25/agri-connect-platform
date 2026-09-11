import apiClient from "./apiClient"
import type {
    CreateOrderRequest,
    Order
} from "../../types/order"

export const createOrder = async (
    data: CreateOrderRequest
) => {
    const response = await apiClient.post<Order>(
        "orders/",
        data
    )

    return response.data
}

export const getOrders = async () => {
    const response = await apiClient.get<Order[]>(
        "orders/"
    )

    return response.data
}

export const getOrderDetail = async (id: number) => {
    const response = await apiClient.get<Order>(
        `orders/${id}/`
    )

    return response.data
}