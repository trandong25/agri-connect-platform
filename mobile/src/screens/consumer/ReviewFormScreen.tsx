import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useState } from "react"
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    View
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import {
    Button,
    Surface,
    Text,
    TextInput
} from "react-native-paper"

import type { ConsumerStackParamList } from "../../navigation/consumer/ConsumerNavigator"
import {
    createReview,
    updateReview
} from "../../services/api/reviewService"
import {
    consumerColors,
    consumerStyles
} from "./consumerStyles"

type Props = NativeStackScreenProps<
    ConsumerStackParamList,
    "ReviewForm"
>

export function ReviewFormScreen({
    route,
    navigation
}: Props) {
    const {
        productId,
        orderItemId,
        productName,
        review
    } = route.params

    const [rating, setRating] = useState(
        review?.rating ?? 5
    )

    const [comment, setComment] = useState(
        review?.comment ?? ""
    )

    const [isSubmitting, setIsSubmitting] =
        useState(false)

    const handleSubmit = async () => {
        if (rating < 1 || rating > 5) {
            Alert.alert(
                "Chưa chọn đánh giá",
                "Vui lòng chọn từ 1 đến 5 sao."
            )
            return
        }

        try {
            setIsSubmitting(true)

            if (review) {
                await updateReview(review.id, {
                    rating,
                    comment: comment.trim()
                })
            } else {
                await createReview(productId, {
                    order_item: orderItemId,
                    rating,
                    comment: comment.trim()
                })
            }

            Alert.alert(
                "Thành công",
                review
                    ? "Đã cập nhật đánh giá."
                    : "Cảm ơn bạn đã đánh giá sản phẩm.",
                [
                    {
                        text: "OK",
                        onPress: () => navigation.goBack()
                    }
                ]
            )
        } catch {
            Alert.alert(
                "Không thể gửi đánh giá",
                "Vui lòng kiểm tra lại và thử lại."
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <View style={consumerStyles.screen}>
            <ScrollView
                contentContainerStyle={consumerStyles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <Surface elevation={1} style={styles.productCard}>
                    <View style={styles.productIcon}>
                        <MaterialCommunityIcons
                            name="sprout-outline"
                            size={30}
                            color={consumerColors.primary}
                        />
                    </View>

                    <View style={styles.productInfo}>
                        <Text style={consumerStyles.secondaryText}>
                            Đánh giá sản phẩm
                        </Text>

                        <Text
                            variant="titleLarge"
                            style={consumerStyles.bold}
                            numberOfLines={2}
                        >
                            {productName}
                        </Text>
                    </View>
                </Surface>

                <Surface elevation={1} style={consumerStyles.section}>
                    <Text
                        variant="titleMedium"
                        style={consumerStyles.bold}
                    >
                        Bạn cảm thấy sản phẩm thế nào?
                    </Text>

                    <Text style={consumerStyles.secondaryText}>
                        Chọn số sao phù hợp với trải nghiệm của bạn.
                    </Text>

                    <View style={styles.stars}>
                        {[1, 2, 3, 4, 5].map(value => (
                            <Pressable
                                key={value}
                                hitSlop={8}
                                onPress={() => setRating(value)}
                            >
                                <MaterialCommunityIcons
                                    name={
                                        value <= rating
                                            ? "star"
                                            : "star-outline"
                                    }
                                    size={44}
                                    color={
                                        value <= rating
                                            ? "#F5A623"
                                            : consumerColors.border
                                    }
                                />
                            </Pressable>
                        ))}
                    </View>

                    <Text
                        variant="titleMedium"
                        style={styles.ratingText}
                    >
                        {getRatingText(rating)}
                    </Text>
                </Surface>

                <Surface elevation={1} style={consumerStyles.section}>
                    <Text
                        variant="titleMedium"
                        style={consumerStyles.bold}
                    >
                        Nhận xét
                    </Text>

                    <Text style={consumerStyles.secondaryText}>
                        Nội dung nhận xét không bắt buộc.
                    </Text>

                    <TextInput
                        mode="outlined"
                        placeholder="Chia sẻ cảm nhận về sản phẩm..."
                        value={comment}
                        onChangeText={setComment}
                        multiline
                        numberOfLines={5}
                        maxLength={1000}
                        activeOutlineColor={consumerColors.primary}
                        style={consumerStyles.input}
                    />

                    <Text style={styles.counter}>
                        {comment.length}/1000
                    </Text>
                </Surface>
            </ScrollView>

            <SafeAreaView edges={["bottom"]}>
                <Surface elevation={4} style={styles.bottom}>
                    <Button
                        mode="contained"
                        icon={
                            review
                                ? "content-save-outline"
                                : "star-check-outline"
                        }
                        buttonColor={consumerColors.primary}
                        loading={isSubmitting}
                        disabled={isSubmitting}
                        contentStyle={consumerStyles.buttonContent}
                        onPress={handleSubmit}
                    >
                        {review
                            ? "Cập nhật đánh giá"
                            : "Gửi đánh giá"}
                    </Button>
                </Surface>
            </SafeAreaView>
        </View>
    )
}

function getRatingText(rating: number) {
    const labels: Record<number, string> = {
        1: "Rất không hài lòng",
        2: "Không hài lòng",
        3: "Bình thường",
        4: "Hài lòng",
        5: "Rất hài lòng"
    }

    return labels[rating]
}

const styles = StyleSheet.create({
    productCard: {
        borderRadius: 18,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 13,
        backgroundColor: consumerColors.surface
    },
    productIcon: {
        width: 58,
        height: 58,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: consumerColors.primarySoft
    },
    productInfo: {
        flex: 1,
        gap: 3
    },
    stars: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 7,
        paddingVertical: 10
    },
    ratingText: {
        color: consumerColors.primary,
        textAlign: "center",
        fontWeight: "700"
    },
    counter: {
        color: consumerColors.textSecondary,
        textAlign: "right"
    },
    bottom: {
        padding: 16,
        backgroundColor: consumerColors.surface
    }
})