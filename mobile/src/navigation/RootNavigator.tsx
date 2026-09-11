import { useEffect } from "react"
import { StyleSheet, View } from "react-native"
import {
    ActivityIndicator,
    Text,
    useTheme
} from "react-native-paper"

import {
    useAppDispatch,
    useAppSelector
} from "../store/hooks"
import {
    logout,
    restoreSession
} from "../store/slices/authSlice"

import AuthNavigator from "./auth/AuthNavigator"
import ConsumerNavigator from "./consumer/ConsumerNavigator"
import FarmerNavigator from "./farmer/FarmerNavigator"
import KocNavigator from "./koc/KocNavigator"
import ProfileGate from "./ProfileGate"

export default function RootNavigator() {
    const theme = useTheme()
    const dispatch = useAppDispatch()

    const {
        user,
        isAuthenticated,
        isInitializing
    } = useAppSelector(
        state => state.auth
    )

    useEffect(() => {
        dispatch(restoreSession())
    }, [dispatch])

    const handleLogout = () => {
        dispatch(logout())
    }

    if (isInitializing) {
        return (
            <View
                style={[
                    styles.loading,
                    {
                        backgroundColor:
                            theme.colors.background
                    }
                ]}
            >
                <ActivityIndicator
                    size="large"
                    color={
                        theme.colors.primary
                    }
                />

                <Text
                    variant="titleMedium"
                    style={{
                        color:
                            theme.colors.primary
                    }}
                >
                    AgriConnect
                </Text>
            </View>
        )
    }

    if (
        !isAuthenticated
        || !user
    ) {
        return <AuthNavigator />
    }

    if (
        user.role === "FARMER"
    ) {
        return (
            <ProfileGate
                role="FARMER"
                onLogout={
                    handleLogout
                }
            >
                <FarmerNavigator />
            </ProfileGate>
        )
    }

    if (
        user.role === "KOC"
    ) {
        return (
            <ProfileGate
                role="KOC"
                onLogout={
                    handleLogout
                }
            >
                <KocNavigator />
            </ProfileGate>
        )
    }

    return <ConsumerNavigator />
}

const styles =
    StyleSheet.create({
        loading: {
            flex: 1,
            alignItems: "center",
            justifyContent:
                "center",
            gap: 12
        }
    })