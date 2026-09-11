export type ProductStatus =
    | "DRAFT"
    | "PENDING"
    | "AVAILABLE"
    | "HIDDEN"
    | "REJECTED"

export type ImageQualityResult = {
    id: number
    raw_blur_score: number | null
    normalized_blur_score: number | null
    brightness_mean: number | null
    contrast_std: number | null
    dark_ratio: number | null
    bright_ratio: number | null
    is_blurry: boolean
    is_too_dark: boolean
    is_too_bright: boolean
    is_acceptable: boolean
    feedback: string
    created_date: string
    updated_date: string
}

export type ProductImage = {
    id: number
    image: string
    is_primary: boolean
    display_order: number
    quality_result: ImageQualityResult | null
    created_date: string
    updated_date: string
}

export type Product = {
    id: number
    farmer: number
    farmer_name: string
    category: number
    category_name: string
    unit: number
    unit_name: string
    unit_symbol: string
    name: string
    description: string
    origin: string
    price: string
    stock_quantity: string
    minimum_order_quantity: string
    harvest_date: string | null
    expiry_date: string | null
    status: ProductStatus
    rejection_reason: string
    images: ProductImage[]
    average_rating: number | null
    review_count: number
    created_date: string
    updated_date: string
}

export type Category = {
    id: number
    name: string
    description: string
}

export type Unit = {
    id: number
    name: string
    symbol: string
}

export type ProductWriteRequest = {
    category: number
    unit: number
    name: string
    description: string
    origin: string
    price: string
    stock_quantity: string
    minimum_order_quantity: string
    harvest_date: string | null
    expiry_date: string | null
}

export type CreateProductRequest =
    ProductWriteRequest & {
        status: "DRAFT"
    }

export type UpdateProductRequest =
    Partial<ProductWriteRequest> & {
        status?: ProductStatus
    }