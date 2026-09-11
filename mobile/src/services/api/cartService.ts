import apiClient from "./apiClient"
import type {
    AddCartItemRequest,
    Cart,
    CartMutationResponse
} from "../../types/cart"

export const getCart = async () => {
    const response = await apiClient.get<Cart>("cart/")
    return response.data
}

export const addCartItem = async (data: AddCartItemRequest) => {
    const response = await apiClient.post<CartMutationResponse>(
        "cart/items/",
        data
    )

    return response.data
}

export const updateCartItem = async (
    itemId: number,
    quantity: string
) => {
    const response = await apiClient.patch<CartMutationResponse>(
        `cart/items/${itemId}/`,
        { quantity }
    )

    return response.data
}

export const deleteCartItem = async (itemId: number) => {
    const response = await apiClient.delete<CartMutationResponse>(
        `cart/items/${itemId}/`
    )

    return response.data
}