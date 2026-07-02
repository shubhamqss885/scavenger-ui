"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";
import type { TestStatus, TestWarning } from "./useTestConnection";

type Props = Readonly<{
  testStatus: TestStatus;
  testError: string | null;
  testHint: string | null;
  testDetailsOpen: boolean;
  setTestDetailsOpen: (open: boolean) => void;
  testWarnings: TestWarning[];
  validationError?: string | null;
}>;

export const ConnectorTestResult = ({
  testStatus,
  testError,
  testHint,
  testDetailsOpen,
  setTestDetailsOpen,
  testWarnings,
  validationError,
}: Props): ReactNode => {
  const { t } = useTranslation("connectors");

  if (validationError) {
    return (
      <motion.div
        key="validation-error"
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="mt-1 flex items-start gap-1.5"
      >
        <Icon
          name="XCircle"
          size="xxs"
          className="mt-0.5 shrink-0 text-red-500"
        />
        <span className="text-[11px] text-red-700">{validationError}</span>
      </motion.div>
    );
  }

  if (testStatus === "success") {
    return (
      <motion.div
        key="test-success"
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="mt-1 flex flex-col gap-1"
      >
        <div className="flex items-center gap-1.5">
          <Icon name="CheckCircle2" size="xxs" className="text-green-600" />
          <span className="text-[11px] font-medium text-green-700">
            {t("test.success")}
          </span>
        </div>
        {testWarnings.map((w, i) => (
          <div key={i} className="flex items-start gap-1.5">
            <Icon
              name="AlertTriangle"
              size="xxs"
              className="mt-0.5 shrink-0 text-amber-500"
            />
            <span className="text-[11px] text-amber-700">
              {w.hint ?? w.message}
            </span>
          </div>
        ))}
      </motion.div>
    );
  }

  if (testStatus === "failed") {
    return (
      <motion.div
        key="test-failed"
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="mt-1 flex flex-col gap-1"
      >
        <div className="flex items-start gap-1.5">
          <Icon
            name="XCircle"
            size="xxs"
            className="mt-0.5 shrink-0 text-red-500"
          />
          <span className="text-[11px] text-red-700">
            {testHint ?? testError}
          </span>
        </div>
        {testHint && testError && (
          <Collapsible open={testDetailsOpen} onOpenChange={setTestDetailsOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="ml-[18px] flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
              >
                <Icon
                  name="ChevronDown"
                  className={cn(
                    "h-2.5 w-2.5 min-w-0 transition-transform",
                    testDetailsOpen && "rotate-180",
                  )}
                />
                {t("test.details")}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <p className="ml-[18px] mt-1 font-mono text-[10px] leading-relaxed text-muted-foreground">
                {testError}
              </p>
            </CollapsibleContent>
          </Collapsible>
        )}
      </motion.div>
    );
  }

  return null;
};
