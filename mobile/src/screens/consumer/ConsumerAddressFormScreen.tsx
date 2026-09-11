import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useState } from "react"
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from "react-native"
import {
    Button,
    Text,
    TextInput
} from "react-native-paper"

import type { ConsumerStackParamList } from "../../navigation/consumer/ConsumerNavigator"
import {
    createAddress,
    updateAddress
} from "../../services/api/addressService"
import {
    consumerColors,
    consumerStyles as styles
} from "./consumerStyles"

type Props = NativeStackScreenProps<
    ConsumerStackParamList,
    "ConsumerAddressForm"
>

export default function ConsumerAddressFormScreen({
    route,
    navigation
}: Props) {
    const address = route.params?.address

    const [recipientName, setRecipientName] = useState(
        address?.recipient_name ?? ""
    )
    const [phoneNumber, setPhoneNumber] = useState(
        address?.phone_number ?? ""
    )
    const [province, setProvince] = useState(
        address?.province ?? ""
    )
    const [ward, setWard] = useState(
        address?.ward ?? ""
    )
    const [addressDetail, setAddressDetail] = useState(
        address?.address_detail ?? ""
    )
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async () => {
        const recipient = recipientName.trim()
        const phone = phoneNumber.trim()
        const provinceValue = province.trim()
        const wardValue = ward.trim()
        const detail = addressDetail.trim()

        if (
            !recipient
            || !phone
            || !provinceValue
            || !wardValue
            || !detail
        ) {
            Alert.alert(
                "Thiếu thông tin",
                "Vui lòng nhập đầy đủ thông tin địa chỉ."
            )
            return
        }

        if (!/^(0|\+84)\d{9}$/.test(phone)) {
            Alert.alert(
                "Số điện thoại chưa đúng",
                "Vui lòng nhập số điện thoại Việt Nam hợp lệ."
            )
            return
        }

        try {
            setIsSubmitting(true)

            const data = {
                recipient_name: recipient,
                phone_number: phone,
                province: provinceValue,
                ward: wardValue,
                address_detail: detail
            }

            if (address) {
                await updateAddress(address.id, data)
            } else {
                await createAddress(data)
            }

            Alert.alert(
                "Đã lưu",
                address
                    ? "Địa chỉ đã được cập nhật."
                    : "Địa chỉ mới đã được thêm.",
                [
                    {
                        text: "OK",
                        onPress: () => navigation.goBack()
                    }
                ]
            )
        } catch {
            Alert.alert(
                "Không thể lưu",
                "Không thể lưu địa chỉ. Vui lòng kiểm tra thông tin và thử lại."
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <KeyboardAvoidingView
            style={styles.screen}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.editContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Text variant="titleMedium" style={styles.bold}>
                    Thông tin người nhận
                </Text>

                <TextInput
                    mode="outlined"
                    label="Tên người nhận"
                    value={recipientName}
                    onChangeText={setRecipientName}
                    activeOutlineColor={consumerColors.primary}
                    style={styles.input}
                />

                <TextInput
                    mode="outlined"
                    label="Số điện thoại"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    activeOutlineColor={consumerColors.primary}
                    style={styles.input}
                />

                <Text variant="titleMedium" style={styles.bold}>
                    Địa chỉ
                </Text>

                <TextInput
                    mode="outlined"
                    label="Tỉnh / Thành phố"
                    value={province}
                    onChangeText={setProvince}
                    activeOutlineColor={consumerColors.primary}
                    style={styles.input}
                />

                <TextInput
                    mode="outlined"
                    label="Phường / Xã"
                    value={ward}
                    onChangeText={setWard}
                    activeOutlineColor={consumerColors.primary}
                    style={styles.input}
                />

                <TextInput
                    mode="outlined"
                    label="Địa chỉ chi tiết"
                    placeholder="Số nhà, tên đường..."
                    value={addressDetail}
                    onChangeText={setAddressDetail}
                    multiline
                    activeOutlineColor={consumerColors.primary}
                    style={styles.input}
                />

                <Button
                    mode="contained"
                    icon="content-save-outline"
                    buttonColor={consumerColors.primary}
                    textColor="#FFFFFF"
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    contentStyle={styles.buttonContent}
                    onPress={handleSubmit}
                >
                    {address ? "Lưu thay đổi" : "Thêm địa chỉ"}
                </Button>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}