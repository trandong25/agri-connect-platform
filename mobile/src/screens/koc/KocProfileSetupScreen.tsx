import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import axios from "axios"
import { useState } from "react"
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
    Button,
    HelperText,
    Surface,
    Text,
    TextInput
} from "react-native-paper"

import { createKocProfile } from "../../services/api/profileService"
import type { KocProfile } from "../../types/profile"
import {
    kocColors,
    kocStyles
} from "./kocStyles"

type Props = {
    onCreated: (profile: KocProfile) => void
}

export default function KocProfileSetupScreen({
    onCreated
}: Props) {
    const [kocName, setKocName] = useState("")
    const [socialPlatform, setSocialPlatform] = useState("")
    const [socialUrl, setSocialUrl] = useState("")
    const [follower, setFollower] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errors, setErrors] =
        useState<Record<string, string>>({})

    const clearError = (field: string) => {
        setErrors(current => ({
            ...current,
            [field]: ""
        }))
    }

    const validate = () => {
        const nextErrors: Record<string, string> = {}

        if (!kocName.trim()) {
            nextErrors.kocName =
                "Vui lòng nhập tên KOC/KOL."
        }

        if (!socialPlatform.trim()) {
            nextErrors.socialPlatform =
                "Vui lòng nhập nền tảng chính."
        }

        if (
            socialUrl.trim()
            && !isValidUrl(socialUrl)
        ) {
            nextErrors.socialUrl =
                "Liên kết chưa hợp lệ. Ví dụ: tiktok.com/@tenkenh"
        }

        if (
            follower
            && (
                Number.isNaN(Number(follower))
                || Number(follower) < 0
            )
        ) {
            nextErrors.follower =
                "Số người theo dõi không hợp lệ."
        }

        setErrors(nextErrors)

        return Object.keys(nextErrors).length === 0
    }

    const handleSubmit = async () => {
        if (!validate()) return

        try {
            setIsSubmitting(true)
            setErrors({})

            const profile = await createKocProfile({
                koc_name: kocName.trim(),
                social_platform: socialPlatform.trim(),
                social_url: normalizeUrl(socialUrl),
                follower: follower
                    ? Number(follower)
                    : 0
            })

            onCreated(profile)
        } catch (error) {
            handleApiError(error, setErrors)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <SafeAreaView
            style={kocStyles.safeArea}
            edges={["top", "bottom"]}
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
                    <View style={styles.heading}>
                        <View style={styles.iconContainer}>
                            <MaterialCommunityIcons
                                name="bullhorn-outline"
                                size={40}
                                color={kocColors.primary}
                            />
                        </View>

                        <Text
                            variant="headlineMedium"
                            style={kocStyles.title}
                        >
                            Hồ sơ KOC/KOL
                        </Text>

                        <Text style={styles.subtitle}>
                            Cho AgriConnect biết thêm về kênh nội dung của bạn.
                        </Text>
                    </View>

                    <Surface elevation={0} style={styles.infoCard}>
                        <MaterialCommunityIcons
                            name="account-check-outline"
                            size={26}
                            color={kocColors.primary}
                        />

                        <Text style={styles.infoText}>
                            Hồ sơ cần được xét duyệt trước khi bạn sử dụng
                            chức năng quảng bá và nhận hoa hồng.
                        </Text>
                    </Surface>

                    <Surface elevation={0} style={styles.form}>
                        <TextInput
                            mode="outlined"
                            label="Tên KOC/KOL"
                            value={kocName}
                            activeOutlineColor={kocColors.primary}
                            left={
                                <TextInput.Icon
                                    icon="account-star-outline"
                                />
                            }
                            error={!!errors.kocName}
                            onChangeText={value => {
                                setKocName(value)
                                clearError("kocName")
                            }}
                        />

                        {!!errors.kocName && (
                            <HelperText type="error" visible>
                                {errors.kocName}
                            </HelperText>
                        )}

                        <TextInput
                            mode="outlined"
                            label="Nền tảng chính"
                            placeholder="TikTok, Facebook, YouTube..."
                            value={socialPlatform}
                            activeOutlineColor={kocColors.primary}
                            left={<TextInput.Icon icon="web" />}
                            error={!!errors.socialPlatform}
                            onChangeText={value => {
                                setSocialPlatform(value)
                                clearError("socialPlatform")
                            }}
                        />

                        {!!errors.socialPlatform && (
                            <HelperText type="error" visible>
                                {errors.socialPlatform}
                            </HelperText>
                        )}

                        <TextInput
                            mode="outlined"
                            label="Liên kết trang cá nhân"
                            placeholder="tiktok.com/@tenkenh"
                            value={socialUrl}
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="url"
                            activeOutlineColor={kocColors.primary}
                            left={
                                <TextInput.Icon
                                    icon="link-variant"
                                />
                            }
                            error={!!errors.socialUrl}
                            onChangeText={value => {
                                setSocialUrl(value)
                                clearError("socialUrl")
                            }}
                        />

                        {!!errors.socialUrl && (
                            <HelperText type="error" visible>
                                {errors.socialUrl}
                            </HelperText>
                        )}

                        <TextInput
                            mode="outlined"
                            label="Số người theo dõi"
                            value={follower}
                            keyboardType="number-pad"
                            activeOutlineColor={kocColors.primary}
                            left={
                                <TextInput.Icon
                                    icon="account-group-outline"
                                />
                            }
                            error={!!errors.follower}
                            onChangeText={value => {
                                setFollower(
                                    value.replace(/[^0-9]/g, "")
                                )

                                clearError("follower")
                            }}
                        />

                        {!!errors.follower && (
                            <HelperText type="error" visible>
                                {errors.follower}
                            </HelperText>
                        )}

                        <Button
                            mode="contained"
                            buttonColor={kocColors.primary}
                            loading={isSubmitting}
                            disabled={isSubmitting}
                            contentStyle={kocStyles.buttonContent}
                            style={styles.submitButton}
                            onPress={handleSubmit}
                        >
                            Gửi hồ sơ xét duyệt
                        </Button>
                    </Surface>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

function normalizeUrl(value: string) {
    const trimmed = value.trim()

    if (!trimmed) return ""

    if (
        trimmed.startsWith("http://")
        || trimmed.startsWith("https://")
    ) {
        return trimmed
    }

    return `https://${trimmed}`
}

function isValidUrl(value: string) {
    if (!value.trim()) return true

    try {
        const parsed = new URL(normalizeUrl(value))

        return (
            !!parsed.hostname
            && parsed.hostname.includes(".")
        )
    } catch {
        return false
    }
}

function getErrorMessage(value: unknown) {
    if (Array.isArray(value)) {
        return value.map(String).join("\n")
    }

    if (typeof value === "string") {
        return value
    }

    return ""
}

function handleApiError(
    error: unknown,
    setErrors: React.Dispatch<
        React.SetStateAction<Record<string, string>>
    >
) {
    if (!axios.isAxiosError(error)) {
        Alert.alert(
            "Không thể gửi hồ sơ",
            "Đã xảy ra lỗi không xác định."
        )
        return
    }

    if (!error.response) {
        Alert.alert(
            "Không thể kết nối",
            "Không thể kết nối đến máy chủ."
        )
        return
    }

    const data = error.response.data

    if (
        typeof data === "object"
        && data !== null
        && !Array.isArray(data)
    ) {
        const response = data as Record<string, unknown>

        const nextErrors: Record<string, string> = {
            kocName: getErrorMessage(response.koc_name),
            socialPlatform:
                getErrorMessage(response.social_platform),
            socialUrl: getErrorMessage(response.social_url),
            follower: getErrorMessage(response.follower)
        }

        const hasFieldError = Object.values(
            nextErrors
        ).some(Boolean)

        if (hasFieldError) {
            setErrors(nextErrors)
            return
        }

        const detail = getErrorMessage(response.detail)

        if (detail) {
            Alert.alert(
                "Không thể gửi hồ sơ",
                detail
            )
            return
        }
    }

    Alert.alert(
        "Không thể gửi hồ sơ",
        "Máy chủ từ chối yêu cầu. Vui lòng kiểm tra lại thông tin."
    )
}

const styles = StyleSheet.create({
    content: {
        paddingHorizontal: 20,
        paddingTop: 28,
        paddingBottom: 40
    },
    heading: {
        alignItems: "center",
        marginBottom: 24
    },
    iconContainer: {
        width: 78,
        height: 78,
        borderRadius: 25,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14,
        backgroundColor: kocColors.primarySoft
    },
    subtitle: {
        color: kocColors.textSecondary,
        textAlign: "center",
        maxWidth: 310,
        marginTop: 7,
        lineHeight: 20
    },
    infoCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: 15,
        borderRadius: 18,
        gap: 12,
        marginBottom: 18,
        backgroundColor: kocColors.primarySoft
    },
    infoText: {
        flex: 1,
        color: kocColors.text
    },
    form: {
        gap: 8,
        backgroundColor: kocColors.surface
    },
    submitButton: {
        borderRadius: 15,
        marginTop: 12
    }
})