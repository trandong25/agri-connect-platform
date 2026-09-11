import apiClient from "./apiClient"
import type {
    AppNotification
} from "../../types/notification"

type NotificationListResponse =
    | AppNotification[]
    | {
        results: AppNotification[]
    }

export const getNotifications = async (
    isRead?: boolean
) => {
    const response =
        await apiClient.get<NotificationListResponse>(
            "notifications/",
            {
                params:
                    isRead === undefined
                        ? undefined
                        : {
                            is_read: isRead
                        }
            }
        )

    if (Array.isArray(response.data)) {
        return response.data
    }

    return response.data.results
}

export const getNotificationDetail = async (
    notificationId: number
) => {
    const response =
        await apiClient.get<AppNotification>(
            `notifications/${notificationId}/`
        )

    return response.data
}

export const markNotificationAsRead = async (
    notificationId: number
) => {
    const response =
        await apiClient.post<AppNotification>(
            `notifications/${notificationId}/read/`
        )

    return response.data
}

export const markAllNotificationsAsRead = async () => {
    await apiClient.post(
        "notifications/read-all/"
    )
}