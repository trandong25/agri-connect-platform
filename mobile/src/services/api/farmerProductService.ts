import apiClient from "./apiClient"
import type {
    Category,
    CreateProductRequest,
    Product,
    ProductImage,
    Unit,
    UpdateProductRequest
} from "../../types/product"

export const getCategories = async () => {
    const response = await apiClient.get<Category[]>("categories/")
    return response.data
}

export const getUnits = async () => {
    const response = await apiClient.get<Unit[]>("units/")
    return response.data
}

export const getFarmerProducts = async () => {
    const response = await apiClient.get<Product[]>("farmer-products/")
    return response.data
}

export const getFarmerProductDetail = async (id: number) => {
    const response = await apiClient.get<Product>(
        `farmer-products/${id}/`
    )

    return response.data
}

export const createFarmerProduct = async (
    data: CreateProductRequest
) => {
    const response = await apiClient.post<Product>(
        "farmer-products/",
        data
    )

    return response.data
}

export const updateFarmerProduct = async (
    id: number,
    data: UpdateProductRequest
) => {
    const response = await apiClient.patch<Product>(
        `farmer-products/${id}/`,
        data
    )

    return response.data
}

export const deleteFarmerProduct = async (id: number) => {
    await apiClient.delete(`farmer-products/${id}/`)
}

export type ProductImageFile = {
    uri: string
    name: string
    type: string
}

export const getFarmerProductImages = async (
    productId: number
) => {
    const response = await apiClient.get<ProductImage[]>(
        `farmer-products/${productId}/images/`
    )

    return response.data
}

export const uploadFarmerProductImage = async (
    productId: number,
    file: ProductImageFile,
    displayOrder: number
) => {
    const formData = new FormData()

    formData.append(
        "image",
        {
            uri: file.uri,
            name: file.name,
            type: file.type
        } as any
    )

    formData.append("display_order", String(displayOrder))

    const response = await apiClient.post<ProductImage>(
        `farmer-products/${productId}/images/`,
        formData
    )

    return response.data
}

export const setFarmerProductPrimaryImage = async (
    productId: number,
    imageId: number
) => {
    const response = await apiClient.post<ProductImage>(
        `farmer-products/${productId}/images/${imageId}/primary/`
    )

    return response.data
}

export const deleteFarmerProductImage = async (
    productId: number,
    imageId: number
) => {
    await apiClient.delete(
        `farmer-products/${productId}/images/${imageId}/`
    )
}