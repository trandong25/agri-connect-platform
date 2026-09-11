import apiClient from "./apiClient"
import type { OrderPayment } from "../../types/order"

export type PaymentSimulationResult =
    | "PAID"
    | "FAILED"

export const simulatePayment = async (
    paymentId: number,
    result: PaymentSimulationResult
) => {
    const response = await apiClient.post<OrderPayment>(
        `payments/${paymentId}/simulate/`,
        { result }
    )

    return response.data
}