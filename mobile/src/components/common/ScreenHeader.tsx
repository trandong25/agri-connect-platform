import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import type { ReactNode } from "react"
import { Pressable, StyleSheet, View } from "react-native"
import { Text } from "react-native-paper"

type Props = {
    title: string
    subtitle?: string
    eyebrow?: string
    onBack?: () => void
    right?: ReactNode
    accentColor?: string
    textColor?: string
    secondaryColor?: string
}

export default function ScreenHeader({
    title,
    subtitle,
    eyebrow,
    onBack,
    right,
    accentColor = "#2F6B3B",
    textColor = "#20251F",
    secondaryColor = "#70766D"
}: Props) {
    return (
        <View style={styles.container}>
            <View style={styles.row}>
                {onBack && (
                    <Pressable
                        style={({ pressed }) => [
                            styles.backButton,
                            {
                                backgroundColor: "#E7F1E5"
                            },
                            pressed && styles.pressed
                        ]}
                        onPress={onBack}
                    >
                        <MaterialCommunityIcons
                            name="arrow-left"
                            size={24}
                            color={accentColor}
                        />
                    </Pressable>
                )}

                <View style={styles.content}>
                    {!!eyebrow && (
                        <Text
                            variant="labelLarge"
                            style={[
                                styles.eyebrow,
                                {
                                    color: accentColor
                                }
                            ]}
                        >
                            {eyebrow}
                        </Text>
                    )}

                    <Text
                        variant="headlineSmall"
                        style={[
                            styles.title,
                            {
                                color: textColor
                            }
                        ]}
                    >
                        {title}
                    </Text>

                    {!!subtitle && (
                        <Text
                            variant="bodyMedium"
                            style={[
                                styles.subtitle,
                                {
                                    color: secondaryColor
                                }
                            ]}
                        >
                            {subtitle}
                        </Text>
                    )}
                </View>

                {right}
            </View>

            <View
                style={[
                    styles.accent,
                    {
                        backgroundColor: accentColor
                    }
                ]}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 12
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12
    },
    content: {
        flex: 1
    },
    eyebrow: {
        fontWeight: "700",
        marginBottom: 2
    },
    title: {
        fontWeight: "800"
    },
    subtitle: {
        marginTop: 4,
        lineHeight: 20
    },
    accent: {
        width: 38,
        height: 4,
        borderRadius: 2,
        marginTop: 10
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center"
    },
    pressed: {
        opacity: 0.7
    }
})