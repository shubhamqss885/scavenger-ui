import type { ComponentType } from "react";
import { useContextSelector } from "use-context-selector";
import type { ProgressStep, SqlBlock } from "../../types";
import type { ToolMeta, ToolCategory } from "../../toolMeta";
import { getToolMeta } from "../../toolMeta";
import { toChartBlock, toSqlBlock } from "../../utils";
import { SqlCodeBlock } from "../tools/SqlCodeBlock";
import { ChartChip } from "../tools/ChartChip";
import { VaultChip } from "../tools/VaultChip";
import { VaultWriteChip } from "../tools/VaultWriteChip";
import { ToolChip } from "../tools/ToolChip";
import { WebSearchChip } from "../tools/WebSearchChip";
import { ClarificationStep } from "../tools/ClarificationStep";
import MarkdownContent from "./MarkdownContent";
import { AgenticChatContext } from "../../AgenticChatContext";

// Shared props — every wrapper accepts this, destructures what it needs

type StepRendererProps = Readonly<{
  step: ProgressStep;
  meta: ToolMeta;
  onSqlBlockClick: (block: SqlBlock, tab?: "table" | "sql") => void;
  isLastAgentMessage?: boolean;
  onSendQuery?: (query: string) => void;
  isFirst?: boolean;
  isLast?: boolean;
}>;

// Wrappers — thin adapters that own their own fallback logic

const HiddenStep = () => null;

// Live clarifications render in the input bar, not in the message thread.
// Only history-loaded answered clarifications carry clarificationData.
const ClarificationRenderer = ({ step }: StepRendererProps) => {
  if (!step.clarificationData) return null;
  return <ClarificationStep data={step.clarificationData} />;
};

const TextStep = ({ step, meta }: StepRendererProps) => {
  if (!step.toolOutput?.raw) return <ToolChip step={step} meta={meta} />;
  return (
    <MarkdownContent className="text-sm">{step.toolOutput.raw}</MarkdownContent>
  );
};

const ChartStep = ({
  step,
  isLastAgentMessage,
  onSendQuery,
  isFirst,
  isLast,
}: StepRendererProps) => (
  <ChartChip
    block={toChartBlock(step)}
    toolCallId={step.id}
    needsFetch={step.toolOutput?.chartSpec === null}
    isError={step.toolOutput?.isError}
    isCancelled={step.status === "cancelled"}
    title={step.toolOutput?.chartSpec?.title || step.message}
    durationMs={step.durationMs}
    showCorrection={isLastAgentMessage}
    onSendCorrection={onSendQuery}
    isFirst={isFirst}
    isLast={isLast}
  />
);

const VaultWriteStep = ({ step }: StepRendererProps) => {
  const checkAndOpenVaultApproval = useContextSelector(
    AgenticChatContext,
    (ctx) => ctx?.checkAndOpenVaultApproval,
  );
  return (
    <VaultWriteChip
      toolName={step.tool}
      toolInput={step.toolInput}
      toolResult={step.toolOutput?.raw}
      isLoading={step.status === "calling"}
      vaultWriteStatus={step.toolOutput?.vaultWriteStatus}
      onCheckAndOpenModal={checkAndOpenVaultApproval}
    />
  );
};

// Prefers structured vaultBlock from WS, falls back to synthetic block
const VaultReadStep = ({ step, isFirst, isLast }: StepRendererProps) => {
  if (step.toolOutput?.vaultBlock) {
    return (
      <VaultChip
        block={step.toolOutput.vaultBlock}
        isFirst={isFirst}
        isLast={isLast}
      />
    );
  }
  return (
    <VaultChip
      block={{
        tool: step.tool,
        input: (step.toolInput as Record<string, string>) ?? {},
        output: step.toolOutput?.raw ?? "",
        durationMs: step.durationMs,
      }}
      isLoading={step.status === "calling"}
      isFirst={isFirst}
      isLast={isLast}
    />
  );
};

// Falls back to ToolChip when toolInput.sql is missing (e.g. still calling)
const SqlStep = ({
  step,
  meta,
  onSqlBlockClick,
  isFirst,
  isLast,
}: StepRendererProps) => {
  const sqlBlock = toSqlBlock(step);

  if (!sqlBlock)
    return (
      <ToolChip step={step} meta={meta} isFirst={isFirst} isLast={isLast} />
    );
  return (
    <SqlCodeBlock
      block={sqlBlock}
      onOpenSheet={(tab) => onSqlBlockClick(sqlBlock, tab)}
      isFirst={isFirst}
      isLast={isLast}
    />
  );
};

const GenericStep = ({ step, meta, isFirst, isLast }: StepRendererProps) => (
  <ToolChip step={step} meta={meta} isFirst={isFirst} isLast={isLast} />
);

const WebSearchStep = ({ step, isFirst, isLast }: StepRendererProps) => (
  <WebSearchChip step={step} isFirst={isFirst} isLast={isLast} />
);

// Category → component map (TypeScript enforces exhaustiveness)

const RENDERERS: Record<ToolCategory, ComponentType<StepRendererProps>> = {
  hidden: HiddenStep,
  text: TextStep,
  chart: ChartStep,
  clarification: ClarificationRenderer,
  "vault-write": VaultWriteStep,
  "vault-read": VaultReadStep,
  sql: SqlStep,
  file: GenericStep,
  generic: GenericStep,
  "web-search": WebSearchStep,
};

// Dispatcher

type MessageStepRendererProps = Readonly<{
  step: ProgressStep;
  onSqlBlockClick: (block: SqlBlock, tab?: "table" | "sql") => void;
  isLastAgentMessage?: boolean;
  onSendQuery?: (query: string) => void;
  isFirst?: boolean;
  isLast?: boolean;
}>;

const MessageStepRenderer = ({ step, ...props }: MessageStepRendererProps) => {
  const meta = getToolMeta(step.tool);
  const Renderer = RENDERERS[meta.category];
  return <Renderer step={step} meta={meta} {...props} />;
};

export default MessageStepRenderer;
