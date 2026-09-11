import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import axios from "axios"
import * as ImagePicker from "expo-image-picker"
import { useEffect, useState } from "react"
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import {
    ActivityIndicator,
    Button,
    Menu,
    Surface,
    Text,
    TextInput
} from "react-native-paper"

import type { KocStackParamList } from "../../navigation/koc/KocNavigator"
import { getAffiliateLinks } from "../../services/api/affiliateService"
import {
    createPromotionPost,
    deletePromotionPostMedia,
    getPromotionPostDetail,
    updatePromotionPost,
    uploadPromotionPostMedia
} from "../../services/api/promotionPostService"
import type { AffiliateLink } from "../../types/affiliate"
import type {
    PromotionMediaFile,
    PromotionPostMedia,
    PromotionPostMediaType,
    PromotionPostStatus
} from "../../types/promotionPost"
import {
    kocColors,
    kocStyles
} from "./kocStyles"

type Props = NativeStackScreenProps<
    KocStackParamList,
    "PromotionPostForm"
>

export default function PromotionPostFormScreen({
    route,
    navigation
}: Props) {
    const postId = route.params?.postId
    const initialAffiliateLinkId =
        route.params?.affiliateLinkId

    const isEditing = postId !== undefined

    const isAffiliateLocked =
        isEditing
        || initialAffiliateLinkId !== undefined

    const [affiliateLinks, setAffiliateLinks] =
        useState<AffiliateLink[]>([])

    const [affiliateLinkId, setAffiliateLinkId] =
        useState<number | null>(null)

    const [content, setContent] = useState("")

    const [currentStatus, setCurrentStatus] =
        useState<PromotionPostStatus>("DRAFT")

    const [existingMedia, setExistingMedia] =
        useState<PromotionPostMedia[]>([])

    const [selectedMedia, setSelectedMedia] =
        useState<PromotionMediaFile[]>([])

    const [menuVisible, setMenuVisible] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    const [deletingMediaId, setDeletingMediaId] =
        useState<number | null>(null)

    const [error, setError] = useState("")

    useEffect(() => {
        loadData()
    }, [postId, initialAffiliateLinkId])

    const loadData = async () => {
        try {
            setIsLoading(true)
            setError("")

            const links = await getAffiliateLinks()
            setAffiliateLinks(links)

            if (postId !== undefined) {
                const post =
                    await getPromotionPostDetail(postId)

                setAffiliateLinkId(post.affiliate_link)
                setContent(post.content)
                setCurrentStatus(post.status)
                setExistingMedia(post.media ?? [])
                return
            }

            if (initialAffiliateLinkId !== undefined) {
                const selectedLink = links.find(
                    link => link.id === initialAffiliateLinkId
                )

                if (!selectedLink) {
                    setAffiliateLinkId(null)
                    setError(
                        "Không tìm thấy liên kết quảng bá của sản phẩm này."
                    )
                    return
                }

                setAffiliateLinkId(selectedLink.id)
                return
            }

            if (links.length === 1) {
                setAffiliateLinkId(links[0].id)
            }
        } catch {
            setError("Không thể tải dữ liệu bài viết.")
        } finally {
            setIsLoading(false)
        }
    }

    const selectedAffiliateLink = affiliateLinks.find(
        item => item.id === affiliateLinkId
    )

    const currentMediaType = ():
        PromotionPostMediaType | null => {
        const hasVideo =
            existingMedia.some(
                item => item.media_type === "VIDEO"
            )
            || selectedMedia.some(
                item => item.mediaType === "VIDEO"
            )

        if (hasVideo) return "VIDEO"

        const hasImage =
            existingMedia.some(
                item => item.media_type === "IMAGE"
            )
            || selectedMedia.some(
                item => item.mediaType === "IMAGE"
            )

        return hasImage ? "IMAGE" : null
    }

    const getImageCount = () => {
        const existingImages = existingMedia.filter(
            item => item.media_type === "IMAGE"
        ).length

        const newImages = selectedMedia.filter(
            item => item.mediaType === "IMAGE"
        ).length

        return existingImages + newImages
    }

    const pickMedia = async () => {
        const currentType = currentMediaType()

        if (currentType === "VIDEO") {
            Alert.alert(
                "Bài đã có video",
                "Mỗi bài quảng bá chỉ được sử dụng 1 video."
            )
            return
        }

        if (
            currentType === "IMAGE"
            && getImageCount() >= 5
        ) {
            Alert.alert(
                "Đã đủ hình ảnh",
                "Mỗi bài quảng bá chỉ được tối đa 5 hình ảnh."
            )
            return
        }

        const permission =
            await ImagePicker.requestMediaLibraryPermissionsAsync()

        if (!permission.granted) {
            Alert.alert(
                "Cần quyền truy cập",
                "AgriConnect cần quyền truy cập thư viện để chọn hình ảnh hoặc video."
            )
            return
        }

        const result =
            await ImagePicker.launchImageLibraryAsync({
                mediaTypes:
                    currentType === "IMAGE"
                        ? ["images"]
                        : ["images", "videos"],
                allowsEditing: false,
                quality: 0.9
            })

        if (result.canceled) return

        const asset = result.assets[0]

        const mediaType: PromotionPostMediaType =
            asset.type === "video"
                ? "VIDEO"
                : "IMAGE"

        if (
            mediaType === "VIDEO"
            && (
                existingMedia.length > 0
                || selectedMedia.length > 0
            )
        ) {
            Alert.alert(
                "Không thể thêm video",
                "Bài có video không được chứa hình ảnh hoặc video khác."
            )
            return
        }

        if (
            mediaType === "IMAGE"
            && getImageCount() >= 5
        ) {
            Alert.alert(
                "Đã đủ hình ảnh",
                "Mỗi bài quảng bá chỉ được tối đa 5 hình ảnh."
            )
            return
        }

        const mimeType =
            asset.mimeType
            ?? getFallbackMimeType(
                asset.fileName,
                mediaType
            )

        const fileName =
            asset.fileName
            ?? createMediaFileName(
                mediaType,
                mimeType
            )

        setSelectedMedia(current => [
            ...current,
            {
                uri: asset.uri,
                name: fileName,
                type: mimeType,
                mediaType
            }
        ])
    }

    const removeSelectedMedia = (index: number) => {
        setSelectedMedia(current =>
            current.filter(
                (_, itemIndex) => itemIndex !== index
            )
        )
    }

    const confirmDeleteExistingMedia = (
        media: PromotionPostMedia
    ) => {
        if (postId === undefined) return

        Alert.alert(
            "Xóa nội dung?",
            media.media_type === "VIDEO"
                ? "Video này sẽ bị xóa khỏi bài quảng bá."
                : "Hình ảnh này sẽ bị xóa khỏi bài quảng bá.",
            [
                {
                    text: "Hủy",
                    style: "cancel"
                },
                {
                    text: "Xóa",
                    style: "destructive",
                    onPress: () =>
                        removeExistingMedia(media)
                }
            ]
        )
    }

    const removeExistingMedia = async (
        media: PromotionPostMedia
    ) => {
        if (postId === undefined) return

        try {
            setDeletingMediaId(media.id)

            await deletePromotionPostMedia(
                postId,
                media.id
            )

            setExistingMedia(current =>
                current.filter(
                    item => item.id !== media.id
                )
            )
        } catch {
            Alert.alert(
                "Không thể xóa",
                "Không thể xóa hình ảnh hoặc video. Vui lòng thử lại."
            )
        } finally {
            setDeletingMediaId(null)
        }
    }

    const validate = () => {
        if (!affiliateLinkId) {
            Alert.alert(
                "Chưa chọn sản phẩm",
                "Hãy chọn sản phẩm bạn muốn quảng bá."
            )
            return false
        }

        if (!content.trim()) {
            Alert.alert(
                "Chưa có nội dung",
                "Hãy nhập nội dung cho bài quảng bá."
            )
            return false
        }

        return true
    }

    const uploadSelectedMedia = async (
        targetPostId: number
    ) => {
        if (selectedMedia.length === 0) return

        let nextDisplayOrder = 0

        if (existingMedia.length > 0) {
            nextDisplayOrder =
                Math.max(
                    ...existingMedia.map(
                        item => item.display_order
                    )
                ) + 1
        }

        for (
            let index = 0;
            index < selectedMedia.length;
            index++
        ) {
            await uploadPromotionPostMedia(
                targetPostId,
                selectedMedia[index],
                nextDisplayOrder + index
            )
        }
    }

    const savePost = async (
        targetStatus: PromotionPostStatus
    ) => {
        if (!validate()) return

        try {
            setIsSaving(true)

            if (postId !== undefined) {
                await uploadSelectedMedia(postId)

                await updatePromotionPost(postId, {
                    content: content.trim(),
                    status: targetStatus
                })
            } else {
                const createdPost =
                    await createPromotionPost({
                        affiliate_link: affiliateLinkId!,
                        content: content.trim(),
                        status: "DRAFT"
                    })

                await uploadSelectedMedia(createdPost.id)

                if (targetStatus === "PUBLISHED") {
                    await updatePromotionPost(
                        createdPost.id,
                        {
                            status: "PUBLISHED"
                        }
                    )
                }
            }

            Alert.alert(
                targetStatus === "PUBLISHED"
                    ? "Đăng bài thành công"
                    : "Đã lưu bản nháp",
                targetStatus === "PUBLISHED"
                    ? "Bài quảng bá đã được đăng trên AgriConnect."
                    : "Bài quảng bá đã được lưu vào bản nháp.",
                [
                    {
                        text: "OK",
                        onPress: () => navigation.goBack()
                    }
                ]
            )
        } catch (requestError) {
            Alert.alert(
                "Không thể lưu bài viết",
                getApiErrorMessage(requestError)
                    ?? "Vui lòng kiểm tra lại và thử lại."
            )
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <View style={kocStyles.center}>
                <ActivityIndicator
                    size="large"
                    color={kocColors.primary}
                />

                <Text>Đang tải...</Text>
            </View>
        )
    }

    return (
        <SafeAreaView
            style={kocStyles.screen}
            edges={["bottom"]}
        >
            <KeyboardAvoidingView
                style={kocStyles.screen}
                behavior={
                    Platform.OS === "ios"
                        ? "padding"
                        : undefined
                }
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View>
                        <Text
                            variant="headlineSmall"
                            style={kocStyles.title}
                        >
                            {isEditing
                                ? "Chỉnh sửa bài"
                                : "Tạo bài quảng bá"}
                        </Text>

                        <Text style={styles.subtitle}>
                            Chia sẻ nội dung, hình ảnh hoặc video để giới thiệu nông sản.
                        </Text>
                    </View>

                    {!!error && (
                        <Surface
                            elevation={0}
                            style={kocStyles.errorCard}
                        >
                            <MaterialCommunityIcons
                                name="alert-circle-outline"
                                size={21}
                                color={kocColors.danger}
                            />

                            <Text style={styles.errorText}>
                                {error}
                            </Text>
                        </Surface>
                    )}

                    <View style={styles.section}>
                        <Text
                            variant="titleMedium"
                            style={kocStyles.bold}
                        >
                            Sản phẩm quảng bá
                        </Text>

                        {affiliateLinks.length === 0 ? (
                            <Surface
                                elevation={0}
                                style={styles.emptyLink}
                            >
                                <MaterialCommunityIcons
                                    name="link-off"
                                    size={30}
                                    color={kocColors.textSecondary}
                                />

                                <Text style={kocStyles.centerText}>
                                    Bạn chưa có sản phẩm nào đang quảng bá.
                                </Text>

                                <Text style={kocStyles.centerText}>
                                    Hãy vào mục Quảng bá để chọn sản phẩm trước.
                                </Text>
                            </Surface>
                        ) : (
                            <Menu
                                visible={menuVisible}
                                onDismiss={() =>
                                    setMenuVisible(false)
                                }
                                anchor={
                                    <Button
                                        mode="outlined"
                                        icon="sprout-outline"
                                        disabled={isAffiliateLocked}
                                        contentStyle={styles.selectorContent}
                                        onPress={() =>
                                            setMenuVisible(true)
                                        }
                                    >
                                        {selectedAffiliateLink
                                            ?.product_name
                                            ?? "Chọn sản phẩm"}
                                    </Button>
                                }
                            >
                                {affiliateLinks.map(link => (
                                    <Menu.Item
                                        key={link.id}
                                        title={link.product_name}
                                        onPress={() => {
                                            setAffiliateLinkId(link.id)
                                            setMenuVisible(false)
                                        }}
                                    />
                                ))}
                            </Menu>
                        )}

                        {isEditing && (
                            <Text style={kocStyles.secondaryText}>
                                Không thể đổi sản phẩm của bài quảng bá đã tạo.
                            </Text>
                        )}

                        {!isEditing
                            && initialAffiliateLinkId !== undefined
                            && selectedAffiliateLink
                            && (
                                <View style={styles.selectedProduct}>
                                    <MaterialCommunityIcons
                                        name="check-circle-outline"
                                        size={20}
                                        color={kocColors.primary}
                                    />

                                    <Text style={styles.selectedProductText}>
                                        Đang tạo bài cho{" "}
                                        <Text style={kocStyles.bold}>
                                            {selectedAffiliateLink.product_name}
                                        </Text>
                                    </Text>
                                </View>
                            )}
                    </View>

                    <Surface elevation={0} style={styles.editorCard}>
                        <View style={styles.editorHeader}>
                            <View style={styles.avatar}>
                                <MaterialCommunityIcons
                                    name="account-star-outline"
                                    size={24}
                                    color={kocColors.primary}
                                />
                            </View>

                            <View style={styles.flex}>
                                <Text
                                    variant="titleSmall"
                                    style={kocStyles.bold}
                                >
                                    Nội dung quảng bá
                                </Text>

                                {!!selectedAffiliateLink && (
                                    <Text style={kocStyles.secondaryText}>
                                        {selectedAffiliateLink.product_name}
                                    </Text>
                                )}
                            </View>
                        </View>

                        <TextInput
                            mode="outlined"
                            placeholder="Ví dụ: Xoài vừa thu hoạch, thơm ngọt tự nhiên..."
                            value={content}
                            multiline
                            numberOfLines={7}
                            maxLength={2000}
                            activeOutlineColor={kocColors.primary}
                            onChangeText={setContent}
                            style={styles.contentInput}
                        />

                        <Text style={styles.characterCount}>
                            {content.length}/2000
                        </Text>
                    </Surface>

                    <View style={styles.section}>
                        <View style={styles.mediaHeader}>
                            <View style={styles.flex}>
                                <Text
                                    variant="titleMedium"
                                    style={kocStyles.bold}
                                >
                                    Hình ảnh / Video
                                </Text>

                                <Text style={kocStyles.secondaryText}>
                                    Tối đa 5 hình ảnh hoặc 1 video
                                </Text>
                            </View>

                            <Button
                                mode="outlined"
                                compact
                                icon="plus"
                                disabled={
                                    currentMediaType() === "VIDEO"
                                    || getImageCount() >= 5
                                }
                                onPress={pickMedia}
                            >
                                Thêm
                            </Button>
                        </View>

                        {existingMedia.length === 0
                            && selectedMedia.length === 0 ? (
                            <Pressable onPress={pickMedia}>
                                <Surface
                                    elevation={0}
                                    style={styles.mediaEmpty}
                                >
                                    <MaterialCommunityIcons
                                        name="image-multiple-outline"
                                        size={42}
                                        color={kocColors.primary}
                                    />

                                    <Text
                                        variant="titleSmall"
                                        style={kocStyles.bold}
                                    >
                                        Thêm hình ảnh hoặc video
                                    </Text>

                                    <Text style={kocStyles.secondaryText}>
                                        Chạm để chọn từ thư viện
                                    </Text>
                                </Surface>
                            </Pressable>
                        ) : (
                            <View style={styles.mediaGrid}>
                                {existingMedia.map(media => (
                                    <MediaItem
                                        key={`existing-${media.id}`}
                                        uri={media.file}
                                        type={media.media_type}
                                        loading={
                                            deletingMediaId === media.id
                                        }
                                        onRemove={() =>
                                            confirmDeleteExistingMedia(
                                                media
                                            )
                                        }
                                    />
                                ))}

                                {selectedMedia.map((media, index) => (
                                    <MediaItem
                                        key={`${media.uri}-${index}`}
                                        uri={media.uri}
                                        type={media.mediaType}
                                        onRemove={() =>
                                            removeSelectedMedia(index)
                                        }
                                    />
                                ))}
                            </View>
                        )}
                    </View>

                    {isEditing && (
                        <View style={styles.currentStatus}>
                            <MaterialCommunityIcons
                                name="information-outline"
                                size={21}
                                color={kocColors.primary}
                            />

                            <Text>
                                Trạng thái hiện tại:{" "}
                                <Text style={kocStyles.bold}>
                                    {getStatusText(currentStatus)}
                                </Text>
                            </Text>
                        </View>
                    )}

                    <View style={styles.actions}>
                        <Button
                            mode="outlined"
                            icon="content-save-outline"
                            disabled={
                                isSaving || !affiliateLinkId
                            }
                            style={styles.actionButton}
                            contentStyle={kocStyles.buttonContent}
                            onPress={() => savePost("DRAFT")}
                        >
                            Lưu nháp
                        </Button>

                        <Button
                            mode="contained"
                            icon="send-outline"
                            buttonColor={kocColors.primary}
                            loading={isSaving}
                            disabled={
                                isSaving || !affiliateLinkId
                            }
                            style={styles.actionButton}
                            contentStyle={kocStyles.buttonContent}
                            onPress={() =>
                                savePost("PUBLISHED")
                            }
                        >
                            Đăng bài
                        </Button>
                    </View>

                    <View style={styles.noteCard}>
                        <MaterialCommunityIcons
                            name="information-outline"
                            size={20}
                            color={kocColors.textSecondary}
                        />

                        <Text style={styles.noteText}>
                            Người mua có thể xem bài quảng bá trên AgriConnect.
                            Mã quảng bá được dùng để ghi nhận nguồn KOC khi phát
                            sinh đơn hàng.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

function MediaItem({
    uri,
    type,
    loading = false,
    onRemove
}: {
    uri: string
    type: PromotionPostMediaType
    loading?: boolean
    onRemove: () => void
}) {
    return (
        <View style={styles.mediaItem}>
            {type === "IMAGE" ? (
                <Image
                    source={{ uri }}
                    style={styles.mediaImage}
                    resizeMode="cover"
                />
            ) : (
                <View style={styles.videoPreview}>
                    <MaterialCommunityIcons
                        name="play-circle"
                        size={44}
                        color="#FFFFFF"
                    />

                    <Text style={styles.videoText}>
                        Video
                    </Text>
                </View>
            )}

            <Pressable
                style={styles.removeMedia}
                disabled={loading}
                onPress={onRemove}
            >
                {loading ? (
                    <ActivityIndicator
                        size={16}
                        color="#FFFFFF"
                    />
                ) : (
                    <MaterialCommunityIcons
                        name="close"
                        size={17}
                        color="#FFFFFF"
                    />
                )}
            </Pressable>
        </View>
    )
}

function getFallbackMimeType(
    fileName: string | null | undefined,
    mediaType: PromotionPostMediaType
) {
    const name = fileName?.toLowerCase() ?? ""

    if (name.endsWith(".png")) return "image/png"
    if (name.endsWith(".webp")) return "image/webp"
    if (name.endsWith(".gif")) return "image/gif"
    if (name.endsWith(".mov")) return "video/quicktime"
    if (name.endsWith(".webm")) return "video/webm"

    return mediaType === "VIDEO"
        ? "video/mp4"
        : "image/jpeg"
}

function createMediaFileName(
    mediaType: PromotionPostMediaType,
    mimeType: string
) {
    if (mediaType === "VIDEO") {
        let extension = "mp4"

        if (mimeType.includes("quicktime")) {
            extension = "mov"
        } else if (mimeType.includes("webm")) {
            extension = "webm"
        }

        return `promotion-${Date.now()}.${extension}`
    }

    let extension = "jpg"

    if (mimeType.includes("png")) {
        extension = "png"
    } else if (mimeType.includes("webp")) {
        extension = "webp"
    } else if (mimeType.includes("gif")) {
        extension = "gif"
    }

    return `promotion-${Date.now()}.${extension}`
}

function getStatusText(status: PromotionPostStatus) {
    if (status === "PUBLISHED") return "Đã đăng"
    if (status === "HIDDEN") return "Đã ẩn"

    return "Bản nháp"
}

function getApiErrorMessage(error: unknown) {
    if (!axios.isAxiosError(error)) return null

    const data = error.response?.data

    if (typeof data === "string") return data

    if (!data || typeof data !== "object") {
        return null
    }

    const response =
        data as Record<string, unknown>

    if (typeof response.detail === "string") {
        return response.detail
    }

    const fields = [
        "file",
        "affiliate_link",
        "content",
        "status",
        "non_field_errors"
    ]

    for (const field of fields) {
        const value = response[field]

        if (Array.isArray(value)) {
            return value.map(String).join("\n")
        }

        if (typeof value === "string") {
            return value
        }
    }

    return null
}

const styles = StyleSheet.create({
    flex: {
        flex: 1
    },
    content: {
        padding: 18,
        paddingBottom: 36,
        gap: 20
    },
    subtitle: {
        color: kocColors.textSecondary,
        marginTop: 5
    },
    errorText: {
        flex: 1,
        color: kocColors.danger
    },
    section: {
        gap: 9
    },
    selectorContent: {
        minHeight: 50,
        justifyContent: "flex-start"
    },
    emptyLink: {
        padding: 20,
        borderRadius: 18,
        alignItems: "center",
        gap: 8,
        backgroundColor: kocColors.primarySoft
    },
    selectedProduct: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        borderRadius: 14,
        padding: 12,
        backgroundColor: kocColors.primarySoft
    },
    selectedProductText: {
        flex: 1,
        color: kocColors.primaryDark
    },
    editorCard: {
        borderRadius: 20,
        padding: 15,
        gap: 13,
        backgroundColor: kocColors.surface
    },
    editorHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10
    },
    avatar: {
        width: 46,
        height: 46,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: kocColors.primarySoft
    },
    contentInput: {
        minHeight: 170,
        backgroundColor: kocColors.surface
    },
    characterCount: {
        color: kocColors.textSecondary,
        textAlign: "right"
    },
    mediaHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10
    },
    mediaEmpty: {
        minHeight: 145,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        backgroundColor: kocColors.primarySoft
    },
    mediaGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8
    },
    mediaItem: {
        width: "31.5%",
        aspectRatio: 1,
        borderRadius: 14,
        overflow: "hidden",
        position: "relative"
    },
    mediaImage: {
        width: "100%",
        height: "100%"
    },
    videoPreview: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        backgroundColor: "#242424"
    },
    videoText: {
        color: "#FFFFFF"
    },
    removeMedia: {
        position: "absolute",
        top: 5,
        right: 5,
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.65)"
    },
    currentStatus: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        padding: 13,
        borderRadius: 15,
        backgroundColor: kocColors.primarySoft
    },
    actions: {
        flexDirection: "row",
        gap: 10
    },
    actionButton: {
        flex: 1,
        borderRadius: 14
    },
    noteCard: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
        padding: 13,
        borderRadius: 15,
        backgroundColor: kocColors.surface
    },
    noteText: {
        flex: 1,
        color: kocColors.textSecondary,
        lineHeight: 18
    }
})