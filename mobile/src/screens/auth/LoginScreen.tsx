import { useState } from "react"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native"
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { Button, HelperText, Surface, Text, TextInput, useTheme } from "react-native-paper"

import type { AuthStackParamList } from "../../navigation/auth/AuthNavigator"
import { useAppDispatch, useAppSelector } from "../../store/hooks"
import { loginUser } from "../../store/slices/authSlice"

type Props = NativeStackScreenProps<AuthStackParamList, "Login">

export default function LoginScreen({ navigation }: Props) {
    const theme = useTheme()
    const dispatch = useAppDispatch()

    const [usernameOrEmail, setUsernameOrEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [usernameError, setUsernameError] = useState("")
    const [passwordError, setPasswordError] = useState("")

    const {
        isLoading,
        error: loginError
    } = useAppSelector(state => state.auth)

    const handleLogin = () => {
        let isValid = true

        if (!usernameOrEmail.trim()) {
            setUsernameError("Vui lòng nhập tên đăng nhập hoặc email.")
            isValid = false
        } else {
            setUsernameError("")
        }

        if (!password) {
            setPasswordError("Vui lòng nhập mật khẩu.")
            isValid = false
        } else {
            setPasswordError("")
        }

        if (!isValid) {
            return
        }

        dispatch(loginUser({
            login: usernameOrEmail.trim(),
            password
        }))
    }

    return (
        <KeyboardAvoidingView
            style={[
                styles.screen,
                { backgroundColor: theme.colors.background }
            ]}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.brand}>
                    <View
                        style={[
                            styles.logo,
                            { backgroundColor: theme.colors.primaryContainer }
                        ]}
                    >
                        <MaterialCommunityIcons
                            name="sprout"
                            size={48}
                            color={theme.colors.primary}
                        />
                    </View>

                    <Text
                        variant="headlineMedium"
                        style={[
                            styles.appName,
                            { color: theme.colors.primary }
                        ]}
                    >
                        AgriConnect
                    </Text>

                    <Text
                        variant="bodyMedium"
                        style={[
                            styles.subtitle,
                            { color: theme.colors.onSurfaceVariant }
                        ]}
                    >
                        Kết nối nông dân và người tiêu dùng
                    </Text>
                </View>

                <Surface
                    elevation={1}
                    style={[
                        styles.form,
                        { backgroundColor: theme.colors.surface }
                    ]}
                >
                    <View style={styles.formHeader}>
                        <Text variant="headlineSmall">
                            Đăng nhập
                        </Text>

                        <Text
                            variant="bodyMedium"
                            style={{ color: theme.colors.onSurfaceVariant }}
                        >
                            Đăng nhập để tiếp tục với AgriConnect
                        </Text>
                    </View>

                    <View>
                        <TextInput
                            label="Tên đăng nhập hoặc email"
                            mode="outlined"
                            value={usernameOrEmail}
                            onChangeText={text => {
                                setUsernameOrEmail(text)
                                setUsernameError("")
                            }}
                            autoCapitalize="none"
                            autoCorrect={false}
                            error={!!usernameError}
                            disabled={isLoading}
                            left={<TextInput.Icon icon="account-outline" />}
                        />

                        <HelperText
                            type="error"
                            visible={!!usernameError}
                        >
                            {usernameError}
                        </HelperText>
                    </View>

                    <View>
                        <TextInput
                            label="Mật khẩu"
                            mode="outlined"
                            value={password}
                            onChangeText={text => {
                                setPassword(text)
                                setPasswordError("")
                            }}
                            secureTextEntry={!showPassword}
                            error={!!passwordError}
                            disabled={isLoading}
                            left={<TextInput.Icon icon="lock-outline" />}
                            right={
                                <TextInput.Icon
                                    icon={showPassword ? "eye-off" : "eye"}
                                    onPress={() => setShowPassword(!showPassword)}
                                />
                            }
                            returnKeyType="done"
                            onSubmitEditing={handleLogin}
                        />

                        <HelperText
                            type="error"
                            visible={!!passwordError}
                        >
                            {passwordError}
                        </HelperText>
                    </View>

                    {!!loginError && (
                        <View
                            style={[
                                styles.loginError,
                                { backgroundColor: theme.colors.errorContainer }
                            ]}
                        >
                            <MaterialCommunityIcons
                                name="alert-circle-outline"
                                size={20}
                                color={theme.colors.error}
                            />

                            <Text
                                variant="bodySmall"
                                style={[
                                    styles.loginErrorText,
                                    { color: theme.colors.onErrorContainer }
                                ]}
                            >
                                {loginError}
                            </Text>
                        </View>
                    )}

                    <Button
                        mode="contained"
                        onPress={handleLogin}
                        loading={isLoading}
                        disabled={isLoading}
                        contentStyle={styles.loginButtonContent}
                    >
                        {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
                    </Button>

                    <View
                        style={{
                            flexDirection: "row",
                            justifyContent: "center",
                            alignItems: "center",
                            marginTop: 16
                        }}
                    >
                        <Text>
                            Chưa có tài khoản?
                        </Text>

                        <Button
                            mode="text"
                            compact
                            onPress={() =>
                                navigation.navigate(
                                    "Register"
                                )
                            }
                        >
                            Đăng ký ngay
                        </Button>
                    </View>
                </Surface>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    screen: {
        flex: 1
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "center",
        padding: 24,
        gap: 28
    },
    brand: {
        alignItems: "center",
        gap: 8
    },
    logo: {
        width: 84,
        height: 84,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 4
    },
    appName: {
        fontWeight: "700"
    },
    subtitle: {
        textAlign: "center"
    },
    form: {
        borderRadius: 24,
        padding: 20,
        gap: 8
    },
    formHeader: {
        gap: 6,
        marginBottom: 12
    },
    loginError: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        borderRadius: 12,
        padding: 12,
        marginBottom: 4
    },
    loginErrorText: {
        flex: 1
    },
    loginButtonContent: {
        height: 48
    }
})