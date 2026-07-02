"use client";

import { useState } from "react";
import { useTransitionRouter } from "next-view-transitions";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useGroups } from "@/lib/context/GroupsContext";
import { cn } from "@/lib/utils";
import type { GroupInvite, Notification } from "@/lib/services/groupService";

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

type InviteItemProps = Readonly<{
  invite: GroupInvite;
  onAction: () => void;
}>;

const InviteItem = ({ invite, onAction }: InviteItemProps) => {
  const { acceptInvite, rejectInvite } = useGroups();
  const [isActing, setIsActing] = useState(false);

  const handleAccept = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsActing(true);
    try {
      await acceptInvite(invite.invite_id);
      onAction();
    } finally {
      setIsActing(false);
    }
  };

  const handleReject = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsActing(true);
    try {
      await rejectInvite(invite.invite_id);
      onAction();
    } finally {
      setIsActing(false);
    }
  };

  return (
    <div className="flex gap-3 p-3 border-b last:border-b-0 bg-primary/5">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon name="UserPlus" size="sm" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          You&apos;ve been invited to join{" "}
          <span className="font-medium">{invite.group_name}</span>
        </p>
        {invite.inviter_name && (
          <p className="text-xs text-muted-foreground">
            by {invite.inviter_name}
          </p>
        )}
        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            variant="default"
            onClick={handleAccept}
            disabled={isActing}
            className="h-7 text-xs gap-1"
          >
            <Icon name="Check" size="xs" />
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleReject}
            disabled={isActing}
            className="h-7 text-xs gap-1"
          >
            <Icon name="X" size="xs" />
            Decline
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {formatTimeAgo(invite.created_at ?? "")}
        </p>
      </div>
      <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
    </div>
  );
};

type NotificationItemProps = Readonly<{
  notification: Notification;
  onAction: () => void;
}>;

const NotificationItem = ({
  notification,
  onAction,
}: NotificationItemProps) => {
  const router = useTransitionRouter();
  const { markAsRead } = useGroups();

  const handleClick = async () => {
    if (!notification.is_read) {
      await markAsRead([notification.notification_id]);
    }

    if (
      notification.type === "group_mention" &&
      notification.payload.group_id
    ) {
      router.push(`/groups/${notification.payload.group_id}`);
      onAction();
    } else if (
      (notification.type === "invite_accepted" ||
        notification.type === "invite_rejected" ||
        notification.type === "member_joined" ||
        notification.type === "member_left" ||
        notification.type === "member_removed" ||
        notification.type === "role_promoted" ||
        notification.type === "role_demoted" ||
        notification.type === "member_role_changed") &&
      notification.payload.group_id
    ) {
      router.push(`/groups/${notification.payload.group_id}`);
      onAction();
    }
  };

  const renderContent = () => {
    switch (notification.type) {
      case "invite_accepted":
        return (
          <p className="text-sm">
            Your invite to{" "}
            <span className="font-medium">
              {notification.payload.group_name}
            </span>{" "}
            was accepted
          </p>
        );

      case "invite_rejected":
        return (
          <p className="text-sm">
            Your invite to{" "}
            <span className="font-medium">
              {notification.payload.group_name}
            </span>{" "}
            was declined
          </p>
        );

      case "member_joined":
        return (
          <p className="text-sm">
            <span className="font-medium">
              {notification.payload.new_member_name}
            </span>{" "}
            joined{" "}
            <span className="font-medium">
              {notification.payload.group_name}
            </span>
          </p>
        );

      case "member_left":
        return (
          <p className="text-sm">
            <span className="font-medium">
              {notification.payload.removed_member_name}
            </span>{" "}
            left{" "}
            <span className="font-medium">
              {notification.payload.group_name}
            </span>
          </p>
        );

      case "member_removed":
        return (
          <p className="text-sm">
            <span className="font-medium">
              {notification.payload.removed_member_name}
            </span>{" "}
            was removed from{" "}
            <span className="font-medium">
              {notification.payload.group_name}
            </span>
          </p>
        );

      case "role_promoted":
        return (
          <p className="text-sm">
            You were made admin of{" "}
            <span className="font-medium">
              {notification.payload.group_name}
            </span>
          </p>
        );

      case "role_demoted":
        return (
          <p className="text-sm">
            You were demoted to member in{" "}
            <span className="font-medium">
              {notification.payload.group_name}
            </span>
          </p>
        );

      case "member_role_changed":
        return (
          <p className="text-sm">
            <span className="font-medium">
              {notification.payload.member_name}
            </span>{" "}
            is now {notification.payload.new_role} in{" "}
            <span className="font-medium">
              {notification.payload.group_name}
            </span>
          </p>
        );

      case "group_mention":
        return (
          <p className="text-sm">
            <span className="font-medium">
              {notification.payload.sender_name}
            </span>{" "}
            mentioned you in{" "}
            <span className="font-medium">
              {notification.payload.group_name}
            </span>
          </p>
        );

      default:
        return <p className="text-sm">New notification</p>;
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case "invite_accepted":
      case "member_joined":
        return "UserCheck";
      case "invite_rejected":
      case "member_left":
      case "member_removed":
      case "role_demoted":
        return "UserX";
      case "role_promoted":
        return "Shield";
      case "member_role_changed":
        return "ShieldCheck";
      case "group_mention":
        return "AtSign";
      default:
        return "Bell";
    }
  };

  const getIconStyle = () => {
    switch (notification.type) {
      case "invite_accepted":
      case "member_joined":
      case "role_promoted":
        return "bg-green-100 text-green-600 dark:bg-green-900/30";
      case "invite_rejected":
      case "member_left":
      case "member_removed":
      case "role_demoted":
        return "bg-red-100 text-red-600 dark:bg-red-900/30";
      case "member_role_changed":
        return "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30";
      case "group_mention":
        return "bg-blue-100 text-blue-600 dark:bg-blue-900/30";
      default:
        return "bg-muted";
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex gap-3 p-3 border-b last:border-b-0 transition-colors cursor-pointer hover:bg-accent",
        !notification.is_read && "bg-primary/5",
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          getIconStyle(),
        )}
      >
        <Icon name={getIcon()} size="sm" />
      </div>
      <div className="flex-1 min-w-0">
        {renderContent()}
        <p className="text-xs text-muted-foreground mt-1">
          {formatTimeAgo(notification.created_at ?? "")}
        </p>
      </div>
      {!notification.is_read && (
        <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
      )}
    </div>
  );
};

export const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const {
    invites,
    notifications,
    markAllAsRead,
    refreshInvites,
    refreshNotifications,
  } = useGroups();

  // Filter out group_invite notifications since they're shown via invites endpoint
  const filteredNotifications = notifications.filter(
    (n) => n.type !== "group_invite",
  );

  // Count unread from filtered notifications (exclude group_invite)
  const filteredUnreadCount = filteredNotifications.filter(
    (n) => !n.is_read,
  ).length;

  // Total unread = invites (always unread) + unread non-group_invite notifications
  const totalUnread = invites.length + filteredUnreadCount;

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      refreshInvites();
      refreshNotifications();
    }
  };

  const handleAction = () => {
    refreshInvites();
    refreshNotifications();
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  const hasItems = invites.length > 0 || filteredNotifications.length > 0;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
          aria-label="Notifications"
        >
          <Icon name="Bell" size="sm" className="text-muted-foreground" />
          {totalUnread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0" sideOffset={8}>
        <div className="flex items-center justify-between border-b px-3 py-2">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {filteredUnreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-primary hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {!hasItems ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Icon
                name="BellOff"
                size="lg"
                className="text-muted-foreground/50 mb-2"
              />
              <p className="text-sm text-muted-foreground">
                No notifications yet
              </p>
            </div>
          ) : (
            <>
              {/* Pending Invites first */}
              {invites.map((invite) => (
                <InviteItem
                  key={invite.invite_id}
                  invite={invite}
                  onAction={handleAction}
                />
              ))}
              {/* Other notifications */}
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.notification_id}
                  notification={notification}
                  onAction={handleAction}
                />
              ))}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
