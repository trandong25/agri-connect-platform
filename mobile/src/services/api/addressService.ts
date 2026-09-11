import apiClient from "./apiClient"
import type {
    Address,
    AddressWriteRequest
} from "../../types/address"

export const getAddresses = async () => {
    const response = await apiClient.get<Address[]>("addresses/")
    return response.data
}

export const createAddress = async (data: AddressWriteRequest) => {
    const response = await apiClient.post<Address>(
        "addresses/",
        data
    )

    return response.data
}

export const updateAddress = async (
    id: number,
    data: Partial<AddressWriteRequest>
) => {
    const response = await apiClient.patch<Address>(
        `addresses/${id}/`,
        data
    )

    return response.data
}

export const deleteAddress = async (id: number) => {
    await apiClient.delete(`addresses/${id}/`)
}

export const setDefaultAddress = async (id: number) => {
    const response = await apiClient.patch<Address>(
        `addresses/${id}/set-default/`,
        {}
    )

    return response.data
}