export type PaymentMethod = "COD" | "ONLINE"
export type PaymentStatus = "PENDING" | "PAID" | "FAILED"

export type SellerOrderStatus =
    | "PENDING"
    | "CONFIRMED"
    | "SHIPPING"
    | "COMPLETED"

export type CreateOrderRequest = {
    address: number
    cart_item_ids: number[]
    payment_method: PaymentMethod
    note?: string
}

export type OrderItemReview = {
    id: number
    rating: number
    comment: string
    created_date: string
    updated_date: string
}

export type OrderItem = {
    id: number
    product: number
    affiliate_code: string | null
    product_name: string
    unit_name: string
    unit_price: string
    quantity: string
    subtotal: string
    review: OrderItemReview | null
    created_date: string
}

export type SellerOrderStatusLog = {
    id: number
    old_status: SellerOrderStatus | ""
    new_status: SellerOrderStatus
    changed_by: number | null
    note: string
    created_date: string
}

export type SellerOrder = {
    id: number
    farmer: number
    subtotal: string
    shipping_fee: string
    discount_amount: string
    total_amount: string
    status: SellerOrderStatus
    note: string
    confirmed_at: string | null
    shipped_at: string | null
    completed_at: string | null
    items: OrderItem[]
    status_logs: SellerOrderStatusLog[]
    created_date: string
    updated_date: string
}

export type OrderPayment = {
    id: number
    order: number
    method: PaymentMethod
    status: PaymentStatus
    amount: string
    transaction_code: string | null
    paid_at: string | null
    created_date: string
    updated_date: string
}

export type Order = {
    id: number
    code: string
    recipient_name: string
    phone_number: string
    province: string
    ward: string
    address_detail: string
    subtotal: string
    shipping_fee: string
    discount_amount: string
    total_amount: string
    note: string
    seller_orders: SellerOrder[]
    payment: OrderPayment | null
    created_date: string
    updated_date: string
}
type OrderCardProps = {
    order: Order
    onPress: () => void
}
export type FarmerSellerOrder = {
    id: number
    order: number
    order_code: string
    recipient_name: string
    phone_number: string
    province: string
    ward: string
    address_detail: string
    consumer_note: string
    subtotal: string
    shipping_fee: string
    discount_amount: string
    total_amount: string
    status: SellerOrderStatus
    note: string
    confirmed_at: string | null
    shipped_at: string | null
    completed_at: string | null
    items: OrderItem[]
    status_logs: SellerOrderStatusLog[]
    created_date: string
    updated_date: string
}

export type UpdateSellerOrderStatusRequest = {
    status: Exclude<SellerOrderStatus, "PENDING">
    note?: string
}