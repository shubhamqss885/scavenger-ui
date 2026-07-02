import { getAxiosInstance } from "@/lib/services/axiosInstances";

type dataType = {
  model_result_uuid: string;
  feedback_type: string;
  feedback: string;
  feedback_comment?: string;
};

export const sendResponseFeedback = async (data: dataType) => {
  const axiosInstance = getAxiosInstance();
  const filteredData: Record<string, string> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      filteredData[key] = String(value);
    }
  });
  const params = new URLSearchParams(filteredData).toString();
  const response = await axiosInstance.post(`/llm/llm_feedback?${params}`);
  return response;
};
