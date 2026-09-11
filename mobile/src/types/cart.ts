import type { Product } from "./product"

export type CartItem = {
    id: number
    product: Product
    quantity: string
    affiliate_code: string | null
    subtotal: string
    created_date: string
    updated_date: string
}

export type Cart = {
    id: number
    items: CartItem[]
    total_amount: string
    is_empty: boolean
    created_date: string
    updated_date: string
}

export type AddCartItemRequest = {
    product: number
    quantity: string
    affiliate_code?: string | null
}

export type UpdateCartItemRequest = {
    itemId: number
    quantity: string
}

export type CartMutationResponse = {
    message: string
    cart: Cart
}