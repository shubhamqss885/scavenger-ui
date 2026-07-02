import { Dispatch, SetStateAction, useCallback } from "react";
import { useTranslation } from "@/lib/i18n/client";
import { ChatMessage, PendingClarification, ProgressStep } from "../types";
import { AgenticChatAction } from "../agenticChatReducer";

type UseClarificationParams = Readonly<{
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  dispatch: Dispatch<AgenticChatAction>;
  // Sends the answer on the existing session WS. Returns false if the WS
  // is closed (e.g., restored from REST history after refresh) — caller uses
  // sendWsMessage to continue from the persisted clarification state.
  // `displayedAnswer` is the user-visible text (without the BE wrapper).
  sendClarificationAnswer: (
    formattedAnswer: string,
    displayedAnswer: string,
  ) => boolean;
  setProgressSteps: Dispatch<SetStateAction<ProgressStep[]>>;
  setIsStreaming: Dispatch<SetStateAction<boolean>>;
  pendingClarification: PendingClarification | null;
  setPendingClarification: Dispatch<
    SetStateAction<PendingClarification | null>
  >;
  selectedOptions: Set<string>;
  setSelectedOptions: Dispatch<SetStateAction<Set<string>>>;
  setClarificationCollapsed: Dispatch<SetStateAction<boolean>>;
  sendWsMessage: (query: string, opts?: { skipUserMessage?: boolean }) => void;
}>;

export const useClarification = ({
  input,
  setInput,
  dispatch,
  sendClarificationAnswer,
  setProgressSteps,
  setIsStreaming,
  pendingClarification,
  setPendingClarification,
  selectedOptions,
  setSelectedOptions,
  setClarificationCollapsed,
  sendWsMessage,
}: UseClarificationParams) => {
  const { t } = useTranslation("agentic-chat");

  const handleClarificationResponse = useCallback(
    (answer: string) => {
      if (!pendingClarification) return;

      const formattedAnswer = `Response of Clarification Question: ${pendingClarification.question} IS Answer: ${answer}`;

      // Try to send on the existing WS first. If the session is closed
      // (timed out while detached, or restored from REST history without
      // a live socket), fall back to opening a new run.
      const sentOnLiveSocket = sendClarificationAnswer(formattedAnswer, answer);

      if (!sentOnLiveSocket) {
        dispatch({
          type: "COMPLETE_CLARIFICATION",
          payload: {
            requestId: pendingClarification.requestId,
            question: pendingClarification.question,
            answer,
            options: pendingClarification.options,
            inputReceivedLabel: t("status.inputReceived"),
          },
        });
        setSelectedOptions(new Set());
        setClarificationCollapsed(false);
        setPendingClarification(null);
        sendWsMessage(formattedAnswer, { skipUserMessage: true });
        return;
      }

      const answerMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        text: answer,
        inflight: true,
      };
      const agentMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "agent",
        text: "",
        inflight: true,
      };

      dispatch({
        type: "SUBMIT_CLARIFICATION",
        payload: {
          userMessage: answerMsg,
          agentMessage: agentMsg,
          inputReceivedLabel: t("status.inputReceived"),
        },
      });

      // Reset React state for the next agent round. Store-side state is
      // reset inside sendClarificationAnswer.
      setProgressSteps([]);
      setIsStreaming(true);
      setSelectedOptions(new Set());
      setClarificationCollapsed(false);
      setPendingClarification(null);
    },
    [
      pendingClarification,
      sendClarificationAnswer,
      dispatch,
      t,
      setProgressSteps,
      setIsStreaming,
      setSelectedOptions,
      setClarificationCollapsed,
      setPendingClarification,
      sendWsMessage,
    ],
  );

  const handleOptionClick = useCallback(
    (option: string) => {
      if (!pendingClarification) return;

      if (pendingClarification.allowMultiple) {
        setSelectedOptions((prev) => {
          const next = new Set(prev);

          if (next.has(option)) next.delete(option);
          else next.add(option);
          return next;
        });
      } else {
        handleClarificationResponse(option);
      }
    },
    [pendingClarification, handleClarificationResponse, setSelectedOptions],
  );

  const submitClarification = useCallback(() => {
    const parts: string[] = [];

    if (selectedOptions.size > 0)
      parts.push(Array.from(selectedOptions).join(", "));
    if (input.trim()) parts.push(input.trim());
    const answer = parts.length > 0 ? parts.join(", ") : null;

    if (!answer) return;
    handleClarificationResponse(answer);
    setInput("");
  }, [selectedOptions, input, handleClarificationResponse, setInput]);

  return { handleOptionClick, submitClarification } as const;
};
