import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"

import { getProductDetail, getProducts } from "../../services/api/productService"
import type { Product } from "../../types/product"

type ProductState = {
    products: Product[]
    selectedProduct: Product | null
    isLoading: boolean
    isDetailLoading: boolean
    error: string | null
    detailError: string | null
}

const initialState: ProductState = {
    products: [],
    selectedProduct: null,
    isLoading: false,
    isDetailLoading: false,
    error: null,
    detailError: null
}

export const fetchProducts = createAsyncThunk<Product[], void>(
    "product/fetchProducts",
    async () => {
        return await getProducts()
    }
)

export const fetchProductDetail = createAsyncThunk<Product, number>(
    "product/fetchProductDetail",
    async id => {
        return await getProductDetail(id)
    }
)

const productSlice = createSlice({
    name: "product",
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchProducts.pending, state => {
                state.isLoading = true
                state.error = null
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.products = action.payload
                state.isLoading = false
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.error.message ?? "Không thể tải sản phẩm."
            })
            .addCase(fetchProductDetail.pending, state => {
                state.isDetailLoading = true
                state.detailError = null
            })
            .addCase(fetchProductDetail.fulfilled, (state, action) => {
                state.selectedProduct = action.payload
                state.isDetailLoading = false
            })
            .addCase(fetchProductDetail.rejected, (state, action) => {
                state.isDetailLoading = false
                state.detailError = action.error.message ?? "Không thể tải chi tiết sản phẩm."
            })
    }
})

export default productSlice.reducer