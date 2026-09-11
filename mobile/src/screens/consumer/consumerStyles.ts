import { StyleSheet } from "react-native"

export const consumerColors = {
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
    dangerSoft: "#FCE8E6"
}

export const consumerStyles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: consumerColors.background
    },
    screen: {
        flex: 1,
        backgroundColor: consumerColors.background
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: 24,
        backgroundColor: consumerColors.background
    },
    centerText: {
        textAlign: "center",
        color: consumerColors.textSecondary
    },
    content: {
        padding: 16,
        paddingBottom: 36,
        gap: 16
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        gap: 4
    },
    headerTitle: {
        color: consumerColors.text,
        fontWeight: "800"
    },
    bold: {
        fontWeight: "700"
    },
    secondaryText: {
        color: consumerColors.textSecondary
    },
    sectionTitle: {
        color: consumerColors.text,
        fontWeight: "700"
    },
    card: {
        padding: 16,
        borderRadius: 18,
        gap: 14,
        backgroundColor: consumerColors.surface
    },
    section: {
        padding: 16,
        borderRadius: 18,
        gap: 14,
        backgroundColor: consumerColors.surface
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8
    },
    summaryRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10
    },
    buttonContent: {
        minHeight: 50
    },
    warning: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        borderRadius: 14,
        padding: 12,
        backgroundColor: consumerColors.dangerSoft
    },
    profileHeaderCard: {
        padding: 20,
        borderRadius: 20,
        alignItems: "center",
        gap: 7,
        backgroundColor: consumerColors.surface
    },
    profileAvatar: {
        width: 86,
        height: 86,
        borderRadius: 43,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        marginBottom: 5,
        backgroundColor: consumerColors.primarySoft
    },
    profileAvatarImage: {
        width: "100%",
        height: "100%"
    },
    profileName: {
        color: consumerColors.text,
        fontWeight: "800",
        textAlign: "center"
    },
    profileUsername: {
        color: consumerColors.textSecondary
    },
    profileRow: {
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
        backgroundColor: consumerColors.primarySoft
    },
    profileRowText: {
        flex: 1,
        gap: 2
    },
    label: {
        color: consumerColors.textSecondary
    },
    editContent: {
        padding: 16,
        paddingBottom: 36,
        gap: 16
    },
    editSection: {
        padding: 16,
        borderRadius: 18,
        gap: 13,
        backgroundColor: consumerColors.surface
    },
    input: {
        backgroundColor: consumerColors.surface
    },
    addressCard: {
        padding: 15,
        borderRadius: 18,
        gap: 12,
        backgroundColor: consumerColors.surface
    },
    addressTop: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12
    },
    addressInfo: {
        flex: 1,
        gap: 4
    },
    addressRecipient: {
        color: consumerColors.text,
        fontWeight: "700"
    },
    addressText: {
        color: consumerColors.textSecondary,
        lineHeight: 20
    },
    addressActions: {
        paddingTop: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: consumerColors.border,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        flexWrap: "wrap",
        gap: 6
    },
    empty: {
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
        paddingVertical: 70,
        gap: 10
    },
    emptyIcon: {
        width: 100,
        height: 100,
        borderRadius: 34,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: consumerColors.primarySoft
    }
})