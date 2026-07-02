import { getAxiosInstance } from "@/lib/services/axiosInstances";

export type Group = {
  group_id: string;
  project_id: string;
  session_id: string;
  group_name: string;
  description: string | null;
  members_can_send: boolean;
  orgdb_id: string | null;
  created_by: string;
  created_at: string | null;
  updated_at: string | null;
  user_role: "admin" | "member";
  member_count: number;
  pending_invite_count: number;
};

export type GroupMember = {
  id: string;
  user_sub: string;
  role: "admin" | "member";
  joined_at: string | null;
  user_name: string | null;
  user_email: string | null;
};

export type PendingGroupInvite = {
  invite_id: string;
  invitee_sub: string;
  created_at: string | null;
  user_name: string | null;
  user_email: string | null;
};

export type GroupWithMembers = Group & {
  members: GroupMember[];
  pending_invites: PendingGroupInvite[];
  pending_invite_count: number;
};

export type GroupInvite = {
  invite_id: string;
  group_id: string;
  inviter_sub: string;
  created_at: string | null;
  group_name: string;
  description: string | null;
  inviter_name: string | null;
};

export type NotificationPayload = {
  group_id?: string;
  group_name?: string;
  invite_id?: string;
  inviter_sub?: string;
  invitee_sub?: string;
  message?: string;
  sender_name?: string;
  conversation_id?: string;
  new_member_sub?: string;
  new_member_name?: string;
  removed_member_sub?: string;
  removed_member_name?: string;
  member_name?: string;
  new_role?: string;
};

export type Notification = {
  notification_id: string;
  type:
    | "group_invite"
    | "group_mention"
    | "invite_rejected"
    | "invite_accepted"
    | "member_joined"
    | "member_left"
    | "member_removed"
    | "role_promoted"
    | "role_demoted"
    | "member_role_changed";
  payload: NotificationPayload;
  is_read: boolean;
  created_at: string | null;
};

export type CreateGroupRequest = {
  group_name: string;
  orgdb_id: string;
  description?: string;
  members_can_send?: boolean;
};

export type UpdateGroupRequest = {
  group_name?: string;
  description?: string;
  members_can_send?: boolean;
};

// API URLs
const GroupUrls = {
  Groups: "/project/groups",
  Invites: "/project/invites",
  Notifications: "/project/notifications",
};

// Group CRUD
export const createGroup = async (data: CreateGroupRequest) => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.post(GroupUrls.Groups, data);
  return response.data;
};

export const listGroups = async (): Promise<{
  groups: Group[];
  count: number;
}> => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.get(GroupUrls.Groups);
  return response.data;
};

export const getGroup = async (
  groupId: string,
): Promise<{ group: GroupWithMembers }> => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.get(`${GroupUrls.Groups}/${groupId}`);
  return response.data;
};

export const updateGroup = async (
  groupId: string,
  data: UpdateGroupRequest,
) => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.patch(
    `${GroupUrls.Groups}/${groupId}`,
    data,
  );
  return response.data;
};

export const deleteGroup = async (groupId: string) => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.delete(`${GroupUrls.Groups}/${groupId}`);
  return response.data;
};

// Members
export const listGroupMembers = async (
  groupId: string,
): Promise<{ members: GroupMember[]; count: number }> => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.get(
    `${GroupUrls.Groups}/${groupId}/members`,
  );
  return response.data;
};

export const inviteMember = async (groupId: string, email: string) => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.post(
    `${GroupUrls.Groups}/${groupId}/members`,
    {
      email,
    },
  );
  return response.data;
};

export const removeMember = async (groupId: string, memberId: string) => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.delete(
    `${GroupUrls.Groups}/${groupId}/members/${memberId}`,
  );
  return response.data;
};

export const leaveGroup = async (groupId: string, memberId: string) => {
  return removeMember(groupId, memberId);
};

export const updateMemberRole = async (
  groupId: string,
  memberId: string,
  role: "admin" | "member",
) => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.patch(
    `${GroupUrls.Groups}/${groupId}/members/${memberId}`,
    {
      role,
    },
  );
  return response.data;
};

// Invites
export const getPendingInvites = async (): Promise<{
  invites: GroupInvite[];
  count: number;
}> => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.get(GroupUrls.Invites);
  return response.data;
};

export const acceptInvite = async (inviteId: string) => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.post(
    `${GroupUrls.Invites}/${inviteId}/accept`,
  );
  return response.data;
};

export const rejectInvite = async (inviteId: string) => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.post(
    `${GroupUrls.Invites}/${inviteId}/reject`,
  );
  return response.data;
};

export const revokeInvite = async (inviteId: string) => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.delete(
    `${GroupUrls.Invites}/${inviteId}`,
  );
  return response.data;
};

// Notifications
export const getNotifications = async (
  unreadOnly: boolean = false,
  limit: number = 50,
): Promise<{
  notifications: Notification[];
  count: number;
  unread_count: number;
}> => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.get(GroupUrls.Notifications, {
    params: { unread_only: unreadOnly, limit },
  });
  return response.data;
};

export const markNotificationsRead = async (notificationIds: string[]) => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.post(`${GroupUrls.Notifications}/read`, {
    notification_ids: notificationIds,
  });
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.post(
    `${GroupUrls.Notifications}/read-all`,
  );
  return response.data;
};

// Export all as a service object for convenience
export const groupService = {
  // Groups
  createGroup,
  listGroups,
  getGroup,
  updateGroup,
  deleteGroup,

  // Members
  listGroupMembers,
  inviteMember,
  removeMember,
  leaveGroup,
  updateMemberRole,

  // Invites
  getPendingInvites,
  acceptInvite,
  rejectInvite,
  revokeInvite,

  // Notifications
  getNotifications,
  markNotificationsRead,
  markAllNotificationsRead,
};

export default groupService;
