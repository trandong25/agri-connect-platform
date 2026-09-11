export type Review = {
    id: number
    product: number
    product_name: string
    reviewer_name: string
    rating: number
    comment: string
    created_date: string
    updated_date: string
}

export type CreateReviewRequest = {
    order_item: number
    rating: number
    comment: string
}

export type UpdateReviewRequest = {
    rating?: number
    comment?: string
}