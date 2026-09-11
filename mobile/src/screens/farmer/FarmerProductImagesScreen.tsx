import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { useFocusEffect } from "@react-navigation/native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useCallback, useState } from "react"
import {
    Alert,
    FlatList,
    Image,
    View
} from "react-native"
import {
    ActivityIndicator,
    Button,
    IconButton,
    Surface,
    Text
} from "react-native-paper"

import type { FarmerStackParamList } from "../../navigation/farmer/FarmerNavigator"
import {
    deleteFarmerProductImage,
    getFarmerProductImages,
    setFarmerProductPrimaryImage
} from "../../services/api/farmerProductService"
import type { ProductImage } from "../../types/product"
import {
    farmerColors,
    farmerStyles as styles
} from "./farmerStyles"

type Props = NativeStackScreenProps<
    FarmerStackParamList,
    "FarmerProductImages"
>

export default function FarmerProductImagesScreen({
    navigation,
    route
}: Props) {
    const { productId } = route.params

    const [images, setImages] = useState<ProductImage[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [settingPrimaryId, setSettingPrimaryId] =
        useState<number | null>(null)
    const [error, setError] = useState("")

    const loadImages = async () => {
        try {
            setIsLoading(true)
            setError("")

            const data = await getFarmerProductImages(productId)
            setImages(data)
        } catch {
            setError("Không thể tải ảnh sản phẩm.")
        } finally {
            setIsLoading(false)
        }
    }

    useFocusEffect(
        useCallback(() => {
            loadImages()
        }, [productId])
    )

    const handleAddImage = () => {
        navigation.navigate("FarmerProductAnalyzeImage", {
            productId,
            displayOrder: images.length
        })
    }

    const handleSetPrimary = async (image: ProductImage) => {
        try {
            setSettingPrimaryId(image.id)

            await setFarmerProductPrimaryImage(productId, image.id)

            setImages(current =>
                current.map(item => ({
                    ...item,
                    is_primary: item.id === image.id
                }))
            )
        } catch {
            Alert.alert(
                "Không thể chọn ảnh chính",
                "Vui lòng chọn một ảnh đã đạt yêu cầu."
            )
        } finally {
            setSettingPrimaryId(null)
        }
    }

    const handleDelete = (image: ProductImage) => {
        Alert.alert(
            "Xóa ảnh",
            "Bạn có chắc chắn muốn xóa ảnh này?",
            [
                {
                    text: "Hủy",
                    style: "cancel"
                },
                {
                    text: "Xóa",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setDeletingId(image.id)

                            await deleteFarmerProductImage(
                                productId,
                                image.id
                            )

                            const data = await getFarmerProductImages(productId)
                            setImages(data)
                        } catch {
                            Alert.alert(
                                "Không thể xóa",
                                "Ảnh chưa được xóa."
                            )
                        } finally {
                            setDeletingId(null)
                        }
                    }
                }
            ]
        )
    }

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={farmerColors.primary} />
                <Text>Đang tải ảnh sản phẩm...</Text>
            </View>
        )
    }

    return (
        <View style={styles.screen}>
            <View style={styles.imagesContent}>
                <Surface elevation={0} style={styles.imagesGuide}>
                    <MaterialCommunityIcons
                        name="camera-plus-outline"
                        size={29}
                        color={farmerColors.primary}
                    />

                    <View style={styles.imagesGuideText}>
                        <Text variant="titleMedium" style={styles.bold}>
                            Ảnh sản phẩm
                        </Text>

                        <Text
                            variant="bodySmall"
                            style={{ color: farmerColors.textSecondary }}
                        >
                            Thêm nhiều ảnh rõ ràng và chọn một ảnh đẹp nhất làm ảnh chính.
                        </Text>
                    </View>
                </Surface>

                <Button
                    mode="contained"
                    icon="camera-plus-outline"
                    buttonColor={farmerColors.primary}
                    textColor="#FFFFFF"
                    contentStyle={styles.imagesAddButton}
                    onPress={handleAddImage}
                >
                    {images.length > 0
                        ? "Thêm ảnh khác"
                        : "Thêm và kiểm tra ảnh"}
                </Button>

                {!!error && (
                    <Surface elevation={0} style={styles.imagesErrorBox}>
                        <MaterialCommunityIcons
                            name="alert-circle-outline"
                            size={20}
                            color={farmerColors.danger}
                        />

                        <Text style={styles.imagesErrorText}>
                            {error}
                        </Text>
                    </Surface>
                )}

                <View style={styles.imagesListHeader}>
                    <Text variant="titleMedium" style={styles.bold}>
                        Ảnh đã thêm
                    </Text>

                    <Text
                        variant="bodySmall"
                        style={{ color: farmerColors.textSecondary }}
                    >
                        {images.length} ảnh
                    </Text>
                </View>
            </View>

            <FlatList
                data={images}
                keyExtractor={item => item.id.toString()}
                numColumns={2}
                key="product-images-2"
                showsVerticalScrollIndicator={false}
                columnWrapperStyle={styles.imagesRow}
                contentContainerStyle={styles.imagesList}
                ListEmptyComponent={
                    <View style={styles.imagesEmpty}>
                        <View style={styles.imagesEmptyIcon}>
                            <MaterialCommunityIcons
                                name="image-plus-outline"
                                size={54}
                                color={farmerColors.primary}
                            />
                        </View>

                        <Text variant="titleMedium" style={styles.bold}>
                            Chưa có ảnh
                        </Text>

                        <Text
                            variant="bodyMedium"
                            style={styles.imagesEmptyText}
                        >
                            Thêm ảnh để người mua dễ xem sản phẩm hơn.
                        </Text>
                    </View>
                }
                renderItem={({ item, index }) => (
                    <ProductImageCard
                        image={item}
                        index={index}
                        isDeleting={deletingId === item.id}
                        isSettingPrimary={settingPrimaryId === item.id}
                        onDelete={() => handleDelete(item)}
                        onSetPrimary={() => handleSetPrimary(item)}
                    />
                )}
            />

            {images.length > 0 && (
                <View style={styles.imagesBottom}>
                    <Button
                        mode="contained"
                        icon="arrow-right"
                        buttonColor={farmerColors.primary}
                        textColor="#FFFFFF"
                        contentStyle={styles.imagesAddButton}
                        onPress={() =>
                            navigation.navigate("FarmerProductDetail", {
                                productId
                            })
                        }
                    >
                        Xem sản phẩm
                    </Button>
                </View>
            )}
        </View>
    )
}

function ProductImageCard({
    image,
    index,
    isDeleting,
    isSettingPrimary,
    onDelete,
    onSetPrimary
}: {
    image: ProductImage
    index: number
    isDeleting: boolean
    isSettingPrimary: boolean
    onDelete: () => void
    onSetPrimary: () => void
}) {
    const [imageError, setImageError] = useState(false)
    const quality = image.quality_result

    return (
        <Surface elevation={1} style={styles.imagesCard}>
            <View>
                {!imageError ? (
                    <Image
                        source={{ uri: image.image }}
                        style={styles.imagesImage}
                        resizeMode="cover"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <View
                        style={[
                            styles.imagesImage,
                            styles.imagesImageFallback
                        ]}
                    >
                        <MaterialCommunityIcons
                            name="image-outline"
                            size={40}
                            color={farmerColors.primary}
                        />
                    </View>
                )}

                <IconButton
                    icon="delete-outline"
                    size={19}
                    iconColor={farmerColors.danger}
                    containerColor={farmerColors.surface}
                    style={styles.imagesDeleteButton}
                    loading={isDeleting}
                    disabled={isDeleting}
                    onPress={onDelete}
                />
            </View>

            <View style={styles.imagesInfo}>
                <View style={styles.imagesTitle}>
                    <Text variant="titleSmall" style={styles.bold}>
                        Ảnh {index + 1}
                    </Text>

                    {image.is_primary && (
                        <Text
                            variant="labelSmall"
                            style={styles.imagesPrimaryLabel}
                        >
                            Ảnh chính
                        </Text>
                    )}
                </View>

                <ImageStatus image={image} />

                {!image.is_primary &&
                    quality?.is_acceptable === true && (
                    <Button
                        compact
                        mode="text"
                        icon="image-outline"
                        textColor={farmerColors.primary}
                        loading={isSettingPrimary}
                        disabled={isSettingPrimary}
                        onPress={onSetPrimary}
                    >
                        Làm ảnh chính
                    </Button>
                )}
            </View>
        </Surface>
    )
}

function ImageStatus({
    image
}: {
    image: ProductImage
}) {
    const quality = image.quality_result

    if (!quality) {
        return (
            <View style={styles.imagesQualityRow}>
                <MaterialCommunityIcons
                    name="clock-outline"
                    size={16}
                    color={farmerColors.warning}
                />

                <Text
                    variant="bodySmall"
                    style={{ color: farmerColors.warning }}
                >
                    Chưa kiểm tra
                </Text>
            </View>
        )
    }

    const accepted = quality.is_acceptable

    return (
        <View style={styles.imagesQualityRow}>
            <MaterialCommunityIcons
                name={
                    accepted
                        ? "check-circle-outline"
                        : "alert-circle-outline"
                }
                size={16}
                color={
                    accepted
                        ? farmerColors.primary
                        : farmerColors.danger
                }
            />

            <Text
                variant="bodySmall"
                style={{
                    color: accepted
                        ? farmerColors.primary
                        : farmerColors.danger
                }}
            >
                {accepted
                    ? "Có thể sử dụng"
                    : "Nên thay ảnh"}
            </Text>
        </View>
    )
}