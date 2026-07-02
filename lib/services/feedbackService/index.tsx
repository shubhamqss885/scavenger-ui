import { getAxiosInstance } from "@/lib/services/axiosInstances";

interface FeedbackData {
  user_email: string;
  user_name: string;
  feedback_content: string;
}

interface FeedbackResponse {
  status_code: number;
  message: string;
  data: {
    user_sub: string;
    user_session_id: string;
    user_email: string;
    user_name: string;
    feedback_content: string;
    created_at: string;
  };
}

export const submitFeedback = async (
  feedbackData: FeedbackData,
): Promise<FeedbackResponse> => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.get("/project/feedback_form", {
    params: feedbackData,
  });
  return response.data;
};
