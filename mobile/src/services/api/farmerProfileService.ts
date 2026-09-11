import apiClient from "./apiClient"

export type CurrentUser = {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    phone_number: string | null
    avatar: string | null
    role: string
    is_phone_verified: boolean
    date_joined: string
}

export type FarmerProfile = {
    id: number
    farm_name: string
    address: string
    description: string
    verification_document: string | null
    approval_status: "PENDING" | "APPROVED" | "REJECTED"
    approved_at: string | null
    created_date: string
    updated_date: string
}

export type UpdateUserData = {
    first_name?: string
    last_name?: string
    phone_number?: string | null
}

export type UpdateFarmerProfileData = {
    farm_name?: string
    address?: string
    description?: string
}

export const getCurrentUser = async () => {
    const response = await apiClient.get<CurrentUser>(
        "users/current-user/"
    )

    return response.data
}

export const updateCurrentUser = async (
    data: UpdateUserData
) => {
    const response = await apiClient.patch<CurrentUser>(
        "users/current-user/",
        data
    )

    return response.data
}

export const getCurrentFarmerProfile = async () => {
    const response = await apiClient.get<FarmerProfile>(
        "farmers/current-profile/"
    )

    return response.data
}

export const updateCurrentFarmerProfile = async (
    data: UpdateFarmerProfileData
) => {
    const response = await apiClient.patch<FarmerProfile>(
        "farmers/current-profile/",
        data
    )

    return response.data
}