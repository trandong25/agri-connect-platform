import apiClient from "./apiClient"
import type { Commission } from "../../types/commission"

type CommissionListResponse =
    | Commission[]
    | {
        results: Commission[]
    }

export const getCommissions = async () => {
    const response =
        await apiClient.get<CommissionListResponse>(
            "commissions/"
        )

    if (Array.isArray(response.data)) {
        return response.data
    }

    return response.data.results
}

export const getCommissionDetail = async (
    commissionId: number
) => {
    const response =
        await apiClient.get<Commission>(
            `commissions/${commissionId}/`
        )

    return response.data
}