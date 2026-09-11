export type CvAnalysisStatus =
    | "RETAKE"
    | "READY_MANUAL_NAME"
    | "READY"
    | "ERROR"

export type CvQualityMetrics = {
    probability_blur?: number
    probability_low_contrast?: number
    brightness_mean?: number
    brightness_p05?: number
    brightness_p10?: number
    brightness_p50?: number
    brightness_p90?: number
    contrast_std?: number
    local_contrast_median?: number
    laplacian_raw?: number
    laplacian_normalized?: number
    dark_pixel_ratio?: number
    bright_pixel_ratio?: number
    width?: number
    height?: number
    roi_source?: string
}

export type CvLayoutMetrics = {
    area_ratio?: number | null
    center_offset_x?: number | null
    center_offset_y?: number | null
    edge_margin_ratio?: number | null
    bbox_xyxy?: number[] | null
}

export type CvAnalysisResponse = {
    status: CvAnalysisStatus
    can_continue: boolean
    message?: string
    suggested_product?: string | null
    product_code?: string | null
    confidence?: number | null
    requires_manual_name?: boolean
    requires_confirmation?: boolean
    quality_passed?: boolean
    quality_score?: number
    quality_issues?: string[]
    layout_analyzed?: boolean
    layout_passed?: boolean
    layout_status?: string
    layout_warnings?: string[]
    instructions?: string[]
    quality_metrics?: CvQualityMetrics
    layout_metrics?: CvLayoutMetrics
}

export type CvImageFile = {
    uri: string
    name: string
    type: string
}