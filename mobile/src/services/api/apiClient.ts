import axios, { InternalAxiosRequestConfig } from "axios"

import {
    getAccessToken,
    getRefreshToken,
    removeTokens,
    saveAccessToken
} from "../storage/tokenStorage"

const API_BASE_URL = "http://172.30.110.82:8000/"

type RetryConfig = InternalAxiosRequestConfig & {
    _retry?: boolean
}

const apiClient = axios.create({
    baseURL: API_BASE_URL
})

apiClient.interceptors.request.use(async config => {
    const accessToken = await getAccessToken()

    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`
    }

    return config
})

apiClient.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config as RetryConfig | undefined

        if (
            error.response?.status !== 401
            || !originalRequest
            || originalRequest._retry
            || originalRequest.url?.includes("login/")
            || originalRequest.url?.includes("token/refresh/")
        ) {
            return Promise.reject(error)
        }

        originalRequest._retry = true

        const refreshToken = await getRefreshToken()

        if (!refreshToken) {
            return Promise.reject(error)
        }

        try {
            const response = await axios.post<{ access: string }>(
                `${API_BASE_URL}token/refresh/`,
                {
                    refresh: refreshToken
                }
            )

            const accessToken = response.data.access

            await saveAccessToken(accessToken)

            originalRequest.headers.Authorization =
                `Bearer ${accessToken}`

            return apiClient(originalRequest)
        } catch (refreshError) {
            await removeTokens()
            return Promise.reject(refreshError)
        }
    }
)

export default apiClient