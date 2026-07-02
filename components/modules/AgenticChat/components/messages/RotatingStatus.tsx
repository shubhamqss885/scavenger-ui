"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/client";

// Maps raw backend STATUS_MESSAGES strings to i18n keys.
// Unknown strings fall through and display as-is (raw English).
const STATUS_KEY: Record<string, string> = {
  "Connecting to database...": "status.connectingToDatabase",
  "Establishing connection...": "status.establishingConnection",
  "Setting up secure connection...": "status.settingUpSecureConnection",
  "Loading database schema...": "status.loadingDatabaseSchema",
  "Reading table definitions...": "status.readingTableDefinitions",
  "Analyzing database structure...": "status.analyzingDatabaseStructure",
  "Loading context vault...": "status.loadingContextVault",
  "Syncing rules and golden queries...": "status.syncingRules",
  "Preparing knowledge base...": "status.preparingKnowledgeBase",
  "Initializing session...": "status.initializingSession",
  "Preparing workspace...": "status.preparingWorkspace",
  "Setting up agent...": "status.settingUpAgent",
  loading: "status.loading",
  "Thinking...": "status.thinking",
  "Analyzing your question...": "status.analyzingQuestion",
  "Working on it...": "status.workingOnIt",
  "Processing...": "status.processing",
  "Considering options...": "status.consideringOptions",
  // tool_executing phase
  "Executing...": "status.executing",
  "Working...": "status.working",
  "Almost there...": "status.almostThere",
  // tool-specific messages
  "Running query...": "status.runningQuery",
  "Fetching results...": "status.fetchingResults",
  "Processing data...": "status.processingData",
  "Reading schema...": "status.readingSchema",
  "Analyzing tables...": "status.analyzingTables",
  "Loading definitions...": "status.loadingDefinitions",
  "Sampling rows...": "status.samplingRows",
  "Fetching sample...": "status.fetchingSample",
  "Counting rows...": "status.countingRows",
  "Generating chart...": "status.generatingChart",
  "Rendering visualization...": "status.renderingVisualization",
  "Building chart...": "status.buildingChart",
  "Searching vault...": "status.searchingVault",
  "Scanning files...": "status.scanningFiles",
  "Reading file...": "status.readingFile",
  "Loading content...": "status.loadingContent",
  "Testing connection...": "status.testingConnection",
  "Verifying access...": "status.verifyingAccess",
  "Checking connectivity...": "status.checkingConnectivity",
  // progress "calling" messages (use unicode ellipsis to match backend)
  "Inspecting database…": "status.inspectingDatabase",
  "Reading database schema…": "status.readingSchema",
  "Running SQL query…": "status.runningQuery",
  "Sampling data…": "status.samplingData",
  "Counting rows…": "status.countingRows",
  "Listing tables…": "status.listingTables",
  "Asking for clarification…": "status.askingQuestion",
  "Saving golden query…": "status.savingGoldenQuery",
  "Sending to Slack…": "status.sendingToSlack",
  "Sending to Teams…": "status.sendingToTeams",
  "Reading vault file…": "status.readingVaultFile",
  "Vault Health": "status.vaultHealth",
  "Saving vault rule…": "status.savingVaultRule",
  "Saving glossary entry…": "status.savingGlossaryEntry",
  "Validating database connection…": "status.validatingConnection",
  "Registering database in platform…": "status.registeringDatabase",
  "Working…": "status.working",
};

type RotatingStatusProps = Readonly<{
  active: boolean;
  statusMessage?: string | null;
}>;

const RotatingStatus = ({ active, statusMessage }: RotatingStatusProps) => {
  const { t } = useTranslation("agentic-chat");

  if (!active) return null;

  const displayText = statusMessage
    ? STATUS_KEY[statusMessage]
      ? t(STATUS_KEY[statusMessage])
      : statusMessage
    : t("status.thinking");

  return (
    <div className="flex items-center gap-2 py-1 text-sm text-slate-400">
      <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-primary" />
      <span className="relative inline-grid">
        <AnimatePresence initial={false}>
          <motion.span
            key={displayText}
            className="col-start-1 row-start-1 whitespace-nowrap"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: { duration: 0.3, delay: 0.2, ease: "easeOut" },
            }}
            exit={{
              opacity: 0,
              transition: { duration: 0.25, ease: "easeIn" },
            }}
          >
            {displayText}
          </motion.span>
        </AnimatePresence>
      </span>
    </div>
  );
};

export default React.memo(RotatingStatus);
