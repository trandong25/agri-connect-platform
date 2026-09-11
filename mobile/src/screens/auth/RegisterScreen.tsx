import { useState } from "react"
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View
} from "react-native"
import type {
    NativeStackScreenProps
} from "@react-navigation/native-stack"
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import axios from "axios"
import {
    Button,
    HelperText,
    Surface,
    Text,
    TextInput,
    useTheme
} from "react-native-paper"

import type {
    AuthStackParamList
} from "../../navigation/auth/AuthNavigator"
import {
    registerUser
} from "../../services/api/registerService"
import type {
    RegisterRole
} from "../../types/register"

type Props = NativeStackScreenProps<
    AuthStackParamList,
    "Register"
>

type RoleOption = {
    value: RegisterRole
    title: string
    description: string
    icon:
        | "account-outline"
        | "sprout-outline"
        | "bullhorn-outline"
}

const ROLE_OPTIONS: RoleOption[] = [
    {
        value: "CONSUMER",
        title: "Người mua",
        description: "Mua nông sản",
        icon: "account-outline"
    },
    {
        value: "FARMER",
        title: "Nông dân",
        description: "Bán nông sản",
        icon: "sprout-outline"
    },
    {
        value: "KOC",
        title: "KOC/KOL",
        description: "Quảng bá sản phẩm",
        icon: "bullhorn-outline"
    }
]

export default function RegisterScreen({
    navigation
}: Props) {
    const theme = useTheme()

    const [firstName, setFirstName] =
        useState("")

    const [lastName, setLastName] =
        useState("")

    const [username, setUsername] =
        useState("")

    const [email, setEmail] =
        useState("")

    const [phoneNumber, setPhoneNumber] =
        useState("")

    const [password, setPassword] =
        useState("")

    const [
        confirmPassword,
        setConfirmPassword
    ] = useState("")

    const [role, setRole] =
        useState<RegisterRole>(
            "CONSUMER"
        )

    const [
        showPassword,
        setShowPassword
    ] = useState(false)

    const [
        showConfirmPassword,
        setShowConfirmPassword
    ] = useState(false)

    const [
        isSubmitting,
        setIsSubmitting
    ] = useState(false)

    const [errors, setErrors] =
        useState<Record<string, string>>(
            {}
        )

    const clearFieldError = (
        field: string
    ) => {
        setErrors(current => ({
            ...current,
            [field]: ""
        }))
    }

    const validate = () => {
        const nextErrors:
            Record<string, string> = {}

        if (!firstName.trim()) {
            nextErrors.firstName =
                "Vui lòng nhập tên."
        }

        if (!lastName.trim()) {
            nextErrors.lastName =
                "Vui lòng nhập họ."
        }

        if (!username.trim()) {
            nextErrors.username =
                "Vui lòng nhập tên đăng nhập."
        } else if (
            username.trim().length < 3
        ) {
            nextErrors.username =
                "Tên đăng nhập quá ngắn."
        }

        if (!email.trim()) {
            nextErrors.email =
                "Vui lòng nhập email."
        } else if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
                .test(email.trim())
        ) {
            nextErrors.email =
                "Email chưa đúng định dạng."
        }

        if (
            phoneNumber.trim()
            && !/^(0|\+84)\d{9}$/.test(
                phoneNumber.trim()
            )
        ) {
            nextErrors.phoneNumber =
                "Số điện thoại chưa đúng định dạng."
        }

        if (!password) {
            nextErrors.password =
                "Vui lòng nhập mật khẩu."
        } else if (
            password.length < 8
        ) {
            nextErrors.password =
                "Mật khẩu phải có ít nhất 8 ký tự."
        }

        if (!confirmPassword) {
            nextErrors.confirmPassword =
                "Vui lòng nhập lại mật khẩu."
        } else if (
            confirmPassword !== password
        ) {
            nextErrors.confirmPassword =
                "Mật khẩu nhập lại không khớp."
        }

        setErrors(nextErrors)

        return (
            Object.keys(nextErrors)
                .length === 0
        )
    }

    const handleRegister = async () => {
        if (!validate()) {
            return
        }

        try {
            setIsSubmitting(true)
            setErrors({})

            await registerUser({
                first_name:
                    firstName.trim(),
                last_name:
                    lastName.trim(),
                username:
                    username.trim(),
                email:
                    email.trim()
                        .toLowerCase(),
                ...(phoneNumber.trim()
                    ? {
                        phone_number:
                            phoneNumber.trim()
                    }
                    : {}),
                password,
                role
            })

            const roleMessage =
                role === "CONSUMER"
                    ? "Bạn có thể đăng nhập và bắt đầu mua nông sản."
                    : role === "FARMER"
                        ? "Đăng nhập để hoàn thiện hồ sơ nông dân."
                        : "Đăng nhập để hoàn thiện hồ sơ KOC/KOL."

            Alert.alert(
                "Đăng ký thành công",
                roleMessage,
                [
                    {
                        text: "Đăng nhập",
                        onPress: () =>
                            navigation.replace(
                                "Login"
                            )
                    }
                ]
            )
        } catch (error) {
            handleApiError(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleApiError = (
        error: unknown
    ) => {
        if (!axios.isAxiosError(error)) {
            Alert.alert(
                "Không thể đăng ký",
                "Đã xảy ra lỗi. Vui lòng thử lại."
            )

            return
        }

        const data = error.response?.data

        if (
            !data
            || typeof data !== "object"
        ) {
            Alert.alert(
                "Không thể đăng ký",
                "Không thể kết nối đến máy chủ."
            )

            return
        }

        const nextErrors:
            Record<string, string> = {}

        Object.entries(data).forEach(
            ([field, value]) => {
                const message =
                    Array.isArray(value)
                        ? value.join(" ")
                        : String(value)

                if (
                    field ===
                    "first_name"
                ) {
                    nextErrors.firstName =
                        message

                    return
                }

                if (
                    field ===
                    "last_name"
                ) {
                    nextErrors.lastName =
                        message

                    return
                }

                if (
                    field ===
                    "phone_number"
                ) {
                    nextErrors.phoneNumber =
                        message

                    return
                }

                if (
                    [
                        "username",
                        "email",
                        "password",
                        "role"
                    ].includes(field)
                ) {
                    nextErrors[field] =
                        message

                    return
                }

                nextErrors.general =
                    message
            }
        )

        setErrors(nextErrors)

        if (
            Object.keys(nextErrors)
                .length === 0
        ) {
            Alert.alert(
                "Không thể đăng ký",
                "Vui lòng kiểm tra lại thông tin."
            )
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
                keyboardShouldPersistTaps={
                    "handled"
                }
                showsVerticalScrollIndicator={
                    false
                }
            >
                <Pressable
                    style={styles.backButton}
                    onPress={() =>
                        navigation.goBack()
                    }
                >
                    <MaterialCommunityIcons
                        name="arrow-left"
                        size={25}
                        color={
                            theme.colors
                                .onBackground
                        }
                    />
                </Pressable>

                <View
                    style={styles.heading}
                >
                    <View
                        style={[
                            styles.logo,
                            {
                                backgroundColor:
                                    theme.colors
                                        .primaryContainer
                            }
                        ]}
                    >
                        <MaterialCommunityIcons
                            name="sprout"
                            size={38}
                            color={
                                theme.colors
                                    .primary
                            }
                        />
                    </View>

                    <Text
                        variant="headlineMedium"
                        style={styles.title}
                    >
                        Tạo tài khoản
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
                        Tham gia AgriConnect và kết nối nông sản Việt
                    </Text>
                </View>

                <View
                    style={styles.section}
                >
                    <Text
                        variant="titleMedium"
                        style={styles.sectionTitle}
                    >
                        Bạn tham gia với vai trò?
                    </Text>

                    <View
                        style={
                            styles.roleContainer
                        }
                    >
                        {ROLE_OPTIONS.map(
                            option => (
                                <RoleCard
                                    key={
                                        option.value
                                    }
                                    option={
                                        option
                                    }
                                    selected={
                                        role ===
                                        option.value
                                    }
                                    onPress={() => {
                                        setRole(
                                            option.value
                                        )

                                        clearFieldError(
                                            "role"
                                        )
                                    }}
                                />
                            )
                        )}
                    </View>

                    {!!errors.role && (
                        <HelperText
                            type="error"
                            visible
                        >
                            {errors.role}
                        </HelperText>
                    )}
                </View>

                <Surface
                    elevation={0}
                    style={[
                        styles.formCard,
                        {
                            backgroundColor:
                                theme.colors.surface
                        }
                    ]}
                >
                    <View
                        style={
                            styles.nameRow
                        }
                    >
                        <View
                            style={styles.half}
                        >
                            <TextInput
                                mode="outlined"
                                label="Họ"
                                value={
                                    lastName
                                }
                                error={
                                    !!errors.lastName
                                }
                                onChangeText={
                                    value => {
                                        setLastName(
                                            value
                                        )

                                        clearFieldError(
                                            "lastName"
                                        )
                                    }
                                }
                                style={
                                    styles.input
                                }
                            />

                            <FieldError
                                error={
                                    errors.lastName
                                }
                            />
                        </View>

                        <View
                            style={styles.half}
                        >
                            <TextInput
                                mode="outlined"
                                label="Tên"
                                value={
                                    firstName
                                }
                                error={
                                    !!errors.firstName
                                }
                                onChangeText={
                                    value => {
                                        setFirstName(
                                            value
                                        )

                                        clearFieldError(
                                            "firstName"
                                        )
                                    }
                                }
                                style={
                                    styles.input
                                }
                            />

                            <FieldError
                                error={
                                    errors.firstName
                                }
                            />
                        </View>
                    </View>

                    <TextInput
                        mode="outlined"
                        label="Tên đăng nhập"
                        value={username}
                        autoCapitalize="none"
                        left={
                            <TextInput.Icon
                                icon="account-outline"
                            />
                        }
                        error={
                            !!errors.username
                        }
                        onChangeText={
                            value => {
                                setUsername(
                                    value
                                )

                                clearFieldError(
                                    "username"
                                )
                            }
                        }
                        style={styles.input}
                    />

                    <FieldError
                        error={
                            errors.username
                        }
                    />

                    <TextInput
                        mode="outlined"
                        label="Email"
                        value={email}
                        autoCapitalize="none"
                        keyboardType={
                            "email-address"
                        }
                        left={
                            <TextInput.Icon
                                icon="email-outline"
                            />
                        }
                        error={
                            !!errors.email
                        }
                        onChangeText={
                            value => {
                                setEmail(value)

                                clearFieldError(
                                    "email"
                                )
                            }
                        }
                        style={styles.input}
                    />

                    <FieldError
                        error={errors.email}
                    />

                    <TextInput
                        mode="outlined"
                        label="Số điện thoại (không bắt buộc)"
                        value={phoneNumber}
                        keyboardType="phone-pad"
                        left={
                            <TextInput.Icon
                                icon="phone-outline"
                            />
                        }
                        error={
                            !!errors.phoneNumber
                        }
                        onChangeText={
                            value => {
                                setPhoneNumber(
                                    value
                                )

                                clearFieldError(
                                    "phoneNumber"
                                )
                            }
                        }
                        style={styles.input}
                    />

                    <FieldError
                        error={
                            errors.phoneNumber
                        }
                    />

                    <TextInput
                        mode="outlined"
                        label="Mật khẩu"
                        value={password}
                        secureTextEntry={
                            !showPassword
                        }
                        left={
                            <TextInput.Icon
                                icon="lock-outline"
                            />
                        }
                        right={
                            <TextInput.Icon
                                icon={
                                    showPassword
                                        ? "eye-off-outline"
                                        : "eye-outline"
                                }
                                onPress={() =>
                                    setShowPassword(
                                        current =>
                                            !current
                                    )
                                }
                            />
                        }
                        error={
                            !!errors.password
                        }
                        onChangeText={
                            value => {
                                setPassword(
                                    value
                                )

                                clearFieldError(
                                    "password"
                                )
                            }
                        }
                        style={styles.input}
                    />

                    <FieldError
                        error={
                            errors.password
                        }
                    />

                    <TextInput
                        mode="outlined"
                        label="Nhập lại mật khẩu"
                        value={
                            confirmPassword
                        }
                        secureTextEntry={
                            !showConfirmPassword
                        }
                        left={
                            <TextInput.Icon
                                icon="lock-check-outline"
                            />
                        }
                        right={
                            <TextInput.Icon
                                icon={
                                    showConfirmPassword
                                        ? "eye-off-outline"
                                        : "eye-outline"
                                }
                                onPress={() =>
                                    setShowConfirmPassword(
                                        current =>
                                            !current
                                    )
                                }
                            />
                        }
                        error={
                            !!errors
                                .confirmPassword
                        }
                        onChangeText={
                            value => {
                                setConfirmPassword(
                                    value
                                )

                                clearFieldError(
                                    "confirmPassword"
                                )
                            }
                        }
                        style={styles.input}
                    />

                    <FieldError
                        error={
                            errors.confirmPassword
                        }
                    />

                    {!!errors.general && (
                        <Surface
                            elevation={0}
                            style={[
                                styles.errorBox,
                                {
                                    backgroundColor:
                                        theme.colors
                                            .errorContainer
                                }
                            ]}
                        >
                            <MaterialCommunityIcons
                                name="alert-circle-outline"
                                size={20}
                                color={
                                    theme.colors
                                        .error
                                }
                            />

                            <Text
                                variant="bodySmall"
                                style={{
                                    flex: 1,
                                    color:
                                        theme.colors
                                            .onErrorContainer
                                }}
                            >
                                {
                                    errors.general
                                }
                            </Text>
                        </Surface>
                    )}

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
                            handleRegister
                        }
                    >
                        Tạo tài khoản
                    </Button>
                </Surface>

                <View
                    style={styles.loginRow}
                >
                    <Text
                        variant="bodyMedium"
                        style={{
                            color:
                                theme.colors
                                    .onSurfaceVariant
                        }}
                    >
                        Đã có tài khoản?
                    </Text>

                    <Button
                        mode="text"
                        compact
                        onPress={() =>
                            navigation.goBack()
                        }
                    >
                        Đăng nhập
                    </Button>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}

function RoleCard({
    option,
    selected,
    onPress
}: {
    option: RoleOption
    selected: boolean
    onPress: () => void
}) {
    const theme = useTheme()

    return (
        <Pressable
            style={[
                styles.roleCard,
                {
                    backgroundColor:
                        selected
                            ? theme.colors
                                .primaryContainer
                            : theme.colors
                                .surface,
                    borderColor:
                        selected
                            ? theme.colors
                                .primary
                            : theme.colors
                                .outlineVariant
                }
            ]}
            onPress={onPress}
        >
            <View
                style={[
                    styles.roleIcon,
                    {
                        backgroundColor:
                            selected
                                ? theme.colors
                                    .primary
                                : theme.colors
                                    .surfaceVariant
                    }
                ]}
            >
                <MaterialCommunityIcons
                    name={option.icon}
                    size={25}
                    color={
                        selected
                            ? theme.colors
                                .onPrimary
                            : theme.colors
                                .onSurfaceVariant
                    }
                />
            </View>

            <Text
                variant="labelLarge"
                numberOfLines={1}
                style={[
                    styles.roleTitle,
                    {
                        color:
                            selected
                                ? theme.colors
                                    .primary
                                : theme.colors
                                    .onSurface
                    }
                ]}
            >
                {option.title}
            </Text>

            <Text
                variant="bodySmall"
                numberOfLines={2}
                style={[
                    styles.roleDescription,
                    {
                        color:
                            theme.colors
                                .onSurfaceVariant
                    }
                ]}
            >
                {option.description}
            </Text>
        </Pressable>
    )
}

function FieldError({
    error
}: {
    error?: string
}) {
    if (!error) {
        return null
    }

    return (
        <HelperText
            type="error"
            visible
            style={styles.helper}
        >
            {error}
        </HelperText>
    )
}

const styles = StyleSheet.create({
    screen: {
        flex: 1
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 32
    },
    backButton: {
        width: 42,
        height: 42,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: -8
    },
    heading: {
        alignItems: "center",
        marginTop: 4,
        marginBottom: 26
    },
    logo: {
        width: 68,
        height: 68,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14
    },
    title: {
        fontWeight: "800"
    },
    subtitle: {
        textAlign: "center",
        marginTop: 6,
        maxWidth: 310
    },
    section: {
        marginBottom: 18
    },
    sectionTitle: {
        fontWeight: "700",
        marginBottom: 12
    },
    roleContainer: {
        flexDirection: "row",
        gap: 8
    },
    roleCard: {
        flex: 1,
        minHeight: 122,
        borderWidth: 1.5,
        borderRadius: 18,
        paddingHorizontal: 7,
        paddingVertical: 12,
        alignItems: "center"
    },
    roleIcon: {
        width: 46,
        height: 46,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8
    },
    roleTitle: {
        fontWeight: "700",
        textAlign: "center"
    },
    roleDescription: {
        textAlign: "center",
        marginTop: 3
    },
    formCard: {
        borderRadius: 22,
        gap: 3
    },
    nameRow: {
        flexDirection: "row",
        gap: 10
    },
    half: {
        flex: 1
    },
    input: {
        backgroundColor: "transparent"
    },
    helper: {
        paddingHorizontal: 8,
        paddingTop: 1,
        paddingBottom: 2
    },
    errorBox: {
        flexDirection: "row",
        gap: 8,
        padding: 12,
        borderRadius: 12,
        marginTop: 6
    },
    submitButton: {
        borderRadius: 14,
        marginTop: 12
    },
    submitContent: {
        height: 52
    },
    loginRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 18
    }
})