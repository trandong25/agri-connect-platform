import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import {
    useFocusEffect,
    useNavigation
} from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useCallback, useState } from "react"
import {
    Alert,
    FlatList,
    Image,
    Pressable,
    View
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import {
    ActivityIndicator,
    Button,
    Chip,
    Surface,
    Text
} from "react-native-paper"

import ScreenHeader from "../../components/common/ScreenHeader"
import type { FarmerStackParamList } from "../../navigation/farmer/FarmerNavigator"
import {
    deleteFarmerProduct,
    getFarmerProducts,
    updateFarmerProduct
} from "../../services/api/farmerProductService"
import type {
    Product,
    ProductStatus
} from "../../types/product"
import {
    farmerColors,
    farmerStyles as styles
} from "./farmerStyles"

export default function FarmerProductsScreen() {
    const navigation =
        useNavigation<NativeStackNavigationProp<FarmerStackParamList>>()

    const [products, setProducts] = useState<Product[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [updatingId, setUpdatingId] = useState<number | null>(null)
    const [error, setError] = useState("")

    const loadProducts = async () => {
        try {
            setIsLoading(true)
            setError("")

            const data = await getFarmerProducts()
            setProducts(data)
        } catch {
            setError("Không thể tải danh sách sản phẩm.")
        } finally {
            setIsLoading(false)
        }
    }

    useFocusEffect(
        useCallback(() => {
            loadProducts()
        }, [])
    )

    const handleAdd = () => {
        navigation.navigate("FarmerProductForm")
    }

    const handleContinue = (product: Product) => {
        if (product.status === "DRAFT") {
            navigation.navigate("FarmerProductImages", {
                productId: product.id
            })

            return
        }

        navigation.navigate("FarmerProductForm", {
            productId: product.id
        })
    }

    const handleStatusChange = (product: Product) => {
        const nextStatus =
            product.status === "AVAILABLE"
                ? "HIDDEN"
                : product.status === "HIDDEN"
                    ? "AVAILABLE"
                    : null

        if (!nextStatus) return

        const isHiding = nextStatus === "HIDDEN"

        Alert.alert(
            isHiding ? "Ẩn sản phẩm" : "Đăng bán lại",
            isHiding
                ? `"${product.name}" sẽ không còn hiển thị cho người mua.`
                : `Bạn muốn đăng bán lại "${product.name}"?`,
            [
                {
                    text: "Hủy",
                    style: "cancel"
                },
                {
                    text: isHiding ? "Ẩn sản phẩm" : "Đăng bán",
                    onPress: async () => {
                        try {
                            setUpdatingId(product.id)

                            const updated = await updateFarmerProduct(
                                product.id,
                                { status: nextStatus }
                            )

                            setProducts(current =>
                                current.map(item =>
                                    item.id === updated.id
                                        ? updated
                                        : item
                                )
                            )
                        } catch {
                            Alert.alert(
                                "Không thể cập nhật",
                                isHiding
                                    ? "Không thể ẩn sản phẩm."
                                    : "Sản phẩm cần có ảnh đạt yêu cầu trước khi đăng bán."
                            )
                        } finally {
                            setUpdatingId(null)
                        }
                    }
                }
            ]
        )
    }

    const handleDelete = (product: Product) => {
        Alert.alert(
            "Xóa sản phẩm",
            `Bạn có chắc chắn muốn xóa "${product.name}"?`,
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
                            setDeletingId(product.id)
                            await deleteFarmerProduct(product.id)

                            setProducts(current =>
                                current.filter(
                                    item => item.id !== product.id
                                )
                            )
                        } catch {
                            Alert.alert(
                                "Không thể xóa",
                                "Sản phẩm chưa được xóa."
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
            <SafeAreaView style={styles.screen} edges={["top"]}>
                <View style={styles.center}>
                    <ActivityIndicator color={farmerColors.primary} />
                    <Text>Đang tải sản phẩm...</Text>
                </View>
            </SafeAreaView>
        )
    }

    if (error) {
        return (
            <SafeAreaView style={styles.screen} edges={["top"]}>
                <View style={styles.center}>
                    <MaterialCommunityIcons
                        name="alert-circle-outline"
                        size={48}
                        color={farmerColors.danger}
                    />

                    <Text style={styles.centerText}>{error}</Text>

                    <Button
                        mode="contained"
                        buttonColor={farmerColors.primary}
                        onPress={loadProducts}
                    >
                        Thử lại
                    </Button>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.screen} edges={["top"]}>
            <ScreenHeader
                eyebrow="NÔNG DÂN"
                title="Sản phẩm của tôi"
                subtitle="Quản lý các nông sản của bạn."
                accentColor={farmerColors.primary}
                textColor={farmerColors.text}
                secondaryColor={farmerColors.textSecondary}
            />

            <Button
                mode="contained"
                icon="plus"
                buttonColor={farmerColors.primary}
                textColor="#FFFFFF"
                style={styles.productListAddButton}
                contentStyle={styles.productListAddButtonContent}
                onPress={handleAdd}
            >
                Thêm sản phẩm
            </Button>

            <View style={styles.productListCount}>
                <Text
                    variant="bodyMedium"
                    style={{ color: farmerColors.textSecondary }}
                >
                    {products.length} sản phẩm
                </Text>
            </View>

            <FlatList
                data={products}
                keyExtractor={item => item.id.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.productListContent}
                ListEmptyComponent={
                    <View style={styles.productListEmpty}>
                        <View style={styles.productListEmptyIcon}>
                            <MaterialCommunityIcons
                                name="basket-outline"
                                size={54}
                                color={farmerColors.primary}
                            />
                        </View>

                        <Text variant="titleLarge" style={styles.bold}>
                            Chưa có sản phẩm
                        </Text>

                        <Text style={styles.centerText}>
                            Hãy thêm nông sản đầu tiên để bắt đầu bán.
                        </Text>

                        <Button
                            mode="contained"
                            icon="plus"
                            buttonColor={farmerColors.primary}
                            onPress={handleAdd}
                        >
                            Thêm sản phẩm đầu tiên
                        </Button>
                    </View>
                }
                renderItem={({ item }) => (
                    <ProductCard
                        product={item}
                        isDeleting={deletingId === item.id}
                        isUpdating={updatingId === item.id}
                        onContinue={() => handleContinue(item)}
                        onStatusChange={() => handleStatusChange(item)}
                        onDelete={() => handleDelete(item)}
                        onPress={() =>
                            navigation.navigate(
                                "FarmerProductDetail",
                                { productId: item.id }
                            )
                        }
                    />
                )}
            />
        </SafeAreaView>
    )
}

function ProductCard({
    product,
    isDeleting,
    isUpdating,
    onContinue,
    onStatusChange,
    onDelete,
    onPress
}: {
    product: Product
    isDeleting: boolean
    isUpdating: boolean
    onContinue: () => void
    onStatusChange: () => void
    onDelete: () => void
    onPress: () => void
}) {
    const [imageError, setImageError] = useState(false)

    const primaryImage =
        product.images.find(image => image.is_primary) ??
        product.images[0]

    const imageUri = primaryImage?.image

    const canDelete = [
        "DRAFT",
        "HIDDEN",
        "REJECTED"
    ].includes(product.status)

    return (
        <Surface elevation={1} style={styles.productListCard}>
            <Pressable
                style={({ pressed }) => [
                    styles.productListMain,
                    pressed && styles.pressed
                ]}
                onPress={onPress}
            >
                {imageUri && !imageError ? (
                    <Image
                        source={{ uri: imageUri }}
                        style={styles.productListImage}
                        resizeMode="cover"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <View
                        style={[
                            styles.productListImage,
                            styles.productListPlaceholder
                        ]}
                    >
                        <MaterialCommunityIcons
                            name="image-outline"
                            size={38}
                            color={farmerColors.primary}
                        />
                    </View>
                )}

                <View style={styles.productListInfo}>
                    <Text
                        variant="titleMedium"
                        numberOfLines={2}
                        style={styles.bold}
                    >
                        {product.name}
                    </Text>

                    <Text
                        variant="bodySmall"
                        style={{ color: farmerColors.textSecondary }}
                    >
                        {product.category_name}
                    </Text>

                    <Text
                        variant="titleMedium"
                        style={styles.productListPrice}
                    >
                        {Number(product.price).toLocaleString("vi-VN")} đ
                        <Text
                            variant="bodySmall"
                            style={{ color: farmerColors.textSecondary }}
                        >
                            {" "}/{product.unit_symbol}
                        </Text>
                    </Text>
                </View>

                <MaterialCommunityIcons
                    name="chevron-right"
                    size={24}
                    color={farmerColors.textSecondary}
                />
            </Pressable>

            <View style={styles.productListFooter}>
                <StatusChip status={product.status} />

                <View style={styles.productListActions}>
                    {product.status === "DRAFT" && (
                        <Button
                            compact
                            mode="text"
                            icon="arrow-right"
                            textColor={farmerColors.primary}
                            onPress={onContinue}
                        >
                            Tiếp tục
                        </Button>
                    )}

                    {product.status === "REJECTED" && (
                        <Button
                            compact
                            mode="text"
                            icon="pencil-outline"
                            textColor={farmerColors.primary}
                            onPress={onContinue}
                        >
                            Chỉnh sửa
                        </Button>
                    )}

                    {product.status === "AVAILABLE" && (
                        <Button
                            compact
                            mode="text"
                            icon="eye-off-outline"
                            textColor={farmerColors.warning}
                            loading={isUpdating}
                            disabled={isUpdating}
                            onPress={onStatusChange}
                        >
                            Ẩn
                        </Button>
                    )}

                    {product.status === "HIDDEN" && (
                        <Button
                            compact
                            mode="text"
                            icon="eye-outline"
                            textColor={farmerColors.primary}
                            loading={isUpdating}
                            disabled={isUpdating}
                            onPress={onStatusChange}
                        >
                            Đăng bán
                        </Button>
                    )}

                    {canDelete && (
                        <Button
                            compact
                            mode="text"
                            icon="delete-outline"
                            textColor={farmerColors.danger}
                            loading={isDeleting}
                            disabled={isDeleting || isUpdating}
                            onPress={onDelete}
                        >
                            Xóa
                        </Button>
                    )}
                </View>
            </View>
        </Surface>
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

    let icon = "file-document-outline"
    let backgroundColor = farmerColors.hiddenSoft
    let textColor = farmerColors.hidden

    if (status === "PENDING") {
        icon = "clock-outline"
        backgroundColor = farmerColors.warningSoft
        textColor = farmerColors.warning
    } else if (status === "AVAILABLE") {
        icon = "check-circle-outline"
        backgroundColor = farmerColors.primarySoft
        textColor = farmerColors.primary
    } else if (status === "HIDDEN") {
        icon = "eye-off-outline"
    } else if (status === "REJECTED") {
        icon = "alert-circle-outline"
        backgroundColor = farmerColors.dangerSoft
        textColor = farmerColors.danger
    }

    return (
        <Chip
            compact
            icon={icon}
            style={{ backgroundColor }}
            textStyle={{ color: textColor }}
        >
            {labels[status]}
        </Chip>
    )
}