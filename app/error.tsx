"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/blocks/EmptyState";

type ErrorProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function DataSourceError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Data source error:", error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[400px] p-6 pt-0">
      <EmptyState
        icon={AlertTriangle}
        iconClassName="h-12 w-12 text-red-400"
        title="Something went wrong!"
        subtitle={
          error.message ||
          "An unexpected error occurred while loading the data source."
        }
        variant="error"
      />
      <Button onClick={reset} variant="outline" className="mt-4">
        Try again
      </Button>
    </div>
  );
}
