import { useState } from "react";
import { toast } from "sonner";
import { sendResponseFeedback } from "@/lib/services/chatService";
import { FEEDBACK_TYPES } from "./constants";
import { useTranslation } from "@/lib/i18n/client";

const useFeedback = () => {
  const { t } = useTranslation("feedback");
  const [isLoading, setIsLoading] = useState(false);

  const sendFeedback = async (modelResultUUID: string, feedback: string) => {
    try {
      setIsLoading(true);
      const response = await sendResponseFeedback({
        model_result_uuid: modelResultUUID,
        feedback_type: FEEDBACK_TYPES.CHAT,
        feedback: feedback,
      });

      toast.success(
        String(
          t(`serverMessages.${response.data.message}`, response.data.message),
        ),
      );
    } catch (error) {
      console.error("Failed to send response feedback:", error);
      toast.error("An error occurred during feedback sending.");
    } finally {
      setIsLoading(false);
    }
  };

  const sendFeedbackComment = async (
    modelResultUUID: string,
    feedbackComment: string,
  ) => {
    try {
      setIsLoading(true);
      const response = await sendResponseFeedback({
        model_result_uuid: modelResultUUID,
        feedback_type: FEEDBACK_TYPES.CHAT,
        feedback: "-1",
        feedback_comment: feedbackComment,
      });

      toast.success(
        String(
          t(`serverMessages.${response.data.message}`, response.data.message),
        ),
      );
    } catch (error) {
      console.error("Failed to send response feedback:", error);
      toast.error("An error occurred during feedback sending.");
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, sendFeedback, sendFeedbackComment };
};

export default useFeedback;
