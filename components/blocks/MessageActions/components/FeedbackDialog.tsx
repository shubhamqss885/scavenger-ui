import { FC, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Small, Subtle } from "@/components/ui/typography";
import { useTranslation } from "@/lib/i18n/client";

interface IFeedbackDialog {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (comment: string) => void;
  reasonLabel?: string;
  reasonDescription?: string;
}

const FeedbackDialog: FC<IFeedbackDialog> = ({
  isOpen,
  onClose,
  onSubmit,
  reasonLabel,
  reasonDescription,
}) => {
  const { t } = useTranslation("agentic-chat");
  const { t: tCommon } = useTranslation("common");
  const [comment, setComment] = useState("");
  const trimmedComment = comment.trim();

  // Reset comment when dialog opens
  useEffect(() => {
    if (isOpen) {
      setComment("");
    }
  }, [isOpen]);

  const handleSubmit = () => {
    // Format: "{label}: {comment}" or just "{label}" if no additional text
    let formattedComment = trimmedComment;
    if (reasonLabel) {
      formattedComment = trimmedComment
        ? `${reasonLabel}: ${trimmedComment}`
        : reasonLabel;
    }
    onSubmit(formattedComment);
    setComment("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] gap-0">
        <DialogHeader className="space-y-3">
          <DialogTitle>{t("feedback.dialog.title")}</DialogTitle>

          {/* Guidance text */}
          <Small className="font-normal text-[13px] leading-tight">
            {reasonDescription || t("feedback.dialog.description")}
          </Small>

          {reasonLabel && (
            <Subtle className="font-semibold uppercase">{reasonLabel}:</Subtle>
          )}
        </DialogHeader>
        <div className="mt-2 mb-4">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("feedback.dialog.placeholder")}
            className="min-h-20 py-2 mt-0"
            maxLength={250}
          />
          <Subtle className="float-right text-[10px]">
            {trimmedComment.length}/250 {t("feedback.dialog.charactersCount")}
          </Subtle>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {tCommon("buttons.cancel")}
          </Button>
          <Button onClick={handleSubmit}>{tCommon("buttons.submit")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackDialog;
