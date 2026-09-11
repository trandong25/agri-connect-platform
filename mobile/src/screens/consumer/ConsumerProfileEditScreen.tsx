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
import type { ConsumerStackParamList } from "../../navigation/consumer/ConsumerNavigator"
import {
    getCurrentConsumer,
    updateCurrentConsumer
} from "../../services/api/consumerProfileService"
import {
    consumerColors,
    consumerStyles as styles
} from "./consumerStyles"

type Props = NativeStackScreenProps<
    ConsumerStackParamList,
    "ConsumerProfileEdit"
>

export default function ConsumerProfileEditScreen({
    navigation
}: Props) {
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("")

    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState("")

    const loadData = async () => {
        try {
            setIsLoading(true)
            setError("")

            const user = await getCurrentConsumer()

            setUsername(user.username)
            setEmail(user.email)
            setFirstName(user.first_name || "")
            setLastName(user.last_name || "")
            setPhoneNumber(user.phone_number || "")
        } catch {
            setError("Không thể tải thông tin tài khoản.")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const handleSave = async () => {
        const phone = phoneNumber.trim()

        if (phone && !/^(0|\+84)\d{9}$/.test(phone)) {
            Alert.alert(
                "Số điện thoại chưa đúng",
                "Vui lòng nhập số điện thoại Việt Nam hợp lệ."
            )
            return
        }

        try {
            setIsSaving(true)

            await updateCurrentConsumer({
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                phone_number: phone || null
            })

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
                "Không thể cập nhật thông tin. Vui lòng kiểm tra và thử lại."
            )
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <SafeAreaView style={styles.screen} edges={["top"]}>
                <View style={styles.center}>
                    <ActivityIndicator color={consumerColors.primary} />
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
                        color={consumerColors.danger}
                    />

                    <Text style={styles.centerText}>
                        {error}
                    </Text>

                    <Button
                        mode="contained"
                        buttonColor={consumerColors.primary}
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
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScreenHeader
                    title="Chỉnh sửa thông tin"
                    subtitle="Cập nhật thông tin cá nhân của bạn."
                    onBack={() => navigation.goBack()}
                    accentColor={consumerColors.primary}
                    textColor={consumerColors.text}
                    secondaryColor={consumerColors.textSecondary}
                />

                <ScrollView
                    contentContainerStyle={styles.editContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.editSection}>
                        <Text variant="titleMedium" style={styles.bold}>
                            Tài khoản
                        </Text>

                        <TextInput
                            mode="outlined"
                            label="Tên đăng nhập"
                            value={username}
                            disabled
                        />

                        <TextInput
                            mode="outlined"
                            label="Email"
                            value={email}
                            disabled
                        />
                    </View>

                    <View style={styles.editSection}>
                        <Text variant="titleMedium" style={styles.bold}>
                            Thông tin cá nhân
                        </Text>

                        <TextInput
                            mode="outlined"
                            label="Họ"
                            value={firstName}
                            onChangeText={setFirstName}
                            activeOutlineColor={consumerColors.primary}
                            style={styles.input}
                        />

                        <TextInput
                            mode="outlined"
                            label="Tên"
                            value={lastName}
                            onChangeText={setLastName}
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
                    </View>

                    <Button
                        mode="contained"
                        icon="content-save-outline"
                        buttonColor={consumerColors.primary}
                        textColor="#FFFFFF"
                        loading={isSaving}
                        disabled={isSaving}
                        contentStyle={styles.buttonContent}
                        onPress={handleSave}
                    >
                        Lưu thay đổi
                    </Button>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}