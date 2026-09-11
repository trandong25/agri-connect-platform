export type NotificationType =
    | "ACCOUNT"
    | "ORDER"
    | "PAYMENT"
    | "COMMISSION"
    | "SYSTEM"

export type NotificationData = {
    order_id?: number
    seller_order_id?: number
    commission_id?: number
    order_item_id?: number
    payment_id?: number
    [key: string]: unknown
}

export type AppNotification = {
    id: number
    notification_type: NotificationType
    title: string
    message: string
    data: NotificationData
    is_read: boolean
    created_date: string
    updated_date: string
}