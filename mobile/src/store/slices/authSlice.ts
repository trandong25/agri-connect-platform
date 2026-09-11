import axios from "axios"
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"

import {
    getCurrentUser,
    login
} from "../../services/api/authService"
import {
    getRefreshToken,
    removeTokens,
    saveTokens
} from "../../services/storage/tokenStorage"
import type {
    AuthUser,
    LoginRequest
} from "../../types/auth"

type AuthState = {
    user: AuthUser | null
    isAuthenticated: boolean
    isLoading: boolean
    isInitializing: boolean
    error: string | null
}

const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isInitializing: true,
    error: null
}

export const loginUser = createAsyncThunk<
    AuthUser,
    LoginRequest,
    { rejectValue: string }
>(
    "auth/login",
    async (credentials, { rejectWithValue }) => {
        try {
            const response = await login(credentials)

            await saveTokens(
                response.access,
                response.refresh
            )

            return response.user
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const data = error.response?.data as {
                    detail?: string
                    non_field_errors?: string[]
                } | undefined

                return rejectWithValue(
                    data?.non_field_errors?.[0]
                    ?? data?.detail
                    ?? "Đăng nhập thất bại."
                )
            }

            return rejectWithValue(
                "Không thể kết nối đến máy chủ."
            )
        }
    }
)

export const restoreSession = createAsyncThunk<
    AuthUser | null,
    void
>(
    "auth/restoreSession",
    async () => {
        const refreshToken = await getRefreshToken()

        if (!refreshToken) {
            return null
        }

        try {
            return await getCurrentUser()
        } catch {
            await removeTokens()
            return null
        }
    }
)

export const logout = createAsyncThunk(
    "auth/logout",
    async () => {
        await removeTokens()
    }
)

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(restoreSession.pending, state => {
                state.isInitializing = true
            })
            .addCase(restoreSession.fulfilled, (state, action) => {
                state.user = action.payload
                state.isAuthenticated = !!action.payload
                state.isInitializing = false
            })
            .addCase(restoreSession.rejected, state => {
                state.user = null
                state.isAuthenticated = false
                state.isInitializing = false
            })

            .addCase(loginUser.pending, state => {
                state.isLoading = true
                state.error = null
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.user = action.payload
                state.isAuthenticated = true
                state.isLoading = false
                state.error = null
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.isLoading = false
                state.error =
                    action.payload ?? "Đăng nhập thất bại."
            })

            .addCase(logout.fulfilled, state => {
                state.user = null
                state.isAuthenticated = false
                state.error = null
            })
    }
})

export default authSlice.reducer