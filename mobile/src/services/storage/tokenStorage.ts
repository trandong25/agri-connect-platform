import * as SecureStore from "expo-secure-store"

const ACCESS_TOKEN_KEY = "access_token"
const REFRESH_TOKEN_KEY = "refresh_token"

export const saveTokens = async (access: string, refresh: string) => {
    await Promise.all([
        SecureStore.setItemAsync(ACCESS_TOKEN_KEY, access),
        SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refresh)
    ])
}

export const saveAccessToken = async (access: string) => {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, access)
}

export const getAccessToken = async () => {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY)
}

export const getRefreshToken = async () => {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY)
}

export const removeTokens = async () => {
    await Promise.all([
        SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
        SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY)
    ])
}