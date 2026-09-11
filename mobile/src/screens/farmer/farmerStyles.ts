import { StyleSheet } from "react-native"

export const farmerColors = {
    primary: "#2F6B3B",
    primaryDark: "#24552E",
    primarySoft: "#E7F1E5",
    background: "#F7F8F4",
    surface: "#FFFFFF",
    text: "#20251F",
    textSecondary: "#70766D",
    border: "#E2E6DE",
    warning: "#BE7A20",
    warningSoft: "#FFF2D9",
    danger: "#C94A45",
    dangerSoft: "#FCE8E6",
    hidden: "#667085",
    hiddenSoft: "#EEF0F2"
}

export const farmerStyles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: farmerColors.background
    },
    content: {
        padding: 16,
        paddingBottom: 36
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        gap: 12
    },
    centerText: {
        textAlign: "center",
        color: farmerColors.textSecondary
    },
    pressed: {
        opacity: 0.75
    },
    bold: {
        fontWeight: "700"
    },
    title: {
        fontWeight: "800",
        color: farmerColors.text
    },

    homeContent: {
        padding: 16,
        paddingBottom: 36
    },
    homeHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20
    },
    homeHeaderText: {
        flex: 1
    },
    homeBrand: {
        color: farmerColors.primary,
        fontWeight: "700",
        marginBottom: 2
    },
    homeGreeting: {
        color: farmerColors.text,
        fontWeight: "800"
    },
    homeSubtitle: {
        color: farmerColors.textSecondary,
        marginTop: 3
    },
    homeAvatar: {
        width: 52,
        height: 52,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: farmerColors.primarySoft
    },
    homeHero: {
        minHeight: 176,
        padding: 20,
        borderRadius: 22,
        flexDirection: "row",
        alignItems: "center",
        overflow: "hidden",
        backgroundColor: farmerColors.primarySoft
    },
    homeHeroContent: {
        flex: 1
    },
    homeHeroTitle: {
        color: farmerColors.primaryDark,
        fontWeight: "800"
    },
    homeHeroDescription: {
        color: "#46634C",
        lineHeight: 20,
        marginTop: 7
    },
    homeHeroButton: {
        alignSelf: "flex-start",
        borderRadius: 12,
        marginTop: 16
    },
    homeHeroButtonContent: {
        minHeight: 46
    },
    homeHeroIcon: {
        width: 78,
        height: 78,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: farmerColors.surface,
        marginLeft: 10
    },
    homeSection: {
        marginTop: 24,
        marginBottom: 12
    },
    homeSectionTitle: {
        color: farmerColors.text,
        fontWeight: "800"
    },
    homeQuickGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10
    },
    homeProcess: {
        padding: 16,
        borderRadius: 18,
        gap: 16,
        backgroundColor: farmerColors.surface
    },
    homeProcessRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12
    },
    homeProcessNumber: {
        width: 34,
        height: 34,
        borderRadius: 11,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: farmerColors.primary
    },
    homeProcessText: {
        flex: 1
    },

    productListAddButton: {
        marginHorizontal: 16,
        marginTop: 4,
        marginBottom: 12,
        borderRadius: 12
    },
    productListAddButtonContent: {
        minHeight: 48
    },
    productListCount: {
        paddingHorizontal: 16,
        paddingBottom: 8
    },
    productListContent: {
        paddingHorizontal: 16,
        paddingBottom: 28,
        gap: 12
    },
    productListCard: {
        borderRadius: 18,
        overflow: "hidden",
        backgroundColor: farmerColors.surface
    },
    productListMain: {
        padding: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 12
    },
    productListImage: {
        width: 92,
        height: 92,
        borderRadius: 14
    },
    productListPlaceholder: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: farmerColors.primarySoft
    },
    productListInfo: {
        flex: 1,
        gap: 5
    },
    productListPrice: {
        color: farmerColors.primary,
        fontWeight: "700"
    },
    productListFooter: {
        minHeight: 48,
        paddingHorizontal: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: farmerColors.border,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    },
    productListEmpty: {
        paddingVertical: 60,
        paddingHorizontal: 28,
        alignItems: "center",
        gap: 12
    },
    productListEmptyIcon: {
        width: 100,
        height: 100,
        borderRadius: 30,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 4,
        backgroundColor: farmerColors.primarySoft
    },

    orderListCount: {
        paddingHorizontal: 16,
        paddingBottom: 8
    },
    orderListContent: {
        paddingHorizontal: 16,
        paddingBottom: 28,
        gap: 12
    },
    orderListCard: {
        padding: 16,
        borderRadius: 18,
        gap: 14,
        backgroundColor: farmerColors.surface
    },
    orderListTop: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    },
    orderListTitleRow: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 10
    },
    orderListTitle: {
        flex: 1,
        gap: 2
    },
    orderListIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: farmerColors.primarySoft
    },
    orderListCustomer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 7
    },
    orderListSummary: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between"
    },
    orderListAmount: {
        alignItems: "flex-end"
    },
    orderListChipRow: {
        flexDirection: "row"
    },
    orderListEmpty: {
        paddingVertical: 70,
        paddingHorizontal: 28,
        alignItems: "center",
        gap: 12
    },
    orderListEmptyIcon: {
        width: 100,
        height: 100,
        borderRadius: 30,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: farmerColors.primarySoft
    },

    profileContent: {
        paddingHorizontal: 16,
        paddingBottom: 36
    },
    profileHeaderCard: {
        alignItems: "center",
        padding: 20,
        borderRadius: 20,
        backgroundColor: farmerColors.surface,
        marginBottom: 16
    },
    profileAvatar: {
        width: 88,
        height: 88,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: farmerColors.primarySoft,
        overflow: "hidden"
    },
    profileAvatarImage: {
        width: "100%",
        height: "100%"
    },
    profileName: {
        color: farmerColors.text,
        fontWeight: "800",
        marginTop: 12
    },
    profileUsername: {
        color: farmerColors.textSecondary,
        marginTop: 2
    },
    profileStatus: {
        marginTop: 10,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        flexDirection: "row",
        alignItems: "center",
        gap: 5
    },
    profileSectionTitle: {
        color: farmerColors.text,
        fontWeight: "800",
        marginTop: 8,
        marginBottom: 10
    },
    profileCard: {
        borderRadius: 18,
        backgroundColor: farmerColors.surface,
        overflow: "hidden",
        marginBottom: 16
    },
    profileRow: {
        minHeight: 72,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 12
    },
    profileRowIcon: {
        width: 42,
        height: 42,
        borderRadius: 13,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: farmerColors.primarySoft
    },
    profileRowText: {
        flex: 1,
        gap: 2
    },
    profileEditButton: {
        borderRadius: 12,
        marginBottom: 12
    },
    profileButtonContent: {
        minHeight: 48
    },
    profileLogout: {
        borderRadius: 12,
        borderColor: farmerColors.danger
    },

    editContent: {
        padding: 16,
        paddingBottom: 40
    },
    editSection: {
        marginBottom: 22
    },
    editSectionTitle: {
        color: farmerColors.text,
        fontWeight: "800",
        marginBottom: 12
    },
    editFields: {
        gap: 12
    },
    editInput: {
        backgroundColor: farmerColors.surface
    },
    editReadonly: {
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: farmerColors.border,
        backgroundColor: "#F1F3EF"
    },
    editReadonlyLabel: {
        color: farmerColors.textSecondary,
        marginBottom: 3
    },
    editSaveButton: {
        borderRadius: 12,
        marginTop: 6
    },
    editSaveContent: {
        minHeight: 50
    },

    notificationToolbar: {
        paddingHorizontal: 16,
        paddingBottom: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },
    notificationList: {
        paddingHorizontal: 16,
        paddingBottom: 30,
        gap: 10
    },
    notificationCard: {
        padding: 14,
        borderRadius: 16,
        flexDirection: "row",
        gap: 12,
        backgroundColor: farmerColors.surface
    },
    notificationUnread: {
        backgroundColor: "#F0F7EE"
    },
    notificationIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: farmerColors.primarySoft
    },
    notificationContent: {
        flex: 1
    },
    notificationTitle: {
        color: farmerColors.text,
        fontWeight: "700"
    },
    notificationMessage: {
        color: farmerColors.textSecondary,
        lineHeight: 19,
        marginTop: 3
    },
    notificationDate: {
        color: farmerColors.textSecondary,
        marginTop: 7
    },
    notificationDot: {
        width: 9,
        height: 9,
        borderRadius: 5,
        backgroundColor: farmerColors.primary,
        marginTop: 5
    },
    notificationEmpty: {
        paddingVertical: 80,
        paddingHorizontal: 30,
        alignItems: "center",
        gap: 12
    },
        productListActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2
    },

    formContent: {
        padding: 16,
        paddingBottom: 36,
        gap: 16
    },
    formSection: {
        padding: 16,
        borderRadius: 18,
        gap: 14,
        backgroundColor: farmerColors.surface
    },
    formTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8
    },
    formTitleText: {
        flex: 1
    },
    formInput: {
        backgroundColor: farmerColors.surface
    },
    formSelectButton: {
        minHeight: 50,
        justifyContent: "flex-start"
    },
    formOutlineButton: {
        borderColor: farmerColors.border
    },
    formSubmitButton: {
        minHeight: 50
    },
    formErrorBox: {
        padding: 12,
        borderRadius: 14,
        flexDirection: "row",
        gap: 8,
        backgroundColor: farmerColors.dangerSoft
    },
    formErrorText: {
        flex: 1,
        color: farmerColors.danger
    },
    formInfoBox: {
        padding: 12,
        borderRadius: 14,
        flexDirection: "row",
        gap: 8,
        backgroundColor: farmerColors.primarySoft
    },
    formInfoText: {
        flex: 1,
        lineHeight: 20,
        color: farmerColors.primaryDark
    },

    imagesContent: {
        padding: 16,
        paddingBottom: 8,
        gap: 14
    },
    imagesGuide: {
        borderRadius: 18,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: farmerColors.primarySoft
    },
    imagesGuideText: {
        flex: 1,
        gap: 3
    },
    imagesAddButton: {
        minHeight: 50
    },
    imagesErrorBox: {
        padding: 12,
        borderRadius: 14,
        flexDirection: "row",
        gap: 8,
        backgroundColor: farmerColors.dangerSoft
    },
    imagesErrorText: {
        flex: 1,
        color: farmerColors.danger
    },
    imagesListHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    },
    imagesList: {
        paddingHorizontal: 16,
        paddingBottom: 100,
        flexGrow: 1
    },
    imagesRow: {
        gap: 12,
        marginBottom: 12
    },
    imagesCard: {
        flex: 1,
        borderRadius: 18,
        overflow: "hidden",
        maxWidth: "48.5%",
        backgroundColor: farmerColors.surface
    },
    imagesImage: {
        width: "100%",
        aspectRatio: 1
    },
    imagesImageFallback: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: farmerColors.primarySoft
    },
    imagesDeleteButton: {
        position: "absolute",
        top: 4,
        right: 4
    },
    imagesInfo: {
        padding: 10,
        gap: 5
    },
    imagesTitle: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 4
    },
    imagesQualityRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5
    },
    imagesEmpty: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 70,
        paddingHorizontal: 32
    },
    imagesEmptyIcon: {
        width: 104,
        height: 104,
        borderRadius: 34,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 18,
        backgroundColor: farmerColors.primarySoft
    },
    imagesEmptyText: {
        textAlign: "center",
        marginTop: 5,
        color: farmerColors.textSecondary
    },
    imagesBottom: {
        position: "absolute",
        left: 16,
        right: 16,
        bottom: 14
    },

    analyzeContent: {
        padding: 16,
        paddingBottom: 32,
        gap: 16
    },
    analyzeGuide: {
        padding: 16,
        borderRadius: 18,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: farmerColors.primarySoft
    },
    analyzeGuideContent: {
        flex: 1,
        gap: 4
    },
    analyzeImagePicker: {
        borderRadius: 20,
        padding: 24,
        alignItems: "center",
        gap: 12,
        backgroundColor: farmerColors.surface
    },
    analyzeImageIcon: {
        width: 112,
        height: 112,
        borderRadius: 36,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: farmerColors.primarySoft
    },
    analyzeActions: {
        flexDirection: "row",
        gap: 10,
        marginTop: 8
    },
    analyzeActionButton: {
        flex: 1
    },
    analyzePreviewCard: {
        borderRadius: 20,
        overflow: "hidden",
        backgroundColor: farmerColors.surface
    },
    analyzeImage: {
        width: "100%",
        height: 300
    },
    analyzeLoading: {
        padding: 20,
        alignItems: "center",
        gap: 8
    },
    analyzeResultCard: {
        borderRadius: 18,
        padding: 16,
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12
    },
    analyzeResultContent: {
        flex: 1,
        gap: 8
    },
    analyzeSuccessCard: {
        borderRadius: 18,
        padding: 16,
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        backgroundColor: farmerColors.primarySoft
    },
    analyzeErrorCard: {
        backgroundColor: farmerColors.dangerSoft
    },
    analyzeInstructions: {
        gap: 6,
        marginTop: 4
    },
    analyzeInstructionRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 7
    },
    analyzeInstructionText: {
        flex: 1
    },
    analyzeRetryActions: {
        flexDirection: "row",
        gap: 10
    },
    analyzeContinueButton: {
        minHeight: 50
    },
        imagesPrimaryLabel: {
        color: farmerColors.primary,
        fontWeight: "700"
    },

    detailContent: {
        padding: 16,
        paddingBottom: 36,
        gap: 16
    },
    detailMainImage: {
        width: "100%",
        height: 240,
        borderRadius: 22
    },
    detailImagePlaceholder: {
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: farmerColors.primarySoft
    },
    detailSection: {
        padding: 16,
        borderRadius: 18,
        gap: 14,
        backgroundColor: farmerColors.surface
    },
    detailProductTop: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12
    },
    detailProductName: {
        flex: 1,
        gap: 3
    },
    detailPrice: {
        color: farmerColors.primary,
        fontWeight: "700"
    },
    detailTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8
    },
    detailInfoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 16
    },
    detailInfoValue: {
        flex: 1,
        textAlign: "right",
        color: farmerColors.text,
        fontWeight: "700"
    },
    detailRejection: {
        padding: 14,
        borderRadius: 16,
        flexDirection: "row",
        gap: 9,
        backgroundColor: farmerColors.dangerSoft
    },
    detailRejectionInfo: {
        flex: 1,
        gap: 3
    },
    detailImageSummary: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12
    },
    detailImageSummaryIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: farmerColors.primarySoft
    },
    detailWarning: {
        padding: 14,
        borderRadius: 16,
        flexDirection: "row",
        gap: 9,
        backgroundColor: farmerColors.warningSoft
    },
    detailWarningText: {
        flex: 1,
        color: farmerColors.warning
    },
    detailActionContent: {
        minHeight: 50
    },
    detailOutlineButton: {
        borderColor: farmerColors.primary
    },
    detailWarningButton: {
        borderColor: farmerColors.warning
    }
})