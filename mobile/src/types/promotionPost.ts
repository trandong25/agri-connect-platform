export type PromotionPostStatus =
    | "DRAFT"
    | "PUBLISHED"
    | "HIDDEN"

export type PromotionPostMediaType =
    | "IMAGE"
    | "VIDEO"

export type PromotionPostMedia = {
    id: number
    file: string
    media_type: PromotionPostMediaType
    display_order: number
    created_date: string
    updated_date: string
}

export type PromotionPost = {
    id: number
    affiliate_link: number
    affiliate_code: string
    koc_name: string
    product: number
    product_name: string
    content: string
    status: PromotionPostStatus
    media: PromotionPostMedia[]
    published_at: string | null
    created_date: string
    updated_date: string
}

export type CreatePromotionPostRequest = {
    affiliate_link: number
    content: string
    status: PromotionPostStatus
}

export type UpdatePromotionPostRequest = {
    content?: string
    status?: PromotionPostStatus
}

export type PromotionMediaFile = {
    uri: string
    name: string
    type: string
    mediaType: PromotionPostMediaType
}