import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { useFocusEffect } from "@react-navigation/native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useCallback, useMemo, useState } from "react"
import {
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    View
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import {
    ActivityIndicator,
    Button,
    Divider,
    RadioButton,
    Surface,
    Text,
    TextInput
} from "react-native-paper"

import type { ConsumerStackParamList } from "../../navigation/consumer/ConsumerNavigator"
import { getAddresses } from "../../services/api/addressService"
import { getCart } from "../../services/api/cartService"
import { createOrder } from "../../services/api/orderService"
import { useAppDispatch } from "../../store/hooks"
import { fetchCart } from "../../store/slices/cartSlice"
import type { Address } from "../../types/address"
import type { Cart } from "../../types/cart"
import type { PaymentMethod } from "../../types/order"
import {
    consumerColors,
    consumerStyles
} from "./consumerStyles"

type Props = NativeStackScreenProps<
    ConsumerStackParamList,
    "Checkout"
>

export default function CheckoutScreen({
    route,
    navigation
}: Props) {
    const dispatch = useAppDispatch()
    const { cartItemIds } = route.params

    const [cart, setCart] = useState<Cart | null>(null)
    const [addresses, setAddresses] = useState<Address[]>([])
    const [selectedAddressId, setSelectedAddressId] =
        useState<number | null>(null)

    const [paymentMethod, setPaymentMethod] =
        useState<PaymentMethod>("COD")

    const [note, setNote] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState("")

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true)
            setError("")

            const [addressData, cartData] = await Promise.all([
                getAddresses(),
                getCart()
            ])

            setAddresses(addressData)
            setCart(cartData)

            setSelectedAddressId(current => {
                if (
                    current
                    && addressData.some(address => address.id === current)
                ) {
                    return current
                }

                const defaultAddress = addressData.find(
                    address => address.is_default
                )

                return defaultAddress?.id
                    ?? addressData[0]?.id
                    ?? null
            })
        } catch {
            setError("Không thể tải thông tin đặt hàng.")
        } finally {
            setIsLoading(false)
        }
    }, [])

    useFocusEffect(
        useCallback(() => {
            loadData()
        }, [loadData])
    )

    const selectedItems = useMemo(() => {
        if (!cart) return []

        return cart.items.filter(item =>
            cartItemIds.includes(item.id)
        )
    }, [cart, cartItemIds])

    const subtotal = useMemo(
        () =>
            selectedItems.reduce(
                (total, item) =>
                    total + Number(item.subtotal),
                0
            ),
        [selectedItems]
    )

    const hasMissingItems =
        selectedItems.length !== cartItemIds.length

    const handleSubmit = async () => {
        if (!selectedAddressId) {
            Alert.alert(
                "Thiếu địa chỉ",
                "Vui lòng thêm hoặc chọn địa chỉ nhận hàng."
            )
            return
        }

        if (selectedItems.length === 0) {
            Alert.alert(
                "Không có sản phẩm",
                "Không có sản phẩm nào được chọn để đặt hàng."
            )
            return
        }

        if (hasMissingItems) {
            Alert.alert(
                "Giỏ hàng đã thay đổi",
                "Một số sản phẩm được chọn không còn trong giỏ hàng."
            )
            return
        }

        try {
            setIsSubmitting(true)
            setError("")

            const order = await createOrder({
                address: selectedAddressId,
                cart_item_ids: cartItemIds,
                payment_method: paymentMethod,
                note: note.trim()
            })

            await dispatch(fetchCart())

            Alert.alert(
                "Đặt hàng thành công",
                `Mã đơn hàng: ${order.code.slice(0, 8)}`,
                [
                    {
                        text: "Xem đơn hàng",
                        onPress: () =>
                            navigation.replace(
                                "OrderDetail",
                                { orderId: order.id }
                            )
                    }
                ]
            )
        } catch {
            setError(
                "Không thể tạo đơn hàng. Vui lòng kiểm tra lại và thử lại."
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading && !cart) {
        return (
            <View style={consumerStyles.center}>
                <ActivityIndicator color={consumerColors.primary} />
                <Text>Đang tải thông tin đặt hàng...</Text>
            </View>
        )
    }

    return (
        <SafeAreaView
            style={consumerStyles.safeArea}
            edges={["bottom"]}
        >
            <ScrollView
                contentContainerStyle={consumerStyles.content}
                showsVerticalScrollIndicator={false}
            >
                {hasMissingItems && (
                    <Surface elevation={0} style={consumerStyles.warning}>
                        <MaterialCommunityIcons
                            name="alert-circle-outline"
                            size={21}
                            color={consumerColors.danger}
                        />

                        <Text
                            style={{
                                flex: 1,
                                color: consumerColors.danger
                            }}
                        >
                            Một số sản phẩm được chọn không còn trong giỏ hàng.
                        </Text>
                    </Surface>
                )}

                <Surface elevation={1} style={consumerStyles.section}>
                    <SectionTitle
                        icon="basket-outline"
                        title="Sản phẩm đã chọn"
                    />

                    {selectedItems.map((item, index) => {
                        const image =
                            item.product.images.find(
                                productImage =>
                                    productImage.is_primary
                            ) ?? item.product.images[0]

                        return (
                            <View key={item.id}>
                                {index > 0 && <Divider />}

                                <View style={styles.productRow}>
                                    {image ? (
                                        <Image
                                            source={{ uri: image.image }}
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
                                                size={30}
                                                color={consumerColors.primary}
                                            />
                                        </View>
                                    )}

                                    <View style={styles.productInfo}>
                                        <Text
                                            variant="titleSmall"
                                            style={consumerStyles.bold}
                                            numberOfLines={2}
                                        >
                                            {item.product.name}
                                        </Text>

                                        <Text style={consumerStyles.secondaryText}>
                                            {formatQuantity(item.quantity)}
                                            {" "}
                                            {item.product.unit_symbol}
                                        </Text>
                                    </View>

                                    <Text style={styles.productPrice}>
                                        {formatMoney(
                                            Number(item.subtotal)
                                        )}
                                    </Text>
                                </View>
                            </View>
                        )
                    })}
                </Surface>

                <Surface elevation={1} style={consumerStyles.section}>
                    <View style={styles.sectionHeader}>
                        <SectionTitle
                            icon="map-marker-outline"
                            title="Địa chỉ nhận hàng"
                        />

                        {addresses.length > 0 && (
                            <Button
                                mode="text"
                                compact
                                onPress={() =>
                                    navigation.navigate(
                                        "ConsumerAddresses"
                                    )
                                }
                            >
                                Quản lý
                            </Button>
                        )}
                    </View>

                    {addresses.length === 0 ? (
                        <View style={styles.noAddress}>
                            <View style={styles.noAddressIcon}>
                                <MaterialCommunityIcons
                                    name="map-marker-plus-outline"
                                    size={32}
                                    color={consumerColors.primary}
                                />
                            </View>

                            <Text
                                variant="titleSmall"
                                style={consumerStyles.bold}
                            >
                                Bạn chưa có địa chỉ nhận hàng
                            </Text>

                            <Text style={consumerStyles.centerText}>
                                Thêm địa chỉ để tiếp tục đặt hàng.
                            </Text>

                            <Button
                                mode="contained"
                                icon="plus"
                                buttonColor={consumerColors.primary}
                                onPress={() =>
                                    navigation.navigate(
                                        "ConsumerAddressForm"
                                    )
                                }
                            >
                                Thêm địa chỉ
                            </Button>
                        </View>
                    ) : (
                        addresses.map(address => (
                            <Pressable
                                key={address.id}
                                onPress={() =>
                                    setSelectedAddressId(address.id)
                                }
                            >
                                <Surface
                                    elevation={0}
                                    style={[
                                        styles.address,
                                        {
                                            borderColor:
                                                selectedAddressId
                                                === address.id
                                                    ? consumerColors.primary
                                                    : consumerColors.border
                                        }
                                    ]}
                                >
                                    <RadioButton
                                        value={String(address.id)}
                                        status={
                                            selectedAddressId === address.id
                                                ? "checked"
                                                : "unchecked"
                                        }
                                        onPress={() =>
                                            setSelectedAddressId(
                                                address.id
                                            )
                                        }
                                    />

                                    <View style={styles.addressInfo}>
                                        <Text
                                            variant="titleSmall"
                                            style={consumerStyles.bold}
                                        >
                                            {address.recipient_name}
                                        </Text>

                                        <Text>
                                            {address.phone_number}
                                        </Text>

                                        <Text style={consumerStyles.secondaryText}>
                                            {address.address_detail},{" "}
                                            {address.ward},{" "}
                                            {address.province}
                                        </Text>

                                        {address.is_default && (
                                            <Text style={styles.defaultText}>
                                                Mặc định
                                            </Text>
                                        )}
                                    </View>
                                </Surface>
                            </Pressable>
                        ))
                    )}
                </Surface>

                <Surface elevation={1} style={consumerStyles.section}>
                    <SectionTitle
                        icon="credit-card-outline"
                        title="Phương thức thanh toán"
                    />

                    <PaymentOption
                        title="Thanh toán khi nhận hàng"
                        subtitle="COD"
                        icon="cash"
                        selected={paymentMethod === "COD"}
                        onPress={() => setPaymentMethod("COD")}
                    />

                    <PaymentOption
                        title="Thanh toán trực tuyến"
                        subtitle="Mô phỏng thanh toán online"
                        icon="credit-card-outline"
                        selected={paymentMethod === "ONLINE"}
                        onPress={() => setPaymentMethod("ONLINE")}
                    />
                </Surface>

                <Surface elevation={1} style={consumerStyles.section}>
                    <Text
                        variant="titleMedium"
                        style={consumerStyles.bold}
                    >
                        Ghi chú
                    </Text>

                    <TextInput
                        mode="outlined"
                        placeholder="Ghi chú cho đơn hàng"
                        value={note}
                        onChangeText={setNote}
                        multiline
                        numberOfLines={3}
                    />
                </Surface>

                <Surface elevation={1} style={consumerStyles.section}>
                    <Text
                        variant="titleMedium"
                        style={consumerStyles.bold}
                    >
                        Tóm tắt đơn hàng
                    </Text>

                    <Divider />

                    <View style={consumerStyles.summaryRow}>
                        <Text>Sản phẩm đã chọn</Text>
                        <Text>{selectedItems.length}</Text>
                    </View>

                    <View style={consumerStyles.summaryRow}>
                        <Text>Tiền hàng</Text>
                        <Text>{formatMoney(subtotal)}</Text>
                    </View>

                    <View style={consumerStyles.summaryRow}>
                        <Text>Phí vận chuyển</Text>
                        <Text>0 đ</Text>
                    </View>

                    <Divider />

                    <View style={consumerStyles.summaryRow}>
                        <Text
                            variant="titleMedium"
                            style={consumerStyles.bold}
                        >
                            Tổng thanh toán
                        </Text>

                        <Text
                            variant="titleLarge"
                            style={styles.total}
                        >
                            {formatMoney(subtotal)}
                        </Text>
                    </View>
                </Surface>

                {!!error && (
                    <Surface elevation={0} style={consumerStyles.warning}>
                        <MaterialCommunityIcons
                            name="alert-circle-outline"
                            size={20}
                            color={consumerColors.danger}
                        />

                        <Text
                            style={{
                                flex: 1,
                                color: consumerColors.danger
                            }}
                        >
                            {error}
                        </Text>
                    </Surface>
                )}
            </ScrollView>

            <Surface elevation={4} style={styles.bottom}>
                <View style={styles.bottomPrice}>
                    <Text style={consumerStyles.secondaryText}>
                        Tổng cộng
                    </Text>

                    <Text
                        variant="titleLarge"
                        style={styles.total}
                    >
                        {formatMoney(subtotal)}
                    </Text>
                </View>

                <Button
                    mode="contained"
                    buttonColor={consumerColors.primary}
                    loading={isSubmitting}
                    disabled={
                        isSubmitting
                        || !selectedAddressId
                        || selectedItems.length === 0
                        || hasMissingItems
                    }
                    contentStyle={consumerStyles.buttonContent}
                    onPress={handleSubmit}
                >
                    Đặt hàng
                </Button>
            </Surface>
        </SafeAreaView>
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
        <View style={consumerStyles.titleRow}>
            <MaterialCommunityIcons
                name={icon}
                size={22}
                color={consumerColors.primary}
            />

            <Text
                variant="titleMedium"
                style={consumerStyles.bold}
            >
                {title}
            </Text>
        </View>
    )
}

function PaymentOption({
    title,
    subtitle,
    icon,
    selected,
    onPress
}: {
    title: string
    subtitle: string
    icon: keyof typeof MaterialCommunityIcons.glyphMap
    selected: boolean
    onPress: () => void
}) {
    return (
        <Pressable style={styles.paymentOption} onPress={onPress}>
            <RadioButton
                value={title}
                status={selected ? "checked" : "unchecked"}
                onPress={onPress}
            />

            <View style={styles.paymentText}>
                <Text variant="titleSmall">
                    {title}
                </Text>

                <Text style={consumerStyles.secondaryText}>
                    {subtitle}
                </Text>
            </View>

            <MaterialCommunityIcons
                name={icon}
                size={24}
                color={consumerColors.primary}
            />
        </Pressable>
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

const styles = StyleSheet.create({
    productRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 11,
        paddingVertical: 10
    },
    productImage: {
        width: 62,
        height: 62,
        borderRadius: 12
    },
    imagePlaceholder: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: consumerColors.primarySoft
    },
    productInfo: {
        flex: 1,
        gap: 3
    },
    productPrice: {
        color: consumerColors.primary,
        fontWeight: "700"
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8
    },
    address: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 10,
        flexDirection: "row",
        alignItems: "flex-start"
    },
    addressInfo: {
        flex: 1,
        gap: 4,
        paddingTop: 7
    },
    defaultText: {
        color: consumerColors.primary,
        fontWeight: "600"
    },
    noAddress: {
        alignItems: "center",
        gap: 9,
        paddingVertical: 12
    },
    noAddressIcon: {
        width: 64,
        height: 64,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: consumerColors.primarySoft
    },
    paymentOption: {
        flexDirection: "row",
        alignItems: "center",
        minHeight: 58
    },
    paymentText: {
        flex: 1,
        gap: 2
    },
    total: {
        color: consumerColors.primary,
        fontWeight: "800"
    },
    bottom: {
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        backgroundColor: consumerColors.surface
    },
    bottomPrice: {
        flex: 1,
        gap: 2
    }
})