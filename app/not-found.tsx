"use client";

import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";
import { EmptyState } from "@/components/blocks/EmptyState";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[400px] p-6 pt-0">
      <EmptyState
        icon={FileQuestion}
        iconClassName="h-12 w-12 text-slate-400"
        title="Page not found"
        subtitle="Sorry, we couldn't find the page you're looking for."
        variant="error"
      />
      <Link href="/home" className="mt-4">
        <Button variant="outline">Go to Home</Button>
      </Link>
    </div>
  );
}
