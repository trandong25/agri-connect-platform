import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { Pressable, StyleSheet, View } from "react-native"
import { Surface, Text } from "react-native-paper"

type IconName = keyof typeof MaterialCommunityIcons.glyphMap

type Props = {
    icon: IconName
    title: string
    description: string
    onPress: () => void
    accentColor?: string
    softColor?: string
}

export default function QuickActionCard({
    icon,
    title,
    description,
    onPress,
    accentColor = "#2F6B3B",
    softColor = "#E7F1E5"
}: Props) {
    return (
        <Pressable style={styles.wrapper} onPress={onPress}>
            {({ pressed }) => (
                <Surface
                    elevation={1}
                    style={[
                        styles.card,
                        pressed && styles.pressed
                    ]}
                >
                    <View
                        style={[
                            styles.icon,
                            {
                                backgroundColor: softColor
                            }
                        ]}
                    >
                        <MaterialCommunityIcons
                            name={icon}
                            size={26}
                            color={accentColor}
                        />
                    </View>

                    <Text variant="titleMedium" style={styles.title}>
                        {title}
                    </Text>

                    <Text
                        variant="bodySmall"
                        style={styles.description}
                    >
                        {description}
                    </Text>
                </Surface>
            )}
        </Pressable>
    )
}

const styles = StyleSheet.create({
    wrapper: {
        width: "48.5%"
    },
    card: {
        minHeight: 126,
        padding: 14,
        borderRadius: 16,
        backgroundColor: "#FFFFFF"
    },
    icon: {
        width: 46,
        height: 46,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10
    },
    title: {
        fontWeight: "700",
        color: "#20251F",
        marginBottom: 3
    },
    description: {
        color: "#70766D"
    },
    pressed: {
        opacity: 0.75
    }
})