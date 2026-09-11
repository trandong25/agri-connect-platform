import { useCallback, useState } from "react"
import {
    Pressable,
    StyleSheet,
    View
} from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import {
    Surface,
    Text,
    useTheme
} from "react-native-paper"

import { getNotifications } from "../services/api/notificationService"

type Props = {
    onPress: () => void
}

export default function NotificationBell({
    onPress
}: Props) {
    const theme = useTheme()

    const [unreadCount, setUnreadCount] =
        useState(0)

    const loadUnreadCount =
        useCallback(async () => {
            try {
                const notifications =
                    await getNotifications(false)

                setUnreadCount(
                    notifications.length
                )
            } catch {
                setUnreadCount(0)
            }
        }, [])

    useFocusEffect(
        useCallback(() => {
            loadUnreadCount()
        }, [loadUnreadCount])
    )

    return (
        <Pressable
            onPress={onPress}
            hitSlop={8}
        >
            <Surface
                elevation={0}
                style={[
                    styles.container,
                    {
                        backgroundColor:
                            theme.colors
                                .primaryContainer
                    }
                ]}
            >
                <MaterialCommunityIcons
                    name="bell-outline"
                    size={25}
                    color={
                        theme.colors.primary
                    }
                />

                {unreadCount > 0 && (
                    <View
                        style={[
                            styles.badge,
                            {
                                backgroundColor:
                                    theme.colors.error
                            }
                        ]}
                    >
                        <Text
                            style={
                                styles.badgeText
                            }
                        >
                            {unreadCount > 99
                                ? "99+"
                                : unreadCount}
                        </Text>
                    </View>
                )}
            </Surface>
        </Pressable>
    )
}

const styles =
    StyleSheet.create({
        container: {
            width: 46,
            height: 46,
            borderRadius: 15,
            alignItems: "center",
            justifyContent: "center"
        },
        badge: {
            position: "absolute",
            top: -3,
            right: -4,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            paddingHorizontal: 4,
            alignItems: "center",
            justifyContent: "center"
        },
        badgeText: {
            color: "white",
            fontSize: 10,
            fontWeight: "700"
        }
    })