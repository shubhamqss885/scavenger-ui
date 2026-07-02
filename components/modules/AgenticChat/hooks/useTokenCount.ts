import { useMemo } from "react";
import { ChatMessage } from "../types";

const CHARS_PER_TOKEN = 4;
// Based on real fraenk agentic data: ~3.5k visible chars/turn,
// plus system prompt (~2k tokens) + schema (~5k tokens) + tool I/O overhead (~2x visible).
// 20 turns ≈ 7k base + 20 × ~2.5k effective tokens ≈ 57k tokens.
const ESTIMATED_CAPACITY_TOKENS = 57_000;

export const useTokenCount = (messages: ChatMessage[]) => {
  return useMemo(() => {
    let totalChars = 0;
    for (const msg of messages) {
      totalChars += msg.text.length;
      if (msg.steps) {
        for (const step of msg.steps) {
          totalChars += step.message?.length ?? 0;
          // Tool input (SQL, table names, params)
          if (step.toolInput) {
            totalChars += JSON.stringify(step.toolInput).length;
          }
          // Tool output text
          totalChars += step.toolOutput?.raw?.length ?? 0;
          // Table data rows (SQL results are heavy context)
          if (step.toolOutput?.tableData) {
            totalChars += JSON.stringify(step.toolOutput.tableData).length;
          }
        }
      }
    }
    const estimatedTokens = Math.ceil(totalChars / CHARS_PER_TOKEN);
    const usage = Math.min(estimatedTokens / ESTIMATED_CAPACITY_TOKENS, 1);
    return { tokenCount: estimatedTokens, usage };
  }, [messages]);
};
