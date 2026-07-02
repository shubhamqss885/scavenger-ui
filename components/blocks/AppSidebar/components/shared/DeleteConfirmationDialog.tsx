import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

type DeleteConfirmationDialogProps = Readonly<{
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void | Promise<void>;
  confirmText?: string;
  cancelText?: string;
  deletingText?: string;
  isLoading?: boolean;
}>;

export function DeleteConfirmationDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = "Delete",
  cancelText = "Cancel",
  deletingText = "Deleting...",
  isLoading = false,
}: DeleteConfirmationDialogProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="h-226 p-6 shadow-md rounded-lg border border-gray-300 gap-1.5">
        <form onSubmit={handleSubmit}>
          <DialogTitle className="leading-7">{title}</DialogTitle>
          <p className="text-slate-500 text-sm font-normal leading-6 break-words mb-3">
            {description}
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
            <Button
              type="submit"
              variant="destructive"
              className="px-5 min-w-44"
              autoFocus
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Icon
                    name="Loader2"
                    size="xs"
                    className="mr-1.5 animate-spin"
                    variant="white"
                  />
                  {deletingText}
                </>
              ) : (
                <>
                  <Icon
                    name="Trash2"
                    size="xs"
                    className="mr-1.5"
                    variant="white"
                  />
                  {confirmText}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
