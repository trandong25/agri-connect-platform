import apiClient from "./apiClient"
import type { AffiliateLink } from "../../types/affiliate"

export const getAffiliateLinks = async () => {
    const response =
        await apiClient.get<AffiliateLink[]>(
            "affiliate-links/"
        )

    return response.data
}

export const createAffiliateLink = async (
    productId: number
) => {
    const response =
        await apiClient.post<AffiliateLink>(
            "affiliate-links/",
            {
                product: productId
            }
        )

    return response.data
}

export const getAffiliateLinkDetail = async (
    affiliateLinkId: number
) => {
    const response =
        await apiClient.get<AffiliateLink>(
            `affiliate-links/${affiliateLinkId}/`
        )

    return response.data
}