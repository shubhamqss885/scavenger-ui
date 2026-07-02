"use client";

import { Button } from "@/components/ui/button";
import { Database } from "lucide-react";
import { EmptyState } from "@/components/blocks/EmptyState";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/client";

export default function NotFound() {
  const { t } = useTranslation("database");

  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[400px] p-6 pt-0">
      <EmptyState
        icon={Database}
        iconClassName="h-12 w-12 text-slate-400"
        title={t("page.errors.notFound")}
        subtitle={t("page.errors.notFoundDesc")}
        variant="error"
      />
      <Link href="/home" className="mt-4">
        <Button variant="outline">{t("page.errors.goHome")}</Button>
      </Link>
    </div>
  );
}
