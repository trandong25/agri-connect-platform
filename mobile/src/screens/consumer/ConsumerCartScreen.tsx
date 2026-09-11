import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs"
import {
    useFocusEffect,
    useNavigation
} from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import axios from "axios"
import { useCallback, useMemo, useState } from "react"
import {
    Alert,
    FlatList,
    Image,
    Pressable,
    RefreshControl,
    StyleSheet,
    View
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import {
    ActivityIndicator,
    Button,
    Checkbox,
    Divider,
    Surface,
    Text
} from "react-native-paper"

import type { ConsumerStackParamList } from "../../navigation/consumer/ConsumerNavigator"
import type { ConsumerTabParamList } from "../../navigation/consumer/ConsumerTabNavigator"
import {
    deleteCartItem,
    getCart,
    updateCartItem
} from "../../services/api/cartService"
import type { Cart, CartItem } from "../../types/cart"
import {
    consumerColors,
    consumerStyles
} from "./consumerStyles"

export default function ConsumerCartScreen() {
    const navigation =
        useNavigation<
            BottomTabNavigationProp<ConsumerTabParamList, "Cart">
        >()

    const [cart, setCart] = useState<Cart | null>(null)
    const [selectedIds, setSelectedIds] = useState<number[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [updatingItemId, setUpdatingItemId] = useState<number | null>(null)
    const [error, setError] = useState("")

    const loadCart = useCallback(async (refreshing = false) => {
        try {
            refreshing ? setIsRefreshing(true) : setIsLoading(true)
            setError("")

            const data = await getCart()

            setCart(data)
            setSelectedIds(data.items.map(item => item.id))
        } catch {
            setError("Không thể tải giỏ hàng.")
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }, [])

    useFocusEffect(
        useCallback(() => {
            loadCart()
        }, [loadCart])
    )

    const items = cart?.items ?? []

    const selectedItems = useMemo(
        () => items.filter(item => selectedIds.includes(item.id)),
        [items, selectedIds]
    )

    const selectedTotal = useMemo(
        () =>
            selectedItems.reduce(
                (total, item) => total + Number(item.subtotal),
                0
            ),
        [selectedItems]
    )

    const allSelected =
        items.length > 0
        && selectedIds.length === items.length

    const partiallySelected =
        selectedIds.length > 0
        && selectedIds.length < items.length

    const toggleItem = (itemId: number) => {
        setSelectedIds(current =>
            current.includes(itemId)
                ? current.filter(id => id !== itemId)
                : [...current, itemId]
        )
    }

    const toggleAll = () => {
        setSelectedIds(
            allSelected
                ? []
                : items.map(item => item.id)
        )
    }

    const handleIncrease = async (item: CartItem) => {
        const quantity = Number(item.quantity)
        const step = Number(item.product.minimum_order_quantity)

        await changeQuantity(item, quantity + step)
    }

    const handleDecrease = (item: CartItem) => {
        const quantity = Number(item.quantity)
        const minimum = Number(item.product.minimum_order_quantity)
        const newQuantity = quantity - minimum

        if (newQuantity < minimum) {
            confirmDelete(item)
            return
        }

        changeQuantity(item, newQuantity)
    }

    const changeQuantity = async (
        item: CartItem,
        quantity: number
    ) => {
        try {
            setUpdatingItemId(item.id)

            const response = await updateCartItem(
                item.id,
                quantity.toFixed(2)
            )

            setCart(response.cart)
        } catch (requestError) {
            Alert.alert(
                "Không thể cập nhật",
                getApiErrorMessage(requestError)
                    ?? "Vui lòng thử lại."
            )
        } finally {
            setUpdatingItemId(null)
        }
    }

    const confirmDelete = (item: CartItem) => {
        Alert.alert(
            "Xóa sản phẩm?",
            `Bạn có muốn xóa ${item.product.name} khỏi giỏ hàng?`,
            [
                {
                    text: "Không",
                    style: "cancel"
                },
                {
                    text: "Xóa",
                    style: "destructive",
                    onPress: () => handleDelete(item.id)
                }
            ]
        )
    }

    const handleDelete = async (itemId: number) => {
        try {
            setUpdatingItemId(itemId)

            const response = await deleteCartItem(itemId)

            setCart(response.cart)
            setSelectedIds(current =>
                current.filter(id => id !== itemId)
            )
        } catch (requestError) {
            Alert.alert(
                "Không thể xóa",
                getApiErrorMessage(requestError)
                    ?? "Vui lòng thử lại."
            )
        } finally {
            setUpdatingItemId(null)
        }
    }

    const handleCheckout = () => {
        if (selectedIds.length === 0) {
            Alert.alert(
                "Chưa chọn sản phẩm",
                "Hãy chọn ít nhất một sản phẩm để đặt hàng."
            )
            return
        }

        const rootNavigation =
            navigation.getParent<
                NativeStackNavigationProp<ConsumerStackParamList>
            >()

        rootNavigation?.navigate("Checkout", {
            cartItemIds: selectedIds
        })
    }

    if (isLoading) {
        return (
            <SafeAreaView style={consumerStyles.safeArea} edges={["top"]}>
                <View style={consumerStyles.center}>
                    <ActivityIndicator color={consumerColors.primary} />
                    <Text>Đang tải giỏ hàng...</Text>
                </View>
            </SafeAreaView>
        )
    }

    if (error && !cart) {
        return (
            <SafeAreaView style={consumerStyles.safeArea} edges={["top"]}>
                <View style={consumerStyles.center}>
                    <MaterialCommunityIcons
                        name="cart-remove"
                        size={52}
                        color={consumerColors.danger}
                    />

                    <Text style={consumerStyles.centerText}>
                        {error}
                    </Text>

                    <Button
                        mode="contained"
                        buttonColor={consumerColors.primary}
                        onPress={() => loadCart()}
                    >
                        Thử lại
                    </Button>
                </View>
            </SafeAreaView>
        )
    }

    const isEmpty = items.length === 0

    return (
        <SafeAreaView style={consumerStyles.safeArea} edges={["top"]}>
            <View style={consumerStyles.header}>
                <Text
                    variant="headlineSmall"
                    style={consumerStyles.headerTitle}
                >
                    Giỏ hàng
                </Text>

                <Text style={consumerStyles.secondaryText}>
                    {isEmpty
                        ? "Chưa có sản phẩm"
                        : `${items.length} sản phẩm trong giỏ`}
                </Text>
            </View>

            {!isEmpty && (
                <Surface elevation={0} style={styles.selectAllCard}>
                    <Pressable
                        style={styles.selectAllRow}
                        onPress={toggleAll}
                    >
                        <Checkbox.Android
                            status={
                                allSelected
                                    ? "checked"
                                    : partiallySelected
                                        ? "indeterminate"
                                        : "unchecked"
                            }
                            onPress={toggleAll}
                        />

                        <Text
                            variant="titleSmall"
                            style={consumerStyles.bold}
                        >
                            Chọn tất cả
                        </Text>

                        <Text style={styles.selectionCount}>
                            {selectedIds.length}/{items.length}
                        </Text>
                    </Pressable>
                </Surface>
            )}

            <FlatList
                data={items}
                keyExtractor={item => item.id.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.list,
                    isEmpty && styles.emptyList
                ]}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={() => loadCart(true)}
                    />
                }
                ListEmptyComponent={
                    <EmptyCart
                        onShop={() => navigation.navigate("Home")}
                    />
                }
                renderItem={({ item }) => (
                    <CartItemCard
                        item={item}
                        selected={selectedIds.includes(item.id)}
                        isUpdating={updatingItemId === item.id}
                        onToggle={() => toggleItem(item.id)}
                        onIncrease={() => handleIncrease(item)}
                        onDecrease={() => handleDecrease(item)}
                        onDelete={() => confirmDelete(item)}
                        onProductPress={() => {
                            const rootNavigation =
                                navigation.getParent<
                                    NativeStackNavigationProp<
                                        ConsumerStackParamList
                                    >
                                >()

                            rootNavigation?.navigate(
                                "ProductDetail",
                                { productId: item.product.id }
                            )
                        }}
                    />
                )}
            />

            {!isEmpty && (
                <Surface elevation={4} style={styles.checkoutBar}>
                    <View style={styles.totalSection}>
                        <Text style={consumerStyles.secondaryText}>
                            Đã chọn {selectedIds.length} sản phẩm
                        </Text>

                        <Text
                            variant="titleLarge"
                            style={styles.totalPrice}
                        >
                            {formatMoney(selectedTotal)}
                        </Text>
                    </View>

                    <Button
                        mode="contained"
                        icon="arrow-right"
                        buttonColor={consumerColors.primary}
                        disabled={selectedIds.length === 0}
                        contentStyle={styles.checkoutButtonContent}
                        style={styles.checkoutButton}
                        onPress={handleCheckout}
                    >
                        Đặt hàng
                    </Button>
                </Surface>
            )}
        </SafeAreaView>
    )
}

function CartItemCard({
    item,
    selected,
    isUpdating,
    onToggle,
    onIncrease,
    onDecrease,
    onDelete,
    onProductPress
}: {
    item: CartItem
    selected: boolean
    isUpdating: boolean
    onToggle: () => void
    onIncrease: () => void
    onDecrease: () => void
    onDelete: () => void
    onProductPress: () => void
}) {
    const primaryImage =
        item.product.images.find(image => image.is_primary)
        ?? item.product.images[0]

    return (
        <Surface
            elevation={selected ? 2 : 1}
            style={[
                styles.itemCard,
                {
                    borderColor: selected
                        ? consumerColors.primary
                        : consumerColors.border
                }
            ]}
        >
            <View style={styles.checkboxContainer}>
                <Checkbox.Android
                    status={selected ? "checked" : "unchecked"}
                    onPress={onToggle}
                />
            </View>

            <Pressable onPress={onProductPress}>
                {primaryImage ? (
                    <Image
                        source={{ uri: primaryImage.image }}
                        style={styles.productImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View
                        style={[
                            styles.productImage,
                            styles.imagePlaceholder
                        ]}
                    >
                        <MaterialCommunityIcons
                            name="food-apple-outline"
                            size={38}
                            color={consumerColors.primary}
                        />
                    </View>
                )}
            </Pressable>

            <View style={styles.itemBody}>
                <View style={styles.itemTop}>
                    <Pressable
                        style={styles.productNameContainer}
                        onPress={onProductPress}
                    >
                        <Text
                            variant="titleMedium"
                            style={consumerStyles.bold}
                            numberOfLines={2}
                        >
                            {item.product.name}
                        </Text>
                    </Pressable>

                    <Pressable
                        hitSlop={8}
                        disabled={isUpdating}
                        onPress={onDelete}
                    >
                        <MaterialCommunityIcons
                            name="trash-can-outline"
                            size={21}
                            color={consumerColors.danger}
                        />
                    </Pressable>
                </View>

                <View style={styles.farmerRow}>
                    <MaterialCommunityIcons
                        name="storefront-outline"
                        size={15}
                        color={consumerColors.textSecondary}
                    />

                    <Text
                        variant="bodySmall"
                        numberOfLines={1}
                        style={consumerStyles.secondaryText}
                    >
                        {item.product.farmer_name}
                    </Text>
                </View>

                {!!item.affiliate_code && (
                    <View style={styles.affiliateBadge}>
                        <MaterialCommunityIcons
                            name="account-star-outline"
                            size={14}
                            color={consumerColors.primary}
                        />

                        <Text style={styles.affiliateText}>
                            Nguồn KOC
                        </Text>
                    </View>
                )}

                <Text
                    variant="titleMedium"
                    style={styles.price}
                >
                    {formatMoney(Number(item.product.price))}
                    <Text style={consumerStyles.secondaryText}>
                        {" "}/{item.product.unit_symbol}
                    </Text>
                </Text>

                <Divider />

                <View style={styles.itemBottom}>
                    <View style={styles.quantityControl}>
                        <QuantityButton
                            icon="minus"
                            disabled={isUpdating}
                            onPress={onDecrease}
                        />

                        <View style={styles.quantityValue}>
                            {isUpdating ? (
                                <ActivityIndicator size={17} />
                            ) : (
                                <Text
                                    variant="titleSmall"
                                    style={consumerStyles.bold}
                                >
                                    {formatQuantity(item.quantity)}
                                </Text>
                            )}
                        </View>

                        <QuantityButton
                            icon="plus"
                            disabled={isUpdating}
                            onPress={onIncrease}
                        />
                    </View>

                    <View style={styles.subtotal}>
                        <Text style={consumerStyles.secondaryText}>
                            Thành tiền
                        </Text>

                        <Text
                            variant="titleMedium"
                            style={styles.subtotalPrice}
                        >
                            {formatMoney(Number(item.subtotal))}
                        </Text>
                    </View>
                </View>
            </View>
        </Surface>
    )
}

function QuantityButton({
    icon,
    disabled,
    onPress
}: {
    icon: keyof typeof MaterialCommunityIcons.glyphMap
    disabled: boolean
    onPress: () => void
}) {
    return (
        <Pressable
            disabled={disabled}
            onPress={onPress}
            style={({ pressed }) => [
                styles.quantityButton,
                pressed && styles.pressed,
                disabled && styles.disabled
            ]}
        >
            <MaterialCommunityIcons
                name={icon}
                size={19}
                color={consumerColors.primary}
            />
        </Pressable>
    )
}

function EmptyCart({ onShop }: { onShop: () => void }) {
    return (
        <View style={styles.empty}>
            <View style={consumerStyles.emptyIcon}>
                <MaterialCommunityIcons
                    name="cart-outline"
                    size={56}
                    color={consumerColors.primary}
                />
            </View>

            <Text
                variant="titleLarge"
                style={consumerStyles.bold}
            >
                Giỏ hàng đang trống
            </Text>

            <Text style={consumerStyles.centerText}>
                Hãy chọn những nông sản bạn muốn mua.
            </Text>

            <Button
                mode="contained"
                icon="sprout"
                buttonColor={consumerColors.primary}
                style={styles.shopButton}
                onPress={onShop}
            >
                Tiếp tục mua sắm
            </Button>
        </View>
    )
}

function formatMoney(value: number) {
    return `${value.toLocaleString("vi-VN")} đ`
}

function formatQuantity(value: string) {
    return Number(value).toLocaleString("vi-VN", {
        maximumFractionDigits: 2
    })
}

function getApiErrorMessage(error: unknown) {
    if (!axios.isAxiosError(error)) return null

    const data = error.response?.data

    if (typeof data === "string") return data
    if (!data || typeof data !== "object") return null

    const response = data as Record<string, unknown>

    if (typeof response.detail === "string") {
        return response.detail
    }

    const fields = [
        "quantity",
        "product",
        "affiliate_code",
        "non_field_errors"
    ]

    for (const field of fields) {
        const value = response[field]

        if (Array.isArray(value)) {
            return value.map(String).join("\n")
        }

        if (typeof value === "string") {
            return value
        }
    }

    return null
}

const styles = StyleSheet.create({
    selectAllCard: {
        marginHorizontal: 16,
        marginBottom: 10,
        borderRadius: 14,
        backgroundColor: consumerColors.surface
    },
    selectAllRow: {
        minHeight: 50,
        flexDirection: "row",
        alignItems: "center",
        paddingRight: 14
    },
    selectionCount: {
        marginLeft: "auto",
        color: consumerColors.textSecondary
    },
    list: {
        paddingHorizontal: 16,
        paddingBottom: 120,
        gap: 12
    },
    emptyList: {
        flexGrow: 1
    },
    itemCard: {
        borderWidth: 1,
        borderRadius: 20,
        padding: 10,
        flexDirection: "row",
        gap: 9,
        backgroundColor: consumerColors.surface
    },
    checkboxContainer: {
        justifyContent: "flex-start",
        marginLeft: -7,
        marginRight: -5
    },
    productImage: {
        width: 92,
        height: 120,
        borderRadius: 14
    },
    imagePlaceholder: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: consumerColors.primarySoft
    },
    itemBody: {
        flex: 1,
        gap: 6
    },
    itemTop: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 6
    },
    productNameContainer: {
        flex: 1
    },
    farmerRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4
    },
    affiliateBadge: {
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 9,
        backgroundColor: consumerColors.primarySoft
    },
    affiliateText: {
        color: consumerColors.primary
    },
    price: {
        color: consumerColors.primary,
        fontWeight: "700"
    },
    itemBottom: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8
    },
    quantityControl: {
        flexDirection: "row",
        alignItems: "center"
    },
    quantityButton: {
        width: 31,
        height: 31,
        borderWidth: 1,
        borderRadius: 9,
        borderColor: consumerColors.border,
        alignItems: "center",
        justifyContent: "center"
    },
    quantityValue: {
        minWidth: 42,
        height: 31,
        alignItems: "center",
        justifyContent: "center"
    },
    subtotal: {
        alignItems: "flex-end"
    },
    subtotalPrice: {
        color: consumerColors.primary,
        fontWeight: "700"
    },
    checkoutBar: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: consumerColors.surface
    },
    totalSection: {
        flex: 1,
        gap: 2
    },
    totalPrice: {
        color: consumerColors.primary,
        fontWeight: "800"
    },
    checkoutButton: {
        minWidth: 140,
        borderRadius: 14
    },
    checkoutButtonContent: {
        height: 50,
        flexDirection: "row-reverse"
    },
    empty: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 35,
        paddingVertical: 70,
        gap: 10
    },
    shopButton: {
        marginTop: 8,
        borderRadius: 14
    },
    pressed: {
        opacity: 0.7
    },
    disabled: {
        opacity: 0.45
    }
})