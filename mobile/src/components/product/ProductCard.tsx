import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import { useState } from "react"
import { Image, StyleSheet, View } from "react-native"
import { Card, Text, useTheme } from "react-native-paper"

import type { Product } from "../../types/product"

type Props = {
    product: Product
    onPress?: () => void
}

export default function ProductCard({
    product,
    onPress
}: Props) {
    const theme = useTheme()
    const [imageError, setImageError] = useState(false)

    const primaryImage =
        product.images.find(image => image.is_primary)
        ?? product.images[0]

    const imageUri = primaryImage?.image

    return (
        <Card
            mode="elevated"
            style={[
                styles.card,
                { backgroundColor: theme.colors.surface }
            ]}
            onPress={onPress}
        >
            {imageUri && !imageError ? (
                <Image
                    source={{ uri: imageUri }}
                    style={styles.image}
                    resizeMode="cover"
                    onError={() => setImageError(true)}
                />
            ) : (
                <View
                    style={[
                        styles.image,
                        styles.placeholder,
                        {
                            backgroundColor:
                                theme.colors.primaryContainer
                        }
                    ]}
                >
                    <MaterialCommunityIcons
                        name="image-outline"
                        size={38}
                        color={theme.colors.primary}
                    />
                </View>
            )}

            <Card.Content style={styles.content}>
                <Text
                    variant="titleSmall"
                    style={styles.name}
                    numberOfLines={2}
                >
                    {product.name}
                </Text>

                <View style={styles.priceRow}>
                    <Text
                        variant="titleMedium"
                        style={[
                            styles.price,
                            { color: theme.colors.primary }
                        ]}
                    >
                        {formatMoney(product.price)}
                    </Text>

                    <Text
                        variant="bodySmall"
                        style={{
                            color:
                                theme.colors.onSurfaceVariant
                        }}
                    >
                        /{product.unit_symbol}
                    </Text>
                </View>

                <View style={styles.infoRow}>
                    <MaterialCommunityIcons
                        name="storefront-outline"
                        size={14}
                        color={theme.colors.onSurfaceVariant}
                    />

                    <Text
                        variant="bodySmall"
                        numberOfLines={1}
                        style={[
                            styles.infoText,
                            {
                                color:
                                    theme.colors.onSurfaceVariant
                            }
                        ]}
                    >
                        {product.farmer_name}
                    </Text>
                </View>

                {!!product.origin && (
                    <View style={styles.infoRow}>
                        <MaterialCommunityIcons
                            name="map-marker-outline"
                            size={14}
                            color={theme.colors.onSurfaceVariant}
                        />

                        <Text
                            variant="bodySmall"
                            numberOfLines={1}
                            style={[
                                styles.infoText,
                                {
                                    color:
                                        theme.colors.onSurfaceVariant
                                }
                            ]}
                        >
                            {product.origin}
                        </Text>
                    </View>
                )}
            </Card.Content>
        </Card>
    )
}

function formatMoney(value: string) {
    return `${Number(value).toLocaleString("vi-VN")} đ`
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        borderRadius: 16,
        overflow: "hidden"
    },
    image: {
        width: "100%",
        height: 132
    },
    placeholder: {
        alignItems: "center",
        justifyContent: "center"
    },
    content: {
        paddingTop: 10,
        paddingHorizontal: 11,
        paddingBottom: 12,
        gap: 5
    },
    name: {
        minHeight: 40,
        fontWeight: "700"
    },
    priceRow: {
        flexDirection: "row",
        alignItems: "baseline",
        gap: 3
    },
    price: {
        fontWeight: "800"
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4
    },
    infoText: {
        flex: 1
    }
})