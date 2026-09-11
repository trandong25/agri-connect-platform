import apiClient from "./apiClient"
import type {
    CreateReviewRequest,
    Review,
    UpdateReviewRequest
} from "../../types/review"

type ReviewListResponse =
    | Review[]
    | {
        results: Review[]
    }

export const getProductReviews = async (
    productId: number
) => {
    const response =
        await apiClient.get<ReviewListResponse>(
            `products/${productId}/reviews/`
        )

    if (Array.isArray(response.data)) {
        return response.data
    }

    return response.data.results
}

export const createReview = async (
    productId: number,
    data: CreateReviewRequest
) => {
    const response =
        await apiClient.post<Review>(
            `products/${productId}/reviews/`,
            data
        )

    return response.data
}

export const updateReview = async (
    reviewId: number,
    data: UpdateReviewRequest
) => {
    const response =
        await apiClient.patch<Review>(
            `reviews/${reviewId}/`,
            data
        )

    return response.data
}

export const deleteReview = async (
    reviewId: number
) => {
    await apiClient.delete(
        `reviews/${reviewId}/`
    )
}