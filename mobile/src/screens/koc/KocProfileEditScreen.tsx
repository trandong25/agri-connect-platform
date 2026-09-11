import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useEffect, useState } from "react"
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import {
    ActivityIndicator,
    Button,
    Surface,
    Text,
    TextInput
} from "react-native-paper"

import type { KocStackParamList } from "../../navigation/koc/KocNavigator"
import {
    getCurrentUser,
    updateCurrentUser
} from "../../services/api/profileService"
import {
    kocColors,
    kocStyles
} from "./kocStyles"

type Props = NativeStackScreenProps<
    KocStackParamList,
    "KocProfileEdit"
>

export default function KocProfileEditScreen({
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

    useEffect(() => {
        loadUser()
    }, [])

    const loadUser = async () => {
        try {
            setIsLoading(true)
            setError("")

            const user = await getCurrentUser()

            setUsername(user.username)
            setEmail(user.email)
            setFirstName(user.first_name)
            setLastName(user.last_name)
            setPhoneNumber(user.phone_number ?? "")
        } catch {
            setError("Không thể tải thông tin tài khoản.")
        } finally {
            setIsLoading(false)
        }
    }

    const validate = () => {
        const phone = phoneNumber.trim()

        if (
            phone
            && !/^(0\d{9}|\+84\d{9})$/.test(phone)
        ) {
            Alert.alert(
                "Số điện thoại không hợp lệ",
                "Vui lòng nhập số điện thoại Việt Nam hợp lệ."
            )

            return false
        }

        return true
    }

    const handleSave = async () => {
        if (!validate()) return

        try {
            setIsSaving(true)

            await updateCurrentUser({
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                phone_number: phoneNumber.trim() || null
            })

            Alert.alert(
                "Đã cập nhật",
                "Thông tin cá nhân đã được lưu.",
                [
                    {
                        text: "OK",
                        onPress: () => navigation.goBack()
                    }
                ]
            )
        } catch {
            Alert.alert(
                "Không thể cập nhật",
                "Vui lòng kiểm tra lại và thử lại."
            )
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <View style={kocStyles.center}>
                <ActivityIndicator color={kocColors.primary} />
                <Text>Đang tải thông tin...</Text>
            </View>
        )
    }

    return (
        <SafeAreaView
            style={kocStyles.screen}
            edges={["bottom"]}
        >
            <KeyboardAvoidingView
                style={kocStyles.screen}
                behavior={
                    Platform.OS === "ios"
                        ? "padding"
                        : undefined
                }
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {!!error && (
                        <Surface
                            elevation={0}
                            style={kocStyles.errorCard}
                        >
                            <MaterialCommunityIcons
                                name="alert-circle-outline"
                                size={20}
                                color={kocColors.danger}
                            />

                            <Text style={styles.errorText}>
                                {error}
                            </Text>
                        </Surface>
                    )}

                    <Surface elevation={1} style={kocStyles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.icon}>
                                <MaterialCommunityIcons
                                    name="account-edit-outline"
                                    size={25}
                                    color={kocColors.primary}
                                />
                            </View>

                            <View style={styles.flex}>
                                <Text
                                    variant="titleMedium"
                                    style={kocStyles.bold}
                                >
                                    Thông tin cá nhân
                                </Text>

                                <Text style={kocStyles.secondaryText}>
                                    Cập nhật thông tin tài khoản của bạn.
                                </Text>
                            </View>
                        </View>

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

                        <TextInput
                            mode="outlined"
                            label="Họ"
                            value={lastName}
                            activeOutlineColor={kocColors.primary}
                            onChangeText={setLastName}
                        />

                        <TextInput
                            mode="outlined"
                            label="Tên"
                            value={firstName}
                            activeOutlineColor={kocColors.primary}
                            onChangeText={setFirstName}
                        />

                        <TextInput
                            mode="outlined"
                            label="Số điện thoại"
                            value={phoneNumber}
                            keyboardType="phone-pad"
                            activeOutlineColor={kocColors.primary}
                            onChangeText={setPhoneNumber}
                        />
                    </Surface>

                    <Button
                        mode="contained"
                        icon="content-save-outline"
                        buttonColor={kocColors.primary}
                        loading={isSaving}
                        disabled={isSaving}
                        contentStyle={kocStyles.buttonContent}
                        onPress={handleSave}
                    >
                        Lưu thay đổi
                    </Button>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    flex: {
        flex: 1
    },
    content: {
        padding: 16,
        paddingBottom: 36,
        gap: 16
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 3
    },
    icon: {
        width: 46,
        height: 46,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: kocColors.primarySoft
    },
    errorText: {
        flex: 1,
        color: kocColors.danger
    }
})