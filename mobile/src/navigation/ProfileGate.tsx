import {
    type ReactNode,
    useCallback,
    useEffect,
    useState
} from "react"
import {
    StyleSheet,
    View
} from "react-native"
import axios from "axios"
import {
    ActivityIndicator,
    Button,
    Text,
    useTheme
} from "react-native-paper"

import ProfileApproval from "../components/ProfileApproval"
import FarmerProfileSetupScreen from "../screens/farmer/FarmerProfileSetupScreen"
import KocProfileSetupScreen from "../screens/koc/KocProfileSetupScreen"
import {
    getCurrentFarmerProfile,
    getCurrentKocProfile
} from "../services/api/profileService"
import type {
    FarmerProfile,
    KocProfile
} from "../types/profile"

type ProfileRole =
    | "FARMER"
    | "KOC"

type Profile =
    | FarmerProfile
    | KocProfile

type Props = {
    role: ProfileRole
    children: ReactNode
    onLogout: () => void
}

export default function ProfileGate({
    role,
    children,
    onLogout
}: Props) {
    const theme = useTheme()

    const [profile, setProfile] =
        useState<Profile | null>(null)

    const [
        profileExists,
        setProfileExists
    ] =
        useState<boolean | null>(null)

    const [isLoading, setIsLoading] =
        useState(true)

    const [error, setError] =
        useState("")

    const loadProfile =
        useCallback(async () => {
            try {
                setIsLoading(true)
                setError("")

                const data =
                    role === "FARMER"
                        ? await getCurrentFarmerProfile()
                        : await getCurrentKocProfile()

                setProfile(data)
                setProfileExists(true)
            } catch (requestError) {
                if (
                    axios.isAxiosError(
                        requestError
                    )
                    && requestError
                        .response
                        ?.status === 404
                ) {
                    setProfile(null)
                    setProfileExists(false)

                    return
                }

                setError(
                    "Không thể kiểm tra hồ sơ."
                )
            } finally {
                setIsLoading(false)
            }
        }, [role])

    useEffect(() => {
        loadProfile()
    }, [loadProfile])

    if (
        isLoading
        && profileExists === null
    ) {
        return (
            <View
                style={[
                    styles.center,
                    {
                        backgroundColor:
                            theme.colors.background
                    }
                ]}
            >
                <ActivityIndicator
                    size="large"
                />

                <Text>
                    Đang kiểm tra hồ sơ...
                </Text>
            </View>
        )
    }

    if (error) {
        return (
            <View
                style={[
                    styles.center,
                    {
                        backgroundColor:
                            theme.colors.background
                    }
                ]}
            >
                <Text
                    variant="titleMedium"
                    style={styles.bold}
                >
                    Không thể tải hồ sơ
                </Text>

                <Text
                    variant="bodyMedium"
                    style={{
                        textAlign:
                            "center"
                    }}
                >
                    {error}
                </Text>

                <Button
                    mode="contained"
                    icon="refresh"
                    onPress={
                        loadProfile
                    }
                >
                    Thử lại
                </Button>
            </View>
        )
    }

    if (!profileExists) {
        if (
            role === "FARMER"
        ) {
            return (
                <FarmerProfileSetupScreen
                    onCreated={
                        created => {
                            setProfile(
                                created
                            )

                            setProfileExists(
                                true
                            )
                        }
                    }
                />
            )
        }

        return (
            <KocProfileSetupScreen
                onCreated={
                    created => {
                        setProfile(
                            created
                        )

                        setProfileExists(
                            true
                        )
                    }
                }
            />
        )
    }

    if (
        profile
        && profile.approval_status !==
            "APPROVED"
    ) {
        return (
            <ProfileApproval
                role={role}
                status={profile.approval_status}
                isRefreshing={isLoading}
                onRefresh={loadProfile}
                onLogout={onLogout}
            />
        )
    }

    return <>{children}</>
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        gap: 12
    },
    bold: {
        fontWeight: "700"
    }
})