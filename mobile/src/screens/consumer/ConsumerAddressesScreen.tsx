import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { useFocusEffect } from "@react-navigation/native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useCallback, useState } from "react"
import {
    Alert,
    FlatList,
    Pressable,
    View
} from "react-native"
import {
    ActivityIndicator,
    Button,
    Chip,
    Surface,
    Text
} from "react-native-paper"

import type { ConsumerStackParamList } from "../../navigation/consumer/ConsumerNavigator"
import {
    deleteAddress,
    getAddresses,
    setDefaultAddress
} from "../../services/api/addressService"
import type { Address } from "../../types/address"
import {
    consumerColors,
    consumerStyles as styles
} from "./consumerStyles"

type Props = NativeStackScreenProps<
    ConsumerStackParamList,
    "ConsumerAddresses"
>

export default function ConsumerAddressesScreen({
    navigation
}: Props) {
    const [addresses, setAddresses] = useState<Address[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [processingId, setProcessingId] = useState<number | null>(null)
    const [error, setError] = useState("")

    const loadAddresses = async () => {
        try {
            setIsLoading(true)
            setError("")

            const data = await getAddresses()
            setAddresses(data)
        } catch {
            setError("Không thể tải danh sách địa chỉ.")
        } finally {
            setIsLoading(false)
        }
    }

    useFocusEffect(
        useCallback(() => {
            loadAddresses()
        }, [])
    )

    const handleSetDefault = async (address: Address) => {
        if (address.is_default) return

        try {
            setProcessingId(address.id)
            await setDefaultAddress(address.id)
            await loadAddresses()
        } catch {
            Alert.alert(
                "Không thể cập nhật",
                "Không thể đặt địa chỉ này làm mặc định."
            )
        } finally {
            setProcessingId(null)
        }
    }

    const handleDelete = (address: Address) => {
        Alert.alert(
            "Xóa địa chỉ?",
            "Bạn có chắc chắn muốn xóa địa chỉ nhận hàng này?",
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
                            setProcessingId(address.id)
                            await deleteAddress(address.id)
                            await loadAddresses()
                        } catch {
                            Alert.alert(
                                "Không thể xóa",
                                "Địa chỉ chưa được xóa. Vui lòng thử lại."
                            )
                        } finally {
                            setProcessingId(null)
                        }
                    }
                }
            ]
        )
    }

    if (isLoading && addresses.length === 0) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={consumerColors.primary} />
                <Text>Đang tải địa chỉ...</Text>
            </View>
        )
    }

    if (error && addresses.length === 0) {
        return (
            <View style={styles.center}>
                <MaterialCommunityIcons
                    name="map-marker-alert-outline"
                    size={48}
                    color={consumerColors.danger}
                />

                <Text style={styles.centerText}>
                    {error}
                </Text>

                <Button
                    mode="contained"
                    buttonColor={consumerColors.primary}
                    onPress={loadAddresses}
                >
                    Thử lại
                </Button>
            </View>
        )
    }

    return (
        <View style={styles.screen}>
            <FlatList
                data={addresses}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={[
                    styles.content,
                    addresses.length === 0 && styles.empty
                ]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <>
                        <View style={styles.emptyIcon}>
                            <MaterialCommunityIcons
                                name="map-marker-plus-outline"
                                size={48}
                                color={consumerColors.primary}
                            />
                        </View>

                        <Text variant="titleLarge" style={styles.bold}>
                            Chưa có địa chỉ
                        </Text>

                        <Text style={styles.centerText}>
                            Thêm địa chỉ để có thể đặt và nhận hàng.
                        </Text>
                    </>
                }
                renderItem={({ item }) => (
                    <Surface elevation={1} style={styles.addressCard}>
                        <Pressable
                            style={styles.addressTop}
                            onPress={() =>
                                navigation.navigate(
                                    "ConsumerAddressForm",
                                    { address: item }
                                )
                            }
                        >
                            <View style={styles.addressInfo}>
                                <Text
                                    variant="titleMedium"
                                    style={styles.addressRecipient}
                                >
                                    {item.recipient_name}
                                </Text>

                                <Text style={styles.addressText}>
                                    {item.phone_number}
                                </Text>

                                <Text style={styles.addressText}>
                                    {item.address_detail}, {item.ward}, {item.province}
                                </Text>
                            </View>

                            {item.is_default && (
                                <Chip
                                    compact
                                    textStyle={{
                                        color: consumerColors.primaryDark
                                    }}
                                    style={{
                                        backgroundColor:
                                            consumerColors.primarySoft
                                    }}
                                >
                                    Mặc định
                                </Chip>
                            )}
                        </Pressable>

                        <View style={styles.addressActions}>
                            {!item.is_default && (
                                <Button
                                    mode="text"
                                    compact
                                    disabled={processingId === item.id}
                                    textColor={consumerColors.primary}
                                    onPress={() => handleSetDefault(item)}
                                >
                                    Đặt mặc định
                                </Button>
                            )}

                            <Button
                                mode="text"
                                compact
                                icon="pencil-outline"
                                disabled={processingId === item.id}
                                onPress={() =>
                                    navigation.navigate(
                                        "ConsumerAddressForm",
                                        { address: item }
                                    )
                                }
                            >
                                Sửa
                            </Button>

                            <Button
                                mode="text"
                                compact
                                icon="trash-can-outline"
                                disabled={processingId === item.id}
                                textColor={consumerColors.danger}
                                onPress={() => handleDelete(item)}
                            >
                                Xóa
                            </Button>
                        </View>
                    </Surface>
                )}
            />

            <View style={{ padding: 16 }}>
                <Button
                    mode="contained"
                    icon="plus"
                    buttonColor={consumerColors.primary}
                    textColor="#FFFFFF"
                    contentStyle={styles.buttonContent}
                    onPress={() =>
                        navigation.navigate("ConsumerAddressForm")
                    }
                >
                    Thêm địa chỉ
                </Button>
            </View>
        </View>
    )
}