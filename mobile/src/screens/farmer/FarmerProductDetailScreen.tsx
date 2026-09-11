import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { useFocusEffect } from "@react-navigation/native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import axios from "axios"
import { useCallback, useState } from "react"
import {
    Alert,
    Image,
    ScrollView,
    View
} from "react-native"
import {
    ActivityIndicator,
    Button,
    Chip,
    Surface,
    Text
} from "react-native-paper"

import type { FarmerStackParamList } from "../../navigation/farmer/FarmerNavigator"
import {getFarmerProductDetail,updateFarmerProduct} from "../../services/api/farmerProductService"
import type {Product,ProductStatus}
from "../../types/product"
import {farmerColors,farmerStyles as styles} from "./farmerStyles"

type Props = NativeStackScreenProps<
    FarmerStackParamList,
    "FarmerProductDetail"
>

export default function FarmerProductDetailScreen({
    navigation,
    route
}: Props) {
    const { productId } = route.params

    const [product, setProduct] = useState<Product | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isUpdating, setIsUpdating] = useState(false)
    const [imageError, setImageError] = useState(false)
    const [error, setError] = useState("")

    const loadProduct = async () => {
        try {
            setIsLoading(true)
            setError("")

            const data = await getFarmerProductDetail(productId)
            setProduct(data)
            setImageError(false)
        } catch {
            setError("Không thể tải chi tiết sản phẩm.")
        } finally {
            setIsLoading(false)
        }
    }

    useFocusEffect(
        useCallback(() => {
            loadProduct()
        }, [productId])
    )

    const handleStatusChange = () => {
        if (!product) return

        const nextStatus =
            product.status === "AVAILABLE"
                ? "HIDDEN"
                : product.status === "DRAFT" ||
                    product.status === "HIDDEN"
                    ? "AVAILABLE"
                    : null

        if (!nextStatus) return

        const isHiding = nextStatus === "HIDDEN"

        Alert.alert(
            isHiding
                ? "Ẩn sản phẩm"
                : product.status === "HIDDEN"
                    ? "Đăng bán lại"
                    : "Đăng bán sản phẩm",
            isHiding
                ? "Sản phẩm sẽ không còn hiển thị cho người mua."
                : "Bạn muốn đưa sản phẩm này lên gian hàng?",
            [
                {
                    text: "Hủy",
                    style: "cancel"
                },
                {
                    text: isHiding ? "Ẩn sản phẩm" : "Đăng bán",
                    onPress: async () => {
                        try {
                            setIsUpdating(true)

                           const updated = await updateFarmerProduct(
                                product.id,
                                { status: nextStatus }
                            )

                            setProduct(updated)

                            if (nextStatus === "AVAILABLE") {
                                navigation.navigate("FarmerTabs", {
                                    screen: "Products"
                                })
                            }
                        } catch (requestError) {
                            Alert.alert(
                                "Không thể cập nhật",
                                getErrorMessage(requestError)
                            )
                        } finally {
                            setIsUpdating(false)
                        }
                    }
                }
            ]
        )
    }

    if (isLoading && !product) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={farmerColors.primary} />
                <Text>Đang tải sản phẩm...</Text>
            </View>
        )
    }

    if (error || !product) {
        return (
            <View style={styles.center}>
                <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={48}
                    color={farmerColors.danger}
                />

                <Text style={styles.centerText}>
                    {error || "Không tìm thấy sản phẩm."}
                </Text>

                <Button
                    mode="contained"
                    buttonColor={farmerColors.primary}
                    onPress={loadProduct}
                >
                    Thử lại
                </Button>
            </View>
        )
    }

    const primaryImage =
        product.images.find(image => image.is_primary) ??
        product.images[0]

    const usableImages = product.images.filter(
        image => image.quality_result?.is_acceptable
    ).length

    const canPublish =
        usableImages > 0 &&
        (product.status === "DRAFT" ||
            product.status === "HIDDEN")

    return (
        <View style={styles.screen}>
            <ScrollView
                contentContainerStyle={styles.detailContent}
                showsVerticalScrollIndicator={false}
            >
                {primaryImage && !imageError ? (
                    <Image
                        source={{ uri: primaryImage.image }}
                        style={styles.detailMainImage}
                        resizeMode="cover"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <View
                        style={[
                            styles.detailMainImage,
                            styles.detailImagePlaceholder
                        ]}
                    >
                        <MaterialCommunityIcons
                            name="image-outline"
                            size={64}
                            color={farmerColors.primary}
                        />

                        <Text style={styles.centerText}>
                            Chưa có ảnh sản phẩm
                        </Text>
                    </View>
                )}

                <Surface elevation={1} style={styles.detailSection}>
                    <View style={styles.detailProductTop}>
                        <View style={styles.detailProductName}>
                            <Text
                                variant="headlineSmall"
                                style={styles.title}
                            >
                                {product.name}
                            </Text>

                            <Text
                                variant="bodyMedium"
                                style={{ color: farmerColors.textSecondary }}
                            >
                                {product.category_name}
                            </Text>
                        </View>

                        <StatusChip status={product.status} />
                    </View>

                    <Text
                        variant="headlineSmall"
                        style={styles.detailPrice}
                    >
                        {Number(product.price).toLocaleString("vi-VN")} đ
                        <Text
                            variant="bodyMedium"
                            style={{ color: farmerColors.textSecondary }}
                        >
                            {" "}/{product.unit_symbol}
                        </Text>
                    </Text>
                </Surface>

                {product.status === "REJECTED" &&
                    !!product.rejection_reason && (
                    <Surface
                        elevation={0}
                        style={styles.detailRejection}
                    >
                        <MaterialCommunityIcons
                            name="alert-circle-outline"
                            size={22}
                            color={farmerColors.danger}
                        />

                        <View style={styles.detailRejectionInfo}>
                            <Text
                                variant="titleSmall"
                                style={{
                                    color: farmerColors.danger,
                                    fontWeight: "700"
                                }}
                            >
                                Sản phẩm bị từ chối
                            </Text>

                            <Text style={{ color: farmerColors.danger }}>
                                {product.rejection_reason}
                            </Text>
                        </View>
                    </Surface>
                )}

                <Surface elevation={1} style={styles.detailSection}>
                    <SectionTitle
                        icon="information-outline"
                        title="Thông tin sản phẩm"
                    />

                    <InfoRow
                        label="Nhà vườn"
                        value={product.farmer_name}
                    />

                    <InfoRow
                        label="Nguồn gốc"
                        value={product.origin || "Chưa cập nhật"}
                    />

                    <InfoRow
                        label="Tồn kho"
                        value={`${Number(product.stock_quantity)} ${product.unit_symbol}`}
                    />

                    <InfoRow
                        label="Mua tối thiểu"
                        value={`${Number(product.minimum_order_quantity)} ${product.unit_symbol}`}
                    />

                    <InfoRow
                        label="Ngày thu hoạch"
                        value={
                            product.harvest_date
                                ? formatDate(product.harvest_date)
                                : "Chưa cập nhật"
                        }
                    />

                    <InfoRow
                        label="Hạn sử dụng"
                        value={
                            product.expiry_date
                                ? formatDate(product.expiry_date)
                                : "Chưa cập nhật"
                        }
                    />
                </Surface>

                <Surface elevation={1} style={styles.detailSection}>
                    <SectionTitle
                        icon="text-box-outline"
                        title="Mô tả"
                    />

                    <Text
                        style={{
                            color: product.description
                                ? farmerColors.text
                                : farmerColors.textSecondary
                        }}
                    >
                        {product.description || "Chưa có mô tả sản phẩm."}
                    </Text>
                </Surface>

                <Surface elevation={1} style={styles.detailSection}>
                    <SectionTitle
                        icon="image-outline"
                        title="Ảnh sản phẩm"
                    />

                    <View style={styles.detailImageSummary}>
                        <View style={styles.detailImageSummaryIcon}>
                            <MaterialCommunityIcons
                                name={
                                    usableImages > 0
                                        ? "check-circle-outline"
                                        : "image-outline"
                                }
                                size={28}
                                color={farmerColors.primary}
                            />
                        </View>

                        <View style={{ flex: 1 }}>
                            <Text variant="titleSmall" style={styles.bold}>
                                {product.images.length} ảnh đã thêm
                            </Text>

                            <Text
                                variant="bodySmall"
                                style={{ color: farmerColors.textSecondary }}
                            >
                                {usableImages > 0
                                    ? `${usableImages} ảnh có thể sử dụng`
                                    : "Hãy thêm ít nhất một ảnh đạt yêu cầu"}
                            </Text>
                        </View>
                    </View>

                    <Button
                        mode="outlined"
                        icon="image-multiple-outline"
                        textColor={farmerColors.primary}
                        style={styles.detailOutlineButton}
                        onPress={() =>
                            navigation.navigate(
                                "FarmerProductImages",
                                { productId: product.id }
                            )
                        }
                    >
                        Quản lý ảnh
                    </Button>
                </Surface>

                {!canPublish &&
                    (product.status === "DRAFT" ||
                        product.status === "HIDDEN") && (
                    <Surface
                        elevation={0}
                        style={styles.detailWarning}
                    >
                        <MaterialCommunityIcons
                            name="information-outline"
                            size={20}
                            color={farmerColors.warning}
                        />

                        <Text style={styles.detailWarningText}>
                            Cần ít nhất một ảnh có thể sử dụng trước khi đăng bán.
                        </Text>
                    </Surface>
                )}

                {canPublish && (
                    <Button
                        mode="contained"
                        icon="check-circle-outline"
                        buttonColor={farmerColors.primary}
                        textColor="#FFFFFF"
                        loading={isUpdating}
                        disabled={isUpdating}
                        contentStyle={styles.detailActionContent}
                        onPress={handleStatusChange}
                    >
                        {product.status === "HIDDEN"
                            ? "Đăng bán lại"
                            : "Đăng bán sản phẩm"}
                    </Button>
                )}

                {product.status === "AVAILABLE" && (
                    <Button
                        mode="outlined"
                        icon="eye-off-outline"
                        textColor={farmerColors.warning}
                        style={styles.detailWarningButton}
                        contentStyle={styles.detailActionContent}
                        loading={isUpdating}
                        disabled={isUpdating}
                        onPress={handleStatusChange}
                    >
                        Ẩn sản phẩm
                    </Button>
                )}

                <Button
                    mode="outlined"
                    icon="pencil-outline"
                    textColor={farmerColors.primary}
                    style={styles.detailOutlineButton}
                    contentStyle={styles.detailActionContent}
                    onPress={() =>
                        navigation.navigate("FarmerProductForm", {
                            productId: product.id
                        })
                    }
                >
                    Chỉnh sửa thông tin
                </Button>
            </ScrollView>
        </View>
    )
}

function SectionTitle({
    icon,
    title
}: {
    icon: keyof typeof MaterialCommunityIcons.glyphMap
    title: string
}) {
    return (
        <View style={styles.detailTitleRow}>
            <MaterialCommunityIcons
                name={icon}
                size={22}
                color={farmerColors.primary}
            />

            <Text variant="titleMedium" style={styles.bold}>
                {title}
            </Text>
        </View>
    )
}

function InfoRow({
    label,
    value
}: {
    label: string
    value: string
}) {
    return (
        <View style={styles.detailInfoRow}>
            <Text
                variant="bodyMedium"
                style={{ color: farmerColors.textSecondary }}
            >
                {label}
            </Text>

            <Text
                variant="bodyMedium"
                style={styles.detailInfoValue}
            >
                {value}
            </Text>
        </View>
    )
}

function StatusChip({
    status
}: {
    status: ProductStatus
}) {
    const labels: Record<ProductStatus, string> = {
        DRAFT: "Bản nháp",
        PENDING: "Chờ duyệt",
        AVAILABLE: "Đang bán",
        HIDDEN: "Đã ẩn",
        REJECTED: "Bị từ chối"
    }

    let backgroundColor = farmerColors.hiddenSoft
    let textColor = farmerColors.hidden

    if (status === "AVAILABLE") {
        backgroundColor = farmerColors.primarySoft
        textColor = farmerColors.primary
    } else if (status === "PENDING") {
        backgroundColor = farmerColors.warningSoft
        textColor = farmerColors.warning
    } else if (status === "REJECTED") {
        backgroundColor = farmerColors.dangerSoft
        textColor = farmerColors.danger
    }

    return (
        <Chip
            compact
            style={{ backgroundColor }}
            textStyle={{ color: textColor }}
        >
            {labels[status]}
        </Chip>
    )
}

function formatDate(value: string) {
    const [year, month, day] = value.split("-")
    return `${day}/${month}/${year}`
}

function getErrorMessage(error: unknown) {
    if (!axios.isAxiosError(error)) {
        return "Không thể cập nhật sản phẩm."
    }

    const data = error.response?.data

    if (
        data &&
        typeof data === "object"
    ) {
        if (
            "detail" in data &&
            typeof data.detail === "string"
        ) {
            return data.detail
        }

        for (const value of Object.values(data)) {
            if (
                Array.isArray(value) &&
                typeof value[0] === "string"
            ) {
                return value[0]
            }

            if (typeof value === "string") {
                return value
            }
        }
    }

    return "Không thể cập nhật sản phẩm."
}