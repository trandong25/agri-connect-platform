import apiClient from "./apiClient"
import type {
    CreateFarmerProfileRequest,
    CreateKocProfileRequest,
    CurrentUser,
    FarmerProfile,
    KocProfile,
    UpdateCurrentUserRequest
} from "../../types/profile"

export const getCurrentUser = async () => {
    const response = await apiClient.get<CurrentUser>(
        "users/current-user/"
    )

    return response.data
}

export const updateCurrentUser = async (
    data: UpdateCurrentUserRequest
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

export const createFarmerProfile = async (
    data: CreateFarmerProfileRequest
) => {
    const formData = new FormData()

    formData.append("farm_name", data.farm_name)
    formData.append("address", data.address)
    formData.append("description", data.description)

    if (data.verification_document) {
        formData.append(
            "verification_document",
            {
                uri: data.verification_document.uri,
                name: data.verification_document.name,
                type: data.verification_document.type
            } as any
        )
    }

    const response = await apiClient.post<FarmerProfile>(
        "farmers/",
        formData
    )

    return response.data
}

export const getCurrentKocProfile = async () => {
    const response = await apiClient.get<KocProfile>(
        "kocs/current-profile/"
    )

    return response.data
}

export const createKocProfile = async (
    data: CreateKocProfileRequest
) => {
    const response = await apiClient.post<KocProfile>(
        "kocs/",
        data
    )

    return response.data
}