import { useState } from "react"
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View
} from "react-native"
import * as ImagePicker from "expo-image-picker"
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import {
    Button,
    HelperText,
    Surface,
    Text,
    TextInput,
    useTheme
} from "react-native-paper"

import { createFarmerProfile } from "../../services/api/profileService"
import type {
    FarmerProfile,
    VerificationFile
} from "../../types/profile"

type Props = {
    onCreated: (
        profile: FarmerProfile
    ) => void
}

export default function FarmerProfileSetupScreen({
    onCreated
}: Props) {
    const theme = useTheme()

    const [farmName, setFarmName] =
        useState("")

    const [address, setAddress] =
        useState("")

    const [description, setDescription] =
        useState("")

    const [
        verificationDocument,
        setVerificationDocument
    ] =
        useState<VerificationFile | null>(
            null
        )

    const [
        verificationPreview,
        setVerificationPreview
    ] =
        useState<string | null>(null)

    const [isSubmitting, setIsSubmitting] =
        useState(false)

    const [errors, setErrors] =
        useState<Record<string, string>>(
            {}
        )

    const chooseVerificationDocument =
        async () => {
            const permission =
                await ImagePicker
                    .requestMediaLibraryPermissionsAsync()

            if (!permission.granted) {
                Alert.alert(
                    "Cần quyền thư viện ảnh",
                    "Ứng dụng cần quyền truy cập ảnh để chọn giấy tờ xác minh."
                )

                return
            }

            const result =
                await ImagePicker
                    .launchImageLibraryAsync({
                        mediaTypes: ["images"],
                        allowsEditing: false,
                        quality: 0.9
                    })

            if (result.canceled) {
                return
            }

            const asset =
                result.assets[0]

            setVerificationPreview(
                asset.uri
            )

            setVerificationDocument({
                uri: asset.uri,
                name:
                    asset.fileName
                    ?? `verification-${Date.now()}.jpg`,
                type:
                    asset.mimeType
                    ?? "image/jpeg"
            })
        }

    const validate = () => {
        const nextErrors:
            Record<string, string> = {}

        if (!farmName.trim()) {
            nextErrors.farmName =
                "Vui lòng nhập tên nông trại."
        }

        if (!address.trim()) {
            nextErrors.address =
                "Vui lòng nhập địa chỉ nông trại."
        }

        setErrors(nextErrors)

        return (
            Object.keys(nextErrors)
                .length === 0
        )
    }

    const handleSubmit = async () => {
        if (!validate()) {
            return
        }

        try {
            setIsSubmitting(true)

            const profile =
                await createFarmerProfile({
                    farm_name:
                        farmName.trim(),
                    address:
                        address.trim(),
                    description:
                        description.trim(),
                    verification_document:
                        verificationDocument
                })

            onCreated(profile)
        } catch {
            Alert.alert(
                "Không thể gửi hồ sơ",
                "Vui lòng kiểm tra thông tin và thử lại."
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <KeyboardAvoidingView
            style={[
                styles.screen,
                {
                    backgroundColor:
                        theme.colors.background
                }
            ]}
            behavior={
                Platform.OS === "ios"
                    ? "padding"
                    : undefined
            }
        >
            <ScrollView
                contentContainerStyle={
                    styles.content
                }
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={
                    false
                }
            >
                <View style={styles.heading}>
                    <View
                        style={[
                            styles.iconContainer,
                            {
                                backgroundColor:
                                    theme.colors
                                        .primaryContainer
                            }
                        ]}
                    >
                        <MaterialCommunityIcons
                            name="sprout"
                            size={42}
                            color={
                                theme.colors.primary
                            }
                        />
                    </View>

                    <Text
                        variant="headlineMedium"
                        style={styles.title}
                    >
                        Hồ sơ nông dân
                    </Text>

                    <Text
                        variant="bodyMedium"
                        style={[
                            styles.subtitle,
                            {
                                color:
                                    theme.colors
                                        .onSurfaceVariant
                            }
                        ]}
                    >
                        Thêm thông tin nông trại để AgriConnect xác minh tài khoản của bạn.
                    </Text>
                </View>

                <Surface
                    elevation={0}
                    style={[
                        styles.infoCard,
                        {
                            backgroundColor:
                                theme.colors
                                    .primaryContainer
                        }
                    ]}
                >
                    <MaterialCommunityIcons
                        name="shield-check-outline"
                        size={26}
                        color={
                            theme.colors.primary
                        }
                    />

                    <Text
                        variant="bodyMedium"
                        style={styles.infoText}
                    >
                        Hồ sơ sẽ được quản trị viên xét duyệt trước khi bạn có thể đăng bán nông sản.
                    </Text>
                </Surface>

                <Surface
                    elevation={0}
                    style={[
                        styles.form,
                        {
                            backgroundColor:
                                theme.colors.surface
                        }
                    ]}
                >
                    <TextInput
                        mode="outlined"
                        label="Tên nông trại"
                        value={farmName}
                        left={
                            <TextInput.Icon
                                icon="barn"
                            />
                        }
                        error={
                            !!errors.farmName
                        }
                        onChangeText={
                            value => {
                                setFarmName(value)

                                setErrors(
                                    current => ({
                                        ...current,
                                        farmName: ""
                                    })
                                )
                            }
                        }
                    />

                    {!!errors.farmName && (
                        <HelperText
                            type="error"
                            visible
                        >
                            {errors.farmName}
                        </HelperText>
                    )}

                    <TextInput
                        mode="outlined"
                        label="Địa chỉ nông trại"
                        value={address}
                        left={
                            <TextInput.Icon
                                icon="map-marker-outline"
                            />
                        }
                        error={
                            !!errors.address
                        }
                        onChangeText={
                            value => {
                                setAddress(value)

                                setErrors(
                                    current => ({
                                        ...current,
                                        address: ""
                                    })
                                )
                            }
                        }
                    />

                    {!!errors.address && (
                        <HelperText
                            type="error"
                            visible
                        >
                            {errors.address}
                        </HelperText>
                    )}

                    <TextInput
                        mode="outlined"
                        label="Giới thiệu nông trại"
                        value={description}
                        multiline
                        numberOfLines={4}
                        onChangeText={
                            setDescription
                        }
                    />

                    <View
                        style={
                            styles.documentSection
                        }
                    >
                        <Text
                            variant="titleMedium"
                            style={styles.bold}
                        >
                            Giấy tờ xác minh
                        </Text>

                        <Text
                            variant="bodySmall"
                            style={{
                                color:
                                    theme.colors
                                        .onSurfaceVariant
                            }}
                        >
                            Bạn có thể bổ sung ảnh giấy tờ liên quan đến nông trại.
                        </Text>

                        {verificationPreview ? (
                            <Image
                                source={{
                                    uri:
                                        verificationPreview
                                }}
                                style={
                                    styles.documentImage
                                }
                                resizeMode="cover"
                            />
                        ) : (
                            <View
                                style={[
                                    styles.documentEmpty,
                                    {
                                        backgroundColor:
                                            theme.colors
                                                .surfaceVariant
                                    }
                                ]}
                            >
                                <MaterialCommunityIcons
                                    name="file-image-outline"
                                    size={42}
                                    color={
                                        theme.colors
                                            .onSurfaceVariant
                                    }
                                />

                                <Text
                                    variant="bodySmall"
                                    style={{
                                        color:
                                            theme.colors
                                                .onSurfaceVariant
                                    }}
                                >
                                    Chưa chọn ảnh
                                </Text>
                            </View>
                        )}

                        <Button
                            mode="outlined"
                            icon="image-plus"
                            onPress={
                                chooseVerificationDocument
                            }
                        >
                            Chọn ảnh giấy tờ
                        </Button>
                    </View>

                    <Button
                        mode="contained"
                        loading={
                            isSubmitting
                        }
                        disabled={
                            isSubmitting
                        }
                        contentStyle={
                            styles.submitContent
                        }
                        style={
                            styles.submitButton
                        }
                        onPress={
                            handleSubmit
                        }
                    >
                        Gửi hồ sơ xét duyệt
                    </Button>
                </Surface>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    screen: {
        flex: 1
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 44,
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
        marginBottom: 14
    },
    title: {
        fontWeight: "800"
    },
    subtitle: {
        textAlign: "center",
        maxWidth: 320,
        marginTop: 7,
        lineHeight: 20
    },
    infoCard: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 18,
        padding: 15,
        gap: 12,
        marginBottom: 18
    },
    infoText: {
        flex: 1
    },
    form: {
        gap: 8
    },
    documentSection: {
        gap: 9,
        marginTop: 6
    },
    documentEmpty: {
        height: 130,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        gap: 6
    },
    documentImage: {
        width: "100%",
        height: 170,
        borderRadius: 18
    },
    submitButton: {
        borderRadius: 15,
        marginTop: 12
    },
    submitContent: {
        height: 52
    },
    bold: {
        fontWeight: "700"
    }
})