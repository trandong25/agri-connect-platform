import type { Product } from "../../types/product"
import apiClient from "./apiClient"

export const getProducts = async () => {
    const response = await apiClient.get<Product[]>("products/")
    return response.data
}

export const getProductDetail = async (id: number) => {
    const response = await apiClient.get<Product>(`products/${id}/`)
    return response.data
}