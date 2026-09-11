import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useEffect, useState } from "react"
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    View
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import {
    ActivityIndicator,
    Button,
    Text,
    TextInput
} from "react-native-paper"

import ScreenHeader from "../../components/common/ScreenHeader"
import type { FarmerStackParamList } from "../../navigation/farmer/FarmerNavigator"
import {
    getCurrentFarmerProfile,
    getCurrentUser,
    updateCurrentFarmerProfile,
    updateCurrentUser
} from "../../services/api/farmerProfileService"
import {
    farmerColors,
    farmerStyles as styles
} from "./farmerStyles"

type Props = NativeStackScreenProps<
    FarmerStackParamList,
    "FarmerProfileEdit"
>

export default function FarmerProfileEditScreen({
    navigation
}: Props) {
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("")
    const [farmName, setFarmName] = useState("")
    const [address, setAddress] = useState("")
    const [description, setDescription] = useState("")

    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setIsLoading(true)
            setError("")

            const [user, profile] = await Promise.all([
                getCurrentUser(),
                getCurrentFarmerProfile()
            ])

            setUsername(user.username)
            setEmail(user.email)
            setFirstName(user.first_name || "")
            setLastName(user.last_name || "")
            setPhoneNumber(user.phone_number || "")
            setFarmName(profile.farm_name || "")
            setAddress(profile.address || "")
            setDescription(profile.description || "")
        } catch {
            setError("Không thể tải thông tin để chỉnh sửa.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        const phone = phoneNumber.trim()

        if (
            phone &&
            !/^(0|\+84)\d{9}$/.test(phone)
        ) {
            Alert.alert(
                "Số điện thoại chưa đúng",
                "Vui lòng nhập số điện thoại Việt Nam hợp lệ."
            )
            return
        }

        try {
            setIsSaving(true)

            await Promise.all([
                updateCurrentUser({
                    first_name: firstName.trim(),
                    last_name: lastName.trim(),
                    phone_number: phone || null
                }),
                updateCurrentFarmerProfile({
                    farm_name: farmName.trim(),
                    address: address.trim(),
                    description: description.trim()
                })
            ])

            Alert.alert(
                "Đã lưu",
                "Thông tin của bạn đã được cập nhật.",
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
                "Không thể cập nhật thông tin. Vui lòng kiểm tra dữ liệu và thử lại."
            )
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <SafeAreaView style={styles.screen} edges={["top"]}>
                <View style={styles.center}>
                    <ActivityIndicator color={farmerColors.primary} />
                    <Text>Đang tải thông tin...</Text>
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

                    <Text style={styles.centerText}>
                        {error}
                    </Text>

                    <Button
                        mode="contained"
                        buttonColor={farmerColors.primary}
                        onPress={loadData}
                    >
                        Thử lại
                    </Button>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.screen} edges={["top"]}>
            <KeyboardAvoidingView
                style={styles.screen}
                behavior={
                    Platform.OS === "ios"
                        ? "padding"
                        : undefined
                }
            >
                <ScreenHeader
                    title="Chỉnh sửa thông tin"
                    subtitle="Cập nhật thông tin cá nhân và nhà vườn."
                    onBack={() => navigation.goBack()}
                    accentColor={farmerColors.primary}
                    textColor={farmerColors.text}
                    secondaryColor={farmerColors.textSecondary}
                />

                <ScrollView
                    contentContainerStyle={styles.editContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.editSection}>
                        <Text
                            variant="titleMedium"
                            style={styles.editSectionTitle}
                        >
                            Tài khoản
                        </Text>

                        <View style={styles.editFields}>
                            <View style={styles.editReadonly}>
                                <Text
                                    variant="bodySmall"
                                    style={styles.editReadonlyLabel}
                                >
                                    Tên đăng nhập
                                </Text>

                                <Text variant="bodyLarge">
                                    {username}
                                </Text>
                            </View>

                            <View style={styles.editReadonly}>
                                <Text
                                    variant="bodySmall"
                                    style={styles.editReadonlyLabel}
                                >
                                    Email
                                </Text>

                                <Text variant="bodyLarge">
                                    {email}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.editSection}>
                        <Text
                            variant="titleMedium"
                            style={styles.editSectionTitle}
                        >
                            Thông tin cá nhân
                        </Text>

                        <View style={styles.editFields}>
                            <TextInput
                                mode="outlined"
                                label="Họ"
                                value={firstName}
                                style={styles.editInput}
                                activeOutlineColor={farmerColors.primary}
                                onChangeText={setFirstName}
                            />

                            <TextInput
                                mode="outlined"
                                label="Tên"
                                value={lastName}
                                style={styles.editInput}
                                activeOutlineColor={farmerColors.primary}
                                onChangeText={setLastName}
                            />

                            <TextInput
                                mode="outlined"
                                label="Số điện thoại"
                                value={phoneNumber}
                                style={styles.editInput}
                                keyboardType="phone-pad"
                                activeOutlineColor={farmerColors.primary}
                                onChangeText={setPhoneNumber}
                            />
                        </View>
                    </View>

                    <View style={styles.editSection}>
                        <Text
                            variant="titleMedium"
                            style={styles.editSectionTitle}
                        >
                            Nhà vườn
                        </Text>

                        <View style={styles.editFields}>
                            <TextInput
                                mode="outlined"
                                label="Tên nhà vườn"
                                value={farmName}
                                style={styles.editInput}
                                activeOutlineColor={farmerColors.primary}
                                onChangeText={setFarmName}
                            />

                            <TextInput
                                mode="outlined"
                                label="Địa chỉ nhà vườn"
                                value={address}
                                style={styles.editInput}
                                activeOutlineColor={farmerColors.primary}
                                onChangeText={setAddress}
                            />

                            <TextInput
                                mode="outlined"
                                label="Mô tả"
                                value={description}
                                style={styles.editInput}
                                multiline
                                numberOfLines={4}
                                activeOutlineColor={farmerColors.primary}
                                onChangeText={setDescription}
                            />
                        </View>
                    </View>

                    <Button
                        mode="contained"
                        icon="content-save-outline"
                        buttonColor={farmerColors.primary}
                        textColor="#FFFFFF"
                        loading={isSaving}
                        disabled={isSaving}
                        style={styles.editSaveButton}
                        contentStyle={styles.editSaveContent}
                        onPress={handleSave}
                    >
                        Lưu thay đổi
                    </Button>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}