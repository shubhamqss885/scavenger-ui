"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from "react";
import {
  Group,
  GroupInvite,
  Notification,
  listGroups,
  getPendingInvites,
  getNotifications,
  acceptInvite,
  rejectInvite,
  markNotificationsRead,
  markAllNotificationsRead,
  createGroup as createGroupApi,
  deleteGroup as deleteGroupApi,
  updateGroup as updateGroupApi,
  CreateGroupRequest,
  UpdateGroupRequest,
} from "@/lib/services/groupService";
import { AxiosContext } from "@/lib/context/AuthContext";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";
import { refreshOrForceLogout } from "@/lib/services/axiosInstances/tokenRefresh";

type MemberJoinedCallback = (groupId: string, memberName: string) => void;

type GroupsContextValue = {
  groups: Group[];
  invites: GroupInvite[];
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  createGroup: (data: CreateGroupRequest) => Promise<Group | null>;
  updateGroup: (groupId: string, data: UpdateGroupRequest) => Promise<boolean>;
  deleteGroup: (groupId: string) => Promise<boolean>;
  refreshGroups: () => Promise<void>;

  acceptInvite: (inviteId: string) => Promise<boolean>;
  rejectInvite: (inviteId: string) => Promise<boolean>;
  refreshInvites: () => Promise<void>;

  markAsRead: (notificationIds: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;

  onMemberJoined: (callback: MemberJoinedCallback) => () => void;
};

const GroupsContext = createContext<GroupsContextValue | null>(null);

type GroupsProviderProps = {
  children: ReactNode;
};

export const GroupsProvider = ({ children }: GroupsProviderProps) => {
  const { authStatus, token } = useContext(AxiosContext);
  const { userOrganizationProfile } = useOrgFeatures();

  const [groups, setGroups] = useState<Group[]>([]);
  const [invites, setInvites] = useState<GroupInvite[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Callbacks for member_joined events
  const memberJoinedCallbacksRef = useRef<Set<MemberJoinedCallback>>(new Set());

  // Fetch groups
  const refreshGroups = useCallback(async () => {
    try {
      const response = await listGroups();
      setGroups(response.groups);
    } catch (err) {
      console.error("Failed to fetch groups:", err);
      setError("Failed to load groups");
    }
  }, []);

  // Fetch invites
  const refreshInvites = useCallback(async () => {
    try {
      const response = await getPendingInvites();
      setInvites(response.invites);
    } catch (err) {
      console.error("Failed to fetch invites:", err);
    }
  }, []);

  // Fetch notifications
  const refreshNotifications = useCallback(async () => {
    try {
      const response = await getNotifications(false, 50);
      setNotifications(response.notifications);
      setUnreadCount(response.unread_count);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, []);

  // Create group
  const handleCreateGroup = useCallback(
    async (data: CreateGroupRequest): Promise<Group | null> => {
      try {
        const response = await createGroupApi(data);

        if (response.group) {
          setGroups((prev) => [response.group, ...prev]);

          return response.group;
        }

        return null;
      } catch (err) {
        console.error("Failed to create group:", err);
        setError("Failed to create group");
        return null;
      }
    },
    [],
  );

  // Update group
  const handleUpdateGroup = useCallback(
    async (groupId: string, data: UpdateGroupRequest): Promise<boolean> => {
      try {
        await updateGroupApi(groupId, data);
        setGroups((prev) =>
          prev.map((g) =>
            g.group_id === groupId
              ? { ...g, ...data, updated_at: new Date().toISOString() }
              : g,
          ),
        );
        return true;
      } catch (err) {
        console.error("Failed to update group:", err);
        return false;
      }
    },
    [],
  );

  // Delete group
  const handleDeleteGroup = useCallback(
    async (groupId: string): Promise<boolean> => {
      try {
        await deleteGroupApi(groupId);
        setGroups((prev) => prev.filter((g) => g.group_id !== groupId));
        return true;
      } catch (err) {
        console.error("Failed to delete group:", err);
        return false;
      }
    },
    [],
  );

  // Accept invite
  const handleAcceptInvite = useCallback(
    async (inviteId: string): Promise<boolean> => {
      try {
        await acceptInvite(inviteId);
        setInvites((prev) => prev.filter((i) => i.invite_id !== inviteId));
        await refreshGroups();
        return true;
      } catch (err) {
        console.error("Failed to accept invite:", err);
        return false;
      }
    },
    [refreshGroups],
  );

  // Reject invite
  const handleRejectInvite = useCallback(
    async (inviteId: string): Promise<boolean> => {
      try {
        await rejectInvite(inviteId);
        setInvites((prev) => prev.filter((i) => i.invite_id !== inviteId));
        return true;
      } catch (err) {
        console.error("Failed to reject invite:", err);
        return false;
      }
    },
    [],
  );

  // Mark notifications as read
  const handleMarkAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      await markNotificationsRead(notificationIds);
      setNotifications((prev) => {
        const nowRead = prev.filter(
          (n) => notificationIds.includes(n.notification_id) && !n.is_read,
        ).length;
        setUnreadCount((c) => Math.max(0, c - nowRead));
        return prev.map((n) =>
          notificationIds.includes(n.notification_id)
            ? { ...n, is_read: true }
            : n,
        );
      });
    } catch (err) {
      console.error("Failed to mark notifications as read:", err);
    }
  }, []);

  // Mark all notifications as read
  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  }, []);

  // Register callback for member_joined events
  const handleOnMemberJoined = useCallback((callback: MemberJoinedCallback) => {
    memberJoinedCallbacksRef.current.add(callback);
    return () => {
      memberJoinedCallbacksRef.current.delete(callback);
    };
  }, []);

  // Current org ID for tracking org switches
  const currentOrgId = userOrganizationProfile?.current_organization;
  const prevOrgIdRef = useRef<string | undefined>(undefined);

  // Initial fetch
  useEffect(() => {
    if (authStatus !== "ready") return;

    const fetchAll = async () => {
      setIsLoading(true);
      setError(null);
      await Promise.all([
        refreshGroups(),
        refreshInvites(),
        refreshNotifications(),
      ]);
      setIsLoading(false);
    };

    fetchAll();
  }, [authStatus, refreshGroups, refreshInvites, refreshNotifications]);

  // Refresh when org changes (not on initial load)
  useEffect(() => {
    if (!currentOrgId) return;

    // Skip if this is the initial org load (not a switch)
    if (prevOrgIdRef.current === undefined) {
      prevOrgIdRef.current = currentOrgId;
      return;
    }

    // Only refresh if org actually changed
    if (prevOrgIdRef.current !== currentOrgId) {
      prevOrgIdRef.current = currentOrgId;
      refreshGroups();
      refreshInvites();
      refreshNotifications();
    }
  }, [currentOrgId, refreshGroups, refreshInvites, refreshNotifications]);

  // WebSocket for real-time notifications
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    if (authStatus !== "ready" || !token) return;

    const wsBaseUrl = process.env.NEXT_PUBLIC_WS_BASE_URL;

    if (!wsBaseUrl) return;

    const notificationsUrl = `${wsBaseUrl}/agentic/user/notifications`;
    let isUnmounted = false;

    const connect = () => {
      if (isUnmounted) return;

      const socket = new WebSocket(notificationsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        if (isUnmounted) return;
        socket.send(JSON.stringify({ auth_token: token }));
      };

      socket.onmessage = (event) => {
        if (isUnmounted) return;

        try {
          const data = JSON.parse(event.data);

          // Auth error - refresh token
          if (
            data.error === "unauthorized" ||
            data.error === "invalid_token" ||
            (typeof data.message === "string" &&
              data.message.toLowerCase().includes("invalid jwt"))
          ) {
            refreshOrForceLogout()
              .catch(() => {})
              .finally(() => socket.close());
            return;
          }

          // New notification received - refresh the list
          if (data.type === "notification") {
            refreshNotifications();
            refreshInvites();

            // If this is a member_joined notification, call registered callbacks
            // WebSocket format: {type: "notification", notification_type: "member_joined", payload: {...}}
            if (
              data.notification_type === "member_joined" &&
              data.payload?.group_id
            ) {
              const groupId = data.payload.group_id;
              const memberName = data.payload.new_member_name || "A new member";
              memberJoinedCallbacksRef.current.forEach((cb) =>
                cb(groupId, memberName),
              );
            }
          }
        } catch (err) {
          console.error("Failed to parse notification event:", err);
        }
      };

      socket.onclose = () => {
        if (isUnmounted) return;
        // Reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
      };

      socket.onerror = (err) => {
        console.error("Notifications WebSocket error:", err);
      };
    };

    connect();

    return () => {
      isUnmounted = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [authStatus, token, refreshNotifications, refreshInvites]);

  const value = useMemo<GroupsContextValue>(
    () => ({
      groups,
      invites,
      notifications,
      unreadCount,
      isLoading,
      error,
      createGroup: handleCreateGroup,
      updateGroup: handleUpdateGroup,
      deleteGroup: handleDeleteGroup,
      refreshGroups,
      acceptInvite: handleAcceptInvite,
      rejectInvite: handleRejectInvite,
      refreshInvites,
      markAsRead: handleMarkAsRead,
      markAllAsRead: handleMarkAllAsRead,
      refreshNotifications,
      onMemberJoined: handleOnMemberJoined,
    }),
    [
      groups,
      invites,
      notifications,
      unreadCount,
      isLoading,
      error,
      handleCreateGroup,
      handleUpdateGroup,
      handleDeleteGroup,
      refreshGroups,
      handleAcceptInvite,
      handleRejectInvite,
      refreshInvites,
      handleMarkAsRead,
      handleMarkAllAsRead,
      refreshNotifications,
      handleOnMemberJoined,
    ],
  );

  return (
    <GroupsContext.Provider value={value}>{children}</GroupsContext.Provider>
  );
};

export const useGroups = (): GroupsContextValue => {
  const context = useContext(GroupsContext);

  if (!context) {
    throw new Error("useGroups must be used within a GroupsProvider");
  }
  return context;
};

export { GroupsContext };
