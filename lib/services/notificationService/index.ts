import { getAxiosInstance } from "../axiosInstances";

export type NotificationType =
  | "group_invite"
  | "invite_accepted"
  | "invite_rejected"
  | "mention";

export type Notification = {
  notification_id: string;
  type: NotificationType;
  payload: {
    group_id?: string;
    group_name?: string;
    invite_id?: string;
    inviter_sub?: string;
    invitee_sub?: string;
    message?: string;
    sender_name?: string;
    conversation_id?: string;
  };
  is_read: boolean;
  created_at: string;
};

export type NotificationsResponse = {
  status_code: number;
  notifications: Notification[];
  count: number;
  unread_count: number;
};

export const getNotifications = async (
  unreadOnly = false,
  limit = 50,
): Promise<NotificationsResponse> => {
  const response = await getAxiosInstance().get<NotificationsResponse>(
    "/project/notifications",
    {
      params: { unread_only: unreadOnly, limit },
    },
  );
  return response.data;
};

export const markNotificationsRead = async (
  notificationIds: string[],
): Promise<void> => {
  await getAxiosInstance().post("/project/notifications/read", {
    notification_ids: notificationIds,
  });
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await getAxiosInstance().post("/project/notifications/read-all");
};
