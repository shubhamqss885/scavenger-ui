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
import type { ReactNode } from "react";

type AlertDialogWithoutTriggerProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  title: string;
  description: ReactNode;
  cancelText: string;
  actionText: string;
  onCancel: () => void;
  onAction: () => void;
};

export function AlertDialogWithoutTrigger({
  isOpen,
  setIsOpen,
  title,
  description,
  cancelText,
  actionText,
  onCancel,
  onAction,
}: Readonly<AlertDialogWithoutTriggerProps>) {
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="space-y-4 mb-2">
          <AlertDialogTitle className="text-2xl font-bold leading-tight text-center">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction onClick={onAction}>{actionText}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
