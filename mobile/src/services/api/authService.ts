import type {
    AuthUser,
    LoginRequest,
    LoginResponse
} from "../../types/auth"
import apiClient from "./apiClient"

export const login = async (data: LoginRequest) => {
    const response = await apiClient.post<LoginResponse>("login/", data)
    return response.data
}

export const getCurrentUser = async () => {
    const response = await apiClient.get<AuthUser>("users/current-user/")
    return response.data
}