import React from "react";
import { Chat } from "@/components/ui/typography";

interface ChatBubbleProps {
  message: string;
  position: "left" | "right";
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  position,
}) => {
  return (
    <div
      className={`flex justify-${position === "right" ? "end" : "start"} mb-4`}
    >
      <div
        className={`flex flex-col gap-1 rounded-[24px] border px-6 py-3 z-10 max-w-[90%]
          ${
            position === "right"
              ? "rounded-br-none bg-slate-100 dark:bg-slate-800"
              : "rounded-bl-none"
          }`}
      >
        <Chat className="leading-snug">{message}</Chat>
      </div>
    </div>
  );
};
