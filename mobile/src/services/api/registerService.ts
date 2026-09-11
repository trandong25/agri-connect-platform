import apiClient from "./apiClient"
import type {
    RegisterUserRequest,
    RegisterUserResponse
} from "../../types/register"

export const registerUser = async (
    data: RegisterUserRequest
) => {
    const response =
        await apiClient.post<RegisterUserResponse>(
            "users/",
            data
        )

    return response.data
}