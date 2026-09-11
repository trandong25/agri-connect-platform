import axios from "axios"
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"

import {
    addCartItem,
    deleteCartItem,
    getCart,
    updateCartItem
} from "../../services/api/cartService"
import type {
    AddCartItemRequest,
    Cart,
    UpdateCartItemRequest
} from "../../types/cart"

type CartState = {
    cart: Cart | null
    isLoading: boolean
    isMutating: boolean
    error: string | null
}

const initialState: CartState = {
    cart: null,
    isLoading: false,
    isMutating: false,
    error: null
}

const getErrorMessage = (error: unknown) => {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as Record<string, unknown> | undefined

        if (typeof data?.detail === "string") {
            return data.detail
        }

        for (const value of Object.values(data ?? {})) {
            if (Array.isArray(value) && typeof value[0] === "string") {
                return value[0]
            }

            if (typeof value === "string") {
                return value
            }
        }
    }

    return "Đã xảy ra lỗi. Vui lòng thử lại."
}

export const fetchCart = createAsyncThunk<
    Cart,
    void,
    { rejectValue: string }
>(
    "cart/fetchCart",
    async (_, { rejectWithValue }) => {
        try {
            return await getCart()
        } catch (error) {
            return rejectWithValue(getErrorMessage(error))
        }
    }
)

export const addItemToCart = createAsyncThunk<
    Cart,
    AddCartItemRequest,
    { rejectValue: string }
>(
    "cart/addItem",
    async (data, { rejectWithValue }) => {
        try {
            const response = await addCartItem(data)
            return response.cart
        } catch (error) {
            return rejectWithValue(getErrorMessage(error))
        }
    }
)

export const changeCartItemQuantity = createAsyncThunk<
    Cart,
    UpdateCartItemRequest,
    { rejectValue: string }
>(
    "cart/changeQuantity",
    async ({ itemId, quantity }, { rejectWithValue }) => {
        try {
            const response = await updateCartItem(itemId, quantity)
            return response.cart
        } catch (error) {
            return rejectWithValue(getErrorMessage(error))
        }
    }
)

export const removeItemFromCart = createAsyncThunk<
    Cart,
    number,
    { rejectValue: string }
>(
    "cart/removeItem",
    async (itemId, { rejectWithValue }) => {
        try {
            const response = await deleteCartItem(itemId)
            return response.cart
        } catch (error) {
            return rejectWithValue(getErrorMessage(error))
        }
    }
)

const cartSlice = createSlice({
    name: "cart",
    initialState,
    reducers: {
        resetCart: state => {
            state.cart = null
            state.error = null
        }
    },
    extraReducers: builder => {
        builder
            .addCase(fetchCart.pending, state => {
                state.isLoading = true
                state.error = null
            })
            .addCase(fetchCart.fulfilled, (state, action) => {
                state.cart = action.payload
                state.isLoading = false
            })
            .addCase(fetchCart.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.payload ?? "Không thể tải giỏ hàng."
            })

            .addCase(addItemToCart.pending, state => {
                state.isMutating = true
                state.error = null
            })
            .addCase(addItemToCart.fulfilled, (state, action) => {
                state.cart = action.payload
                state.isMutating = false
            })
            .addCase(addItemToCart.rejected, (state, action) => {
                state.isMutating = false
                state.error = action.payload ?? "Không thể thêm sản phẩm."
            })

            .addCase(changeCartItemQuantity.pending, state => {
                state.isMutating = true
                state.error = null
            })
            .addCase(changeCartItemQuantity.fulfilled, (state, action) => {
                state.cart = action.payload
                state.isMutating = false
            })
            .addCase(changeCartItemQuantity.rejected, (state, action) => {
                state.isMutating = false
                state.error = action.payload ?? "Không thể cập nhật số lượng."
            })

            .addCase(removeItemFromCart.pending, state => {
                state.isMutating = true
                state.error = null
            })
            .addCase(removeItemFromCart.fulfilled, (state, action) => {
                state.cart = action.payload
                state.isMutating = false
            })
            .addCase(removeItemFromCart.rejected, (state, action) => {
                state.isMutating = false
                state.error = action.payload ?? "Không thể xóa sản phẩm."
            })
    }
})

export const { resetCart } = cartSlice.actions
export default cartSlice.reducer