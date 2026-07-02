"use client";

import { EmptyState } from "@/components/blocks/EmptyState";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

type ProfilerEmptyStateProps = Readonly<{
  title: string;
  subtitle: string;
  buttonLabel: string;
  onButtonClick: () => void;
  buttonVariant?: "default" | "outline";
}>;

export const ProfilerEmptyState = ({
  title,
  subtitle,
  buttonLabel,
  onButtonClick,
  buttonVariant = "default",
}: ProfilerEmptyStateProps) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <EmptyState icon={AlertTriangle} title={title} subtitle={subtitle} />
      <div className="flex justify-center">
        <Button onClick={onButtonClick} variant={buttonVariant}>
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
};
