import apiClient from "./apiClient"
import type {
    CreatePromotionPostRequest,
    PromotionMediaFile,
    PromotionPost,
    PromotionPostMedia,
    UpdatePromotionPostRequest
} from "../../types/promotionPost"

type PromotionPostListResponse =
    | PromotionPost[]
    | {
        results: PromotionPost[]
    }

const normalizePostList = (
    data: PromotionPostListResponse
) => {
    if (Array.isArray(data)) {
        return data
    }

    return data.results
}

export const getPublicPromotionPosts =
    async () => {
        const response =
            await apiClient.get<PromotionPostListResponse>(
                "promotion-posts/"
            )

        return normalizePostList(
            response.data
        )
    }

export const getMyPromotionPosts =
    async () => {
        const response =
            await apiClient.get<PromotionPostListResponse>(
                "promotion-posts/mine/"
            )

        return normalizePostList(
            response.data
        )
    }

export const getPromotionPostDetail =
    async (
        postId: number
    ) => {
        const response =
            await apiClient.get<PromotionPost>(
                `promotion-posts/${postId}/`
            )

        return response.data
    }

export const createPromotionPost =
    async (
        data:
            CreatePromotionPostRequest
    ) => {
        const response =
            await apiClient.post<PromotionPost>(
                "promotion-posts/",
                data
            )

        return response.data
    }

export const updatePromotionPost =
    async (
        postId: number,
        data:
            UpdatePromotionPostRequest
    ) => {
        const response =
            await apiClient.patch<PromotionPost>(
                `promotion-posts/${postId}/`,
                data
            )

        return response.data
    }

export const deletePromotionPost =
    async (
        postId: number
    ) => {
        await apiClient.delete(
            `promotion-posts/${postId}/`
        )
    }

export const uploadPromotionPostMedia =
    async (
        postId: number,
        file:
            PromotionMediaFile,
        displayOrder: number
    ) => {
        const formData =
            new FormData()

        formData.append(
            "file",
            {
                uri: file.uri,
                name: file.name,
                type: file.type
            } as any
        )

        formData.append(
            "display_order",
            String(displayOrder)
        )

        const response =
            await apiClient.post<PromotionPostMedia>(
                `promotion-posts/${postId}/media/`,
                formData
            )

        return response.data
    }

export const deletePromotionPostMedia =
    async (
        postId: number,
        mediaId: number
    ) => {
        await apiClient.delete(
            `promotion-posts/${postId}/media/${mediaId}/`
        )
    }