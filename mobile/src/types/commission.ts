export type CommissionStatus =
    | "PENDING"
    | "APPROVED"
    | "PAID"

export type Commission = {
    id: number
    affiliate_link: number
    koc: number
    koc_name: string
    order_item: number
    order_code: string
    product: number
    product_name: string
    rate: string
    amount: string
    status: CommissionStatus
    paid_at: string | null
    created_date: string
    updated_date: string
}