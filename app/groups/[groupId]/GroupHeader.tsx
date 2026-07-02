"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useGroups } from "@/lib/context/GroupsContext";
import { useUserContext } from "@/lib/context/UserDataContext";
import { useOrgFeatures } from "@/lib/context/OrgFeatureContext";
import {
  type GroupMember,
  type PendingGroupInvite,
  getGroup,
  inviteMember,
  removeMember,
  updateMemberRole,
  leaveGroup,
  revokeInvite,
} from "@/lib/services/groupService";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type GroupHeaderProps = Readonly<{
  groupId: string;
}>;

export const GroupHeader = ({ groupId }: GroupHeaderProps) => {
  const router = useRouter();
  const { groups, refreshGroups, onMemberJoined } = useGroups();
  const { userProfile } = useUserContext();
  const { homeRoute } = useOrgFeatures();
  const currentUserSub = userProfile?.sub;

  const group = groups.find((g) => g.group_id === groupId);
  const isAdmin = group?.user_role === "admin";

  const [membersOpen, setMembersOpen] = useState(false);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingGroupInvite[]>(
    [],
  );
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [pendingLeaveId, setPendingLeaveId] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setIsLoadingMembers(true);
    try {
      const response = await getGroup(groupId);
      setMembers(response.group.members || []);
      setPendingInvites(response.group.pending_invites || []);
    } catch (err) {
      console.error("Failed to fetch members:", err);
    } finally {
      setIsLoadingMembers(false);
    }
  }, [groupId]);

  useEffect(() => {
    if (membersOpen) {
      fetchMembers();
    }
  }, [membersOpen, fetchMembers]);

  // Refresh members when someone joins this group
  useEffect(() => {
    const unsubscribe = onMemberJoined((joinedGroupId, memberName) => {
      if (joinedGroupId === groupId) {
        fetchMembers();
        refreshGroups();
      }
    });
    return unsubscribe;
  }, [groupId, onMemberJoined, fetchMembers, refreshGroups]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    try {
      await inviteMember(groupId, inviteEmail.trim());
      toast.success("Invite sent");
      setInviteOpen(false);
      setInviteEmail("");
      fetchMembers();
      refreshGroups();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      toast.error(e?.response?.data?.detail || "Failed to send invite");
    } finally {
      setIsInviting(false);
    }
  };

  const handleToggleRole = async (
    memberId: string,
    currentRole: "admin" | "member",
  ) => {
    const newRole = currentRole === "admin" ? "member" : "admin";
    try {
      await updateMemberRole(groupId, memberId, newRole);
      toast.success(`Role updated to ${newRole}`);
      fetchMembers();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      toast.error(e?.response?.data?.detail || "Failed to update role");
    }
  };

  const confirmRemoveMember = async () => {
    if (!removingMemberId) return;
    try {
      await removeMember(groupId, removingMemberId);
      toast.success("Member removed");
      fetchMembers();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      toast.error(e?.response?.data?.detail || "Failed to remove member");
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleLeaveGroup = async () => {
    if (!currentUserSub) return;
    let currentMember = members.find((m) => m.user_sub === currentUserSub);
    if (!currentMember) {
      try {
        const response = await getGroup(groupId);
        const fetched = response.group.members || [];
        currentMember = fetched.find((m) => m.user_sub === currentUserSub);
      } catch {
        // ignore
      }
    }
    if (!currentMember) {
      toast.error("Could not find your membership");
      return;
    }
    setPendingLeaveId(currentMember.id);
    setLeaveConfirmOpen(true);
  };

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      await revokeInvite(inviteId);
      toast.success("Invite revoked");
      fetchMembers();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      toast.error(e?.response?.data?.detail || "Failed to revoke invite");
    }
  };

  const confirmLeaveGroup = async () => {
    if (!pendingLeaveId) return;
    try {
      await leaveGroup(groupId, pendingLeaveId);
      toast.success("Left group");
      refreshGroups();
      router.push(homeRoute);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      toast.error(e?.response?.data?.detail || "Failed to leave group");
    } finally {
      setPendingLeaveId(null);
      setLeaveConfirmOpen(false);
    }
  };

  if (!group) return null;

  return (
    <>
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <Icon name="Users" className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-medium">{group.group_name}</h1>
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
            Beta
          </Badge>
          <span className="text-sm text-muted-foreground">
            ({group.member_count} member{group.member_count !== 1 ? "s" : ""}
            {isAdmin && group.pending_invite_count > 0
              ? `, ${group.pending_invite_count} pending`
              : ""}
            )
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMembersOpen(true)}
          >
            <Icon name="Users" className="mr-1 h-4 w-4" />
            Members
          </Button>

          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInviteOpen(true)}
            >
              <Icon name="UserPlus" className="mr-1 h-4 w-4" />
              Invite
            </Button>
          )}
        </div>
      </div>

      {/* Members Sheet */}
      <Sheet open={membersOpen} onOpenChange={setMembersOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Group Members</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-2">
            {isLoadingMembers ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members</p>
            ) : (
              members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <p className="font-medium">
                      {member.user_name || member.user_email || member.user_sub}
                    </p>
                    {member.user_email && member.user_name && (
                      <p className="text-sm text-muted-foreground">
                        {member.user_email}
                      </p>
                    )}
                    <span
                      className={`text-xs ${
                        member.role === "admin"
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      {member.role}
                    </span>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleRole(member.id, member.role)}
                        title={`Make ${member.role === "admin" ? "member" : "admin"}`}
                      >
                        <Icon
                          name={
                            member.role === "admin" ? "UserMinus" : "Shield"
                          }
                          className="h-4 w-4"
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRemovingMemberId(member.id)}
                        className="text-destructive hover:text-destructive"
                        title="Remove member"
                      >
                        <Icon name="X" className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          {isAdmin && pendingInvites.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                Pending invites ({pendingInvites.length})
              </p>
              <div className="space-y-2">
                {pendingInvites.map((invite) => (
                  <div
                    key={invite.invite_id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="font-medium">
                        {invite.user_name ||
                          invite.user_email ||
                          invite.invitee_sub}
                      </p>
                      {invite.user_email && invite.user_name && (
                        <p className="text-sm text-muted-foreground">
                          {invite.user_email}
                        </p>
                      )}
                      <span className="text-xs text-yellow-600">Pending</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeInvite(invite.invite_id)}
                      className="text-destructive hover:text-destructive"
                      title="Revoke invite"
                    >
                      <Icon name="X" className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="mt-4 flex flex-col gap-2">
            {isAdmin && (
              <Button
                onClick={() => {
                  setMembersOpen(false);
                  setInviteOpen(true);
                }}
              >
                <Icon name="UserPlus" className="mr-2 h-4 w-4" />
                Invite member
              </Button>
            )}
            {!isAdmin && (
              <Button
                variant="outline"
                onClick={handleLeaveGroup}
                className="text-destructive hover:text-destructive"
              >
                <Icon name="LogOut" className="mr-2 h-4 w-4" />
                Leave group
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Remove Member Confirmation */}
      <AlertDialog
        open={!!removingMemberId}
        onOpenChange={(open) => !open && setRemovingMemberId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member</AlertDialogTitle>
            <AlertDialogDescription>
              Remove this member from the group?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Group Confirmation */}
      <AlertDialog
        open={leaveConfirmOpen}
        onOpenChange={(open) => !open && setLeaveConfirmOpen(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave this group?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLeaveGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite member</DialogTitle>
          </DialogHeader>
          <Input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Email address"
            onKeyDown={(e) => e.key === "Enter" && handleInvite()}
            autoFocus
          />
          <p className="text-sm text-muted-foreground">
            Enter the email of a user in your organization to invite them.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              disabled={!inviteEmail.trim() || isInviting}
            >
              Send invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
