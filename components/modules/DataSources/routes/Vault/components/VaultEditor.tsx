"use client";

import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/lib/i18n/client";
import { useVault } from "../context/VaultContext";

export const VaultCreateForm = () => {
  const { t } = useTranslation("database");
  const { draft, setDraft, saving, handleSaveDraft, slugify } = useVault();

  if (!draft) return null;

  return (
    <div className="space-y-4 p-6">
      <Input
        className="h-10 border-none px-0 text-base font-semibold shadow-none focus-visible:ring-0"
        placeholder={t("vault.titlePlaceholder")}
        value={draft.title}
        onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        autoFocus
      />
      {draft.title.trim() && !slugify(draft.title) && (
        <p className="text-xs text-destructive">
          {t("vault.titleMustContainAlphanumeric")}
        </p>
      )}
      <Textarea
        className="min-h-[300px] resize-none font-mono text-sm"
        placeholder={t("vault.contentPlaceholder")}
        value={draft.content}
        onChange={(e) => setDraft({ ...draft, content: e.target.value })}
      />
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={handleSaveDraft}
          disabled={saving || (!!draft.title.trim() && !slugify(draft.title))}
        >
          {saving && (
            <Icon
              name="Loader2"
              size="xs"
              className="mr-1.5 animate-spin"
              variant="white"
            />
          )}
          <Icon name="Save" size="xs" className="mr-1.5" variant="white" />
          {t("vault.create")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDraft(null)}
          disabled={saving}
        >
          {t("vault.cancel")}
        </Button>
      </div>
    </div>
  );
};

export const VaultEditForm = () => {
  const { t } = useTranslation("database");
  const {
    editingFile,
    editContent,
    setEditContent,
    saving,
    handleSaveEdit,
    cancelEdit,
  } = useVault();

  if (!editingFile) return null;

  return (
    <div className="w-full space-y-4 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold">
            {editingFile.title ||
              editingFile.path?.split("/").pop() ||
              t("vault.untitled")}
          </h3>
        </div>
      </div>
      <Textarea
        className="min-h-[300px] resize-none font-mono text-sm"
        value={editContent}
        onChange={(e) => setEditContent(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleSaveEdit} disabled={saving}>
          {saving && (
            <Icon
              name="Loader2"
              size="xs"
              className="mr-1.5 animate-spin"
              variant="white"
            />
          )}
          <Icon name="Save" size="xs" className="mr-1.5" variant="white" />
          {t("vault.save")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={cancelEdit}
          disabled={saving}
        >
          {t("vault.cancel")}
        </Button>
      </div>
    </div>
  );
};
