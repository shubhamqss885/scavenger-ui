import React from "react";
import { ChatMessage } from "../../types";
import { MessageBubble } from "./MessageBubble";

type UserMessageProps = Readonly<{
  message: ChatMessage;
}>;

const UserMessage = ({ message }: UserMessageProps) => (
  <div className="mb-6 mr-auto">
    {message.userName && (
      <p className="mb-1 text-xs font-medium text-muted-foreground">
        {message.userName}
      </p>
    )}
    <MessageBubble variant="user">
      <p className="whitespace-pre-wrap">{message.text}</p>
    </MessageBubble>
  </div>
);

export default React.memo(UserMessage);
