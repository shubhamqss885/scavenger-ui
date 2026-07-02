"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type MaximizeBackdropProps = Readonly<{
  onClose: () => void;
  className?: string;
}>;

export const MaximizeBackdrop = ({
  onClose,
  className,
}: MaximizeBackdropProps) => {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Body scroll lock + global Escape key handler
  useEffect(() => {
    document.body.style.overflow = "hidden";

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Close maximized view"
      className={cn("fixed inset-0 z-[60] bg-black/70", className)}
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClose();
      }}
    />
  );
};
