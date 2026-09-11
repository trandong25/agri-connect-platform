import apiClient from "./apiClient"

export type CurrentUser = {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    phone_number: string | null
    avatar: string | null
    role: "FARMER" | "CONSUMER" | "KOC"
    is_phone_verified: boolean
    date_joined: string
}

export type UpdateCurrentUserRequest = {
    first_name?: string
    last_name?: string
    phone_number?: string | null
}

export const getCurrentConsumer = async () => {
    const response = await apiClient.get<CurrentUser>(
        "users/current-user/"
    )

    return response.data
}

export const updateCurrentConsumer = async (
    data: UpdateCurrentUserRequest
) => {
    const response = await apiClient.patch<CurrentUser>(
        "users/current-user/",
        data
    )

    return response.data
}