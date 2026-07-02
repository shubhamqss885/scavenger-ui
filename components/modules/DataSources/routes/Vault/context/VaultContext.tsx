"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useUserContext } from "@/lib/context/UserDataContext";
import { useTranslation } from "@/lib/i18n/client";
import { toast } from "sonner";
import {
  getVaultStatus,
  vaultGrep,
  vaultRead,
  vaultList,
  vaultDelete,
  vaultWrite,
  vaultHistory,
  type VaultStatus,
  type VaultFile,
  type VaultGrepMatch,
  type VaultHistoryEntry,
} from "@/lib/services/vaultService";

export const VAULT_DIRECTORIES = [
  "rules",
  "golden_queries",
  "documents",
] as const;

const READ_ONLY_DIRS = new Set<string>();

type DraftFile = Readonly<{
  directory: string;
  title: string;
  content: string;
}>;

export type FileActions = Readonly<{
  onEdit: () => void;
  onDelete: () => void;
  readOnly?: boolean;
}>;

type VaultContextValue = {
  orgdbId: string;
  userEmail: string;

  // Data
  status: VaultStatus | null;
  loading: boolean;
  filesByDir: Record<string, VaultFile[]>;
  auditHistory: VaultHistoryEntry[];
  auditLoading: boolean;
  loadAuditHistory: () => Promise<void>;

  // Selection
  selectedFile: VaultFile | null;
  selectFile: (file: VaultFile) => void;
  clearSelection: () => void;

  // Editing
  editingFile: VaultFile | null;
  editContent: string;
  setEditContent: (content: string) => void;
  startEdit: (file: VaultFile) => void;
  handleSaveEdit: () => Promise<void>;
  cancelEdit: () => void;

  // Draft (new file)
  draft: DraftFile | null;
  setDraft: (draft: DraftFile | null) => void;
  saving: boolean;
  handleNewFile: (dir: string) => void;
  handleSaveDraft: () => Promise<void>;
  slugify: (text: string) => string;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: VaultGrepMatch[];
  searchLoading: boolean;
  clearSearch: () => void;

  // Delete
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  handleDeleteFile: (path: string) => void;
  confirmDelete: () => Promise<void>;

  // Sidebar
  collapsedDirs: Set<string>;
  toggleDir: (dir: string) => void;

  // Audit
  showAudit: boolean;
  setShowAudit: (show: boolean) => void;

  // Overlay (rules/examples panels)
  overlayPanel: "rules" | "examples" | null;
  toggleOverlay: (panel: "rules" | "examples") => void;

  // Helpers
  isReadOnlyDir: (dir: string) => boolean;
  stripMetaLines: (content: string | undefined | null) => string;
  loadVault: () => Promise<void>;
  refreshFiles: () => Promise<void>;
};

const VaultCtx = createContext<VaultContextValue | null>(null);

export const useVault = () => {
  const ctx = useContext(VaultCtx);

  if (!ctx) throw new Error("useVault must be used within VaultProvider");
  return ctx;
};

type VaultProviderProps = Readonly<{
  orgdbId: string;
  children: React.ReactNode;
}>;

export const VaultProvider = ({ orgdbId, children }: VaultProviderProps) => {
  const { userProfile, auth0User } = useUserContext();
  const { t } = useTranslation("database");
  const userEmail = userProfile?.email ?? auth0User?.email ?? "";

  const [status, setStatus] = useState<VaultStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [filesByDir, setFilesByDir] = useState<Record<string, VaultFile[]>>({});
  const [collapsedDirs, setCollapsedDirs] = useState<Set<string>>(
    new Set(VAULT_DIRECTORIES),
  );
  const [selectedFile, setSelectedFile] = useState<VaultFile | null>(null);
  const [editingFile, setEditingFile] = useState<VaultFile | null>(null);
  const [editContent, setEditContent] = useState("");
  const [draft, setDraft] = useState<DraftFile | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchResults, setSearchResults] = useState<VaultGrepMatch[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [showAudit, setShowAudit] = useState(false);
  const [auditHistory, setAuditHistory] = useState<VaultHistoryEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [overlayPanel, setOverlayPanel] = useState<"rules" | "examples" | null>(
    null,
  );

  // ── Helpers ─────────────────────────────────────────────────────────

  const groupFilesByDir = useCallback((files: VaultFile[]) => {
    const grouped: Record<string, VaultFile[]> = {};
    for (const dir of VAULT_DIRECTORIES) {
      grouped[dir] = [];
    }
    for (const file of files) {
      if (file.directory in grouped) {
        grouped[file.directory].push(file);
      }
    }
    return grouped;
  }, []);

  // ── Load vault ──────────────────────────────────────────────────────

  const loadVault = useCallback(async () => {
    setLoading(true);
    try {
      const s = await getVaultStatus(orgdbId);
      setStatus(s);

      if (s.enabled && s.file_count > 0) {
        try {
          const res = await vaultList(orgdbId);
          setFilesByDir(groupFilesByDir(res.files));
        } catch {
          setFilesByDir({});
        }
      } else {
        setFilesByDir({});
        setCollapsedDirs(new Set(VAULT_DIRECTORIES));
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t("vault.loadFailed");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [orgdbId, t, groupFilesByDir]);

  useEffect(() => {
    loadVault();
  }, [loadVault]);

  // ── Refresh files silently (no loading state) ───────────────────────

  const refreshFiles = useCallback(async () => {
    try {
      const res = await vaultList(orgdbId);
      setFilesByDir(groupFilesByDir(res.files));
    } catch {
      // silent — vault list failed, keep current state
    }
  }, [orgdbId, groupFilesByDir]);

  // ── Audit history (lazy) ────────────────────────────────────────────

  const loadAuditHistory = useCallback(async () => {
    setAuditLoading(true);
    try {
      const res = await vaultHistory(orgdbId);
      setAuditHistory(res.history);
    } catch {
      setAuditHistory([]);
    } finally {
      setAuditLoading(false);
    }
  }, [orgdbId]);

  // ── Search (debounced, server-side) ──────────────────────────────────

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const q = debouncedSearch.trim();

    if (q.length < 1) {
      setSearchResults([]);
      setSearchLoading(false);

      return;
    }

    let cancelled = false;
    setSearchLoading(true);
    vaultGrep(orgdbId, q)
      .then((res) => {
        if (!cancelled) setSearchResults(res.matches);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSearchLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, orgdbId]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────

  const slugify = useCallback(
    (text: string) =>
      text
        .toLowerCase()
        .trim()
        .replaceAll(/[^\w\s-]/g, "")
        .replaceAll(/\s+/g, "-")
        .replaceAll(/-+/g, "-")
        .slice(0, 80),
    [],
  );

  const wrapSqlBlock = useCallback((content: string) => {
    const trimmed = content.trim();

    if (/^```sql\b/i.test(trimmed)) return trimmed;

    return `\`\`\`sql\n${trimmed}\n\`\`\``;
  }, []);

  const extractSqlFromBlock = useCallback((content: string) => {
    const match = /```sql\n([\s\S]*?)```/i.exec(content);
    return match ? match[1].trim() : content;
  }, []);

  const stripMetaLines = useCallback((content: string | undefined | null) => {
    const lines = (content ?? "").split("\n");
    let h1Removed = false;
    return lines
      .filter((l) => {
        if (!h1Removed && l.startsWith("# ")) {
          h1Removed = true;
          return false;
        }
        return !l.startsWith("**Author:**");
      })
      .join("\n")
      .trim();
  }, []);

  const isReadOnlyDir = useCallback(
    (dir: string) => READ_ONLY_DIRS.has(dir),
    [],
  );

  // ── Overlay ─────────────────────────────────────────────────────────

  const toggleOverlay = useCallback((panel: "rules" | "examples") => {
    setOverlayPanel((prev) => (prev === panel ? null : panel));
  }, []);

  // ── File selection ──────────────────────────────────────────────────

  const selectFile = useCallback((file: VaultFile) => {
    setDraft(null);
    setEditingFile(null);
    setShowAudit(false);
    setOverlayPanel(null);
    setSelectedFile(file);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFile(null);
    setEditingFile(null);
  }, []);

  // ── New file (draft) ────────────────────────────────────────────────

  const handleNewFile = useCallback((dir: string) => {
    setSelectedFile(null);
    setEditingFile(null);
    setShowAudit(false);
    setDraft({ directory: dir, title: "", content: "" });
    setCollapsedDirs((prev) => {
      const next = new Set(prev);
      next.delete(dir);
      return next;
    });
  }, []);

  const handleSaveDraft = useCallback(async () => {
    if (!draft) return;
    const trimmedTitle = draft.title.trim();

    if (!trimmedTitle) {
      toast.error(t("vault.titleRequired"));
      return;
    }
    if (!draft.content.trim()) {
      toast.error(t("vault.contentRequired"));
      return;
    }

    const lines = [`# ${trimmedTitle}`, ""];

    if (userEmail) lines.push(`**Author:** ${userEmail}`, "");
    const body =
      draft.directory === "golden_queries"
        ? wrapSqlBlock(draft.content)
        : draft.content;
    lines.push(body);
    const finalContent = lines.join("\n");

    const slug = slugify(trimmedTitle);

    if (!slug) {
      toast.error(t("vault.titleMustContainAlphanumeric"));
      return;
    }
    const path = `${draft.directory}/${slug}.md`;
    setSaving(true);
    try {
      const res = await vaultWrite(orgdbId, path, finalContent);

      if (res.ok) {
        toast.success(t("vault.fileCreated"));
        setDraft(null);
        await loadVault();
      } else {
        toast.error(res.error || t("vault.saveFailed"));
      }
    } catch {
      toast.error(t("vault.saveFailed"));
    } finally {
      setSaving(false);
    }
  }, [draft, userEmail, orgdbId, slugify, loadVault, wrapSqlBlock, t]); // prettier-ignore

  // ── Edit ────────────────────────────────────────────────────────────

  const startEdit = useCallback(
    (file: VaultFile) => {
      setDraft(null);
      setEditingFile(file);
      const stripped = stripMetaLines(file.content);
      setEditContent(
        file.directory === "golden_queries"
          ? extractSqlFromBlock(stripped)
          : stripped,
      );
    },
    [stripMetaLines, extractSqlFromBlock],
  );

  const handleSaveEdit = useCallback(async () => {
    if (!editingFile) return;
    const trimmed = editContent.trim();

    if (!trimmed) {
      toast.error(t("vault.contentRequired"));
      return;
    }

    const title =
      editingFile.title ||
      editingFile.path?.split("/").pop()?.replace(".md", "") ||
      "";
    const author = editingFile.author || userEmail;
    const lines: string[] = [];

    if (title) lines.push(`# ${title}`, "");
    if (author) lines.push(`**Author:** ${author}`, "");
    const body =
      editingFile.directory === "golden_queries"
        ? wrapSqlBlock(editContent)
        : editContent;
    lines.push(body);
    const finalContent = lines.join("\n");

    setSaving(true);
    try {
      const res = await vaultWrite(orgdbId, editingFile.path, finalContent);

      if (res.ok) {
        toast.success(t("vault.fileUpdated"));
        const savedPath = editingFile.path;
        setEditingFile(null);
        await loadVault();
        try {
          const updated = await vaultRead(orgdbId, savedPath);
          setSelectedFile(updated);
        } catch {
          setSelectedFile(null);
        }
      } else {
        toast.error(res.error || t("vault.saveFailed"));
      }
    } catch {
      toast.error(t("vault.saveFailed"));
    } finally {
      setSaving(false);
    }
  }, [
    editingFile,
    editContent,
    userEmail,
    orgdbId,
    loadVault,
    wrapSqlBlock,
    t,
  ]);

  const cancelEdit = useCallback(() => setEditingFile(null), []);

  // ── Delete ──────────────────────────────────────────────────────────

  const handleDeleteFile = useCallback((path: string) => {
    setFileToDelete(path);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!fileToDelete) return;
    try {
      const res = await vaultDelete(orgdbId, fileToDelete);

      if (res.ok) {
        toast.success(t("vault.fileDeleted"));
        if (selectedFile?.path === fileToDelete) setSelectedFile(null);
        if (editingFile?.path === fileToDelete) setEditingFile(null);
        await loadVault();
      } else {
        toast.error(res.error || t("vault.deleteFailed"));
      }
    } catch {
      toast.error(t("vault.deleteFailed"));
    } finally {
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    }
  }, [fileToDelete, orgdbId, selectedFile, editingFile, loadVault, t]);

  // ── Sidebar ─────────────────────────────────────────────────────────

  const toggleDir = useCallback((dir: string) => {
    setCollapsedDirs((prev) => {
      const next = new Set(prev);

      if (next.has(dir)) next.delete(dir);
      else next.add(dir);
      return next;
    });
  }, []);

  const value: VaultContextValue = {
    orgdbId,
    userEmail,
    status,
    loading,
    filesByDir,
    auditHistory,
    auditLoading,
    loadAuditHistory,
    selectedFile,
    selectFile,
    clearSelection,
    editingFile,
    editContent,
    setEditContent,
    startEdit,
    handleSaveEdit,
    cancelEdit,
    draft,
    setDraft,
    saving,
    handleNewFile,
    handleSaveDraft,
    slugify,
    searchQuery,
    setSearchQuery,
    searchResults,
    searchLoading,
    clearSearch,
    deleteDialogOpen,
    setDeleteDialogOpen,
    handleDeleteFile,
    confirmDelete,
    collapsedDirs,
    toggleDir,
    showAudit,
    setShowAudit,
    overlayPanel,
    toggleOverlay,
    isReadOnlyDir,
    stripMetaLines,
    loadVault,
    refreshFiles,
  };

  return <VaultCtx.Provider value={value}>{children}</VaultCtx.Provider>;
};
