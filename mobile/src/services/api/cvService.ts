import apiClient from "./apiClient"
import type {
    CvAnalysisResponse,
    CvImageFile
} from "../../types/cv"

export const analyzeProductImage = async (
    file: CvImageFile
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

    const response =
        await apiClient.post<CvAnalysisResponse>(
            "farmer-products/analyze-image/",
            formData
        )

    return response.data
}