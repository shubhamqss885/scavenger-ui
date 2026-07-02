import { getAxiosInstance } from "@/lib/services/axiosInstances";

const dashboardUrls = {
  getDashboardStats: "/project/dashboard_stats",
};

export const getDashboardStatsData = async () => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.get(dashboardUrls.getDashboardStats);
  return response.data;
};
