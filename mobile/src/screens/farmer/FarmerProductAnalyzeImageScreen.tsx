import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import * as ImagePicker from "expo-image-picker"
import { useState } from "react"
import { Alert, Image, ScrollView, View } from "react-native"
import {
    ActivityIndicator,
    Button,
    Surface,
    Text
} from "react-native-paper"

import type { FarmerStackParamList } from "../../navigation/farmer/FarmerNavigator"
import { analyzeProductImage } from "../../services/api/cvService"
import { uploadFarmerProductImage } from "../../services/api/farmerProductService"
import type {
    CvAnalysisResponse,
    CvImageFile
} from "../../types/cv"
import {
    farmerColors,
    farmerStyles as styles
} from "./farmerStyles"

type Props = NativeStackScreenProps<
    FarmerStackParamList,
    "FarmerProductAnalyzeImage"
>

export default function FarmerProductAnalyzeImageScreen({
    navigation,
    route
}: Props) {
    const { productId, displayOrder } = route.params

    const [image, setImage] = useState<CvImageFile | null>(null)
    const [result, setResult] = useState<CvAnalysisResponse | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState("")

    const analyzeImage = async (file: CvImageFile) => {
        try {
            setIsAnalyzing(true)
            setError("")
            setResult(null)

            const data = await analyzeProductImage(file)
            setResult(data)
        } catch {
            setError(
                "Không thể kiểm tra ảnh. Vui lòng thử lại hoặc chọn ảnh khác."
            )
        } finally {
            setIsAnalyzing(false)
        }
    }

    const handleAsset = async (
        asset: ImagePicker.ImagePickerAsset
    ) => {
        const file: CvImageFile = {
            uri: asset.uri,
            name: asset.fileName ?? `product-${Date.now()}.jpg`,
            type: asset.mimeType ?? "image/jpeg"
        }

        setImage(file)
        await analyzeImage(file)
    }

    const handleTakePhoto = async () => {
        const permission =
            await ImagePicker.requestCameraPermissionsAsync()

        if (!permission.granted) {
            Alert.alert(
                "Cần quyền camera",
                "Ứng dụng cần quyền camera để chụp ảnh sản phẩm."
            )
            return
        }

        const pickerResult = await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            allowsEditing: false,
            quality: 0.9
        })

        if (pickerResult.canceled) return

        await handleAsset(pickerResult.assets[0])
    }

    const handleChooseImage = async () => {
        const permission =
            await ImagePicker.requestMediaLibraryPermissionsAsync()

        if (!permission.granted) {
            Alert.alert(
                "Cần quyền thư viện ảnh",
                "Ứng dụng cần quyền truy cập thư viện để chọn ảnh sản phẩm."
            )
            return
        }

        const pickerResult =
            await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsEditing: false,
                quality: 0.9
            })

        if (pickerResult.canceled) return

        await handleAsset(pickerResult.assets[0])
    }

    const handleUseImage = async () => {
        if (!image || !result?.can_continue) return

        try {
            setIsSaving(true)
            setError("")

            await uploadFarmerProductImage(
                productId,
                image,
                displayOrder
            )

            navigation.goBack()
        } catch {
            setError(
                "Không thể lưu ảnh. Vui lòng thử lại hoặc chọn ảnh khác."
            )
        } finally {
            setIsSaving(false)
        }
    }

    const handleReset = () => {
        setImage(null)
        setResult(null)
        setError("")
    }

    return (
        <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.analyzeContent}
            showsVerticalScrollIndicator={false}
        >
            <Surface elevation={0} style={styles.analyzeGuide}>
                <MaterialCommunityIcons
                    name="image-check-outline"
                    size={34}
                    color={farmerColors.primary}
                />

                <View style={styles.analyzeGuideContent}>
                    <Text variant="titleMedium" style={styles.bold}>
                        Kiểm tra ảnh sản phẩm
                    </Text>

                    <Text
                        variant="bodyMedium"
                        style={{ color: farmerColors.textSecondary }}
                    >
                        Chụp ảnh rõ, đủ sáng và để sản phẩm dễ nhìn trong khung hình.
                    </Text>
                </View>
            </Surface>

            {!image && (
                <Surface elevation={1} style={styles.analyzeImagePicker}>
                    <View style={styles.analyzeImageIcon}>
                        <MaterialCommunityIcons
                            name="camera-plus-outline"
                            size={60}
                            color={farmerColors.primary}
                        />
                    </View>

                    <Text variant="titleLarge" style={styles.bold}>
                        Thêm ảnh sản phẩm
                    </Text>

                    <Text
                        variant="bodyMedium"
                        style={styles.centerText}
                    >
                        Hệ thống sẽ giúp kiểm tra ảnh có đủ rõ và dễ nhìn hay không.
                    </Text>

                    <View style={styles.analyzeActions}>
                        <Button
                            mode="contained"
                            icon="camera"
                            buttonColor={farmerColors.primary}
                            textColor="#FFFFFF"
                            style={styles.analyzeActionButton}
                            onPress={handleTakePhoto}
                        >
                            Chụp ảnh
                        </Button>

                        <Button
                            mode="outlined"
                            icon="image-outline"
                            textColor={farmerColors.primary}
                            style={styles.analyzeActionButton}
                            onPress={handleChooseImage}
                        >
                            Chọn ảnh
                        </Button>
                    </View>
                </Surface>
            )}

            {image && (
                <Surface elevation={1} style={styles.analyzePreviewCard}>
                    <Image
                        source={{ uri: image.uri }}
                        style={styles.analyzeImage}
                        resizeMode="contain"
                    />

                    {isAnalyzing && (
                        <View style={styles.analyzeLoading}>
                            <ActivityIndicator
                                size="large"
                                color={farmerColors.primary}
                            />

                            <Text variant="titleMedium" style={styles.bold}>
                                Đang kiểm tra ảnh...
                            </Text>

                            <Text
                                variant="bodySmall"
                                style={styles.centerText}
                            >
                                Quá trình này chỉ mất một lúc.
                            </Text>
                        </View>
                    )}
                </Surface>
            )}

            {!!error && (
                <Surface
                    elevation={0}
                    style={[
                        styles.analyzeResultCard,
                        styles.analyzeErrorCard
                    ]}
                >
                    <MaterialCommunityIcons
                        name="alert-circle-outline"
                        size={28}
                        color={farmerColors.danger}
                    />

                    <View style={styles.analyzeResultContent}>
                        <Text variant="titleMedium" style={styles.bold}>
                            Có lỗi xảy ra
                        </Text>

                        <Text>{error}</Text>
                    </View>
                </Surface>
            )}

            {result && !isAnalyzing && (
                <AnalysisResult result={result} />
            )}

            {image &&
                result &&
                !isAnalyzing &&
                result.can_continue && (
                <Button
                    mode="contained"
                    icon="check"
                    buttonColor={farmerColors.primary}
                    textColor="#FFFFFF"
                    loading={isSaving}
                    disabled={isSaving}
                    contentStyle={styles.analyzeContinueButton}
                    onPress={handleUseImage}
                >
                    Dùng ảnh này
                </Button>
            )}

            {image &&
                result &&
                !isAnalyzing &&
                !result.can_continue && (
                <View style={styles.analyzeRetryActions}>
                    <Button
                        mode="contained"
                        icon="camera-retake"
                        buttonColor={farmerColors.primary}
                        textColor="#FFFFFF"
                        style={styles.analyzeActionButton}
                        onPress={handleTakePhoto}
                    >
                        Chụp lại
                    </Button>

                    <Button
                        mode="outlined"
                        icon="image-outline"
                        textColor={farmerColors.primary}
                        style={styles.analyzeActionButton}
                        onPress={handleChooseImage}
                    >
                        Chọn ảnh khác
                    </Button>
                </View>
            )}

            {image && !isAnalyzing && (
                <Button
                    mode="text"
                    icon="close"
                    textColor={farmerColors.textSecondary}
                    onPress={handleReset}
                >
                    Bỏ ảnh này
                </Button>
            )}
        </ScrollView>
    )
}

function AnalysisResult({
    result
}: {
    result: CvAnalysisResponse
}) {
    if (!result.can_continue) {
        return (
            <Surface
                elevation={0}
                style={[
                    styles.analyzeResultCard,
                    styles.analyzeErrorCard
                ]}
            >
                <MaterialCommunityIcons
                    name="camera-retake-outline"
                    size={30}
                    color={farmerColors.danger}
                />

                <View style={styles.analyzeResultContent}>
                    <Text variant="titleMedium" style={styles.bold}>
                        Nên chụp lại ảnh
                    </Text>

                    <Text variant="bodyMedium">
                        Ảnh này chưa đủ rõ để sử dụng.
                    </Text>

                    <Instructions
                        instructions={result.instructions}
                        fallback={result.message}
                    />
                </View>
            </Surface>
        )
    }

    return (
        <Surface elevation={0} style={styles.analyzeSuccessCard}>
            <MaterialCommunityIcons
                name="check-circle-outline"
                size={30}
                color={farmerColors.primary}
            />

            <View style={styles.analyzeResultContent}>
                <Text variant="titleMedium" style={styles.bold}>
                    Ảnh có thể sử dụng
                </Text>

                <Text variant="bodyMedium">
                    Ảnh đã đủ điều kiện để thêm vào sản phẩm.
                </Text>

                <Instructions instructions={result.instructions} />
            </View>
        </Surface>
    )
}

function Instructions({
    instructions,
    fallback
}: {
    instructions?: string[]
    fallback?: string
}) {
    if (!instructions?.length) {
        if (!fallback) return null

        return (
            <Text
                variant="bodySmall"
                style={{ color: farmerColors.textSecondary }}
            >
                {fallback}
            </Text>
        )
    }

    return (
        <View style={styles.analyzeInstructions}>
            {instructions.map((instruction, index) => (
                <View
                    key={`${instruction}-${index}`}
                    style={styles.analyzeInstructionRow}
                >
                    <MaterialCommunityIcons
                        name="lightbulb-outline"
                        size={17}
                        color={farmerColors.warning}
                    />

                    <Text
                        variant="bodySmall"
                        style={styles.analyzeInstructionText}
                    >
                        {instruction}
                    </Text>
                </View>
            ))}
        </View>
    )
}