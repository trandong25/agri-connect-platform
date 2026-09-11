import { StyleSheet } from "react-native"

export const kocColors = {
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

export const kocStyles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: kocColors.background
    },
    screen: {
        flex: 1,
        backgroundColor: kocColors.background
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: 24,
        backgroundColor: kocColors.background
    },
    centerText: {
        color: kocColors.textSecondary,
        textAlign: "center"
    },
    content: {
        padding: 16,
        paddingBottom: 36,
        gap: 14
    },
    header: {
        gap: 4
    },
    title: {
        color: kocColors.text,
        fontWeight: "800"
    },
    bold: {
        fontWeight: "700"
    },
    secondaryText: {
        color: kocColors.textSecondary
    },
    section: {
        padding: 16,
        borderRadius: 18,
        gap: 14,
        backgroundColor: kocColors.surface
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12
    },
    errorCard: {
        padding: 12,
        borderRadius: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: kocColors.dangerSoft
    },
    empty: {
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
        paddingVertical: 70,
        gap: 9
    },
    emptyIcon: {
        width: 92,
        height: 92,
        borderRadius: 30,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: kocColors.primarySoft
    },
    buttonContent: {
        minHeight: 50
    }
})