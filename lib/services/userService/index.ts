import { getAxiosInstance } from "@/lib/services/axiosInstances";

export type UserData = {
  id: number;
  user_name: string;
  sub: string;
  model: string;
  profile_image_url: string | null;
  theme: string;
  company_name: string;
  job_title: string;
  email: string;
  business_email: string;
  statistical_knowledge: string | null;
  payment_method: string;
  user_region: string;
  newsletter_subscription: string;
  created_at: string;
  selected_industry: string;
  chosen_model: string;
  terms_accepted: boolean;
  terms_accepted_at: string;
  user_role_name:
    | "org-user"
    | "org-viewer"
    | "org-admin"
    | "super-admin"
    | "testing"
    | "external-user"
    | "demo-user"
    | "private-user";
  is_blocked: boolean;
  locale?: string;
  subscription?: {
    status: string;
    subscription_id: string;
    is_active: boolean;
    plan_name: string;
    next_billing_date: string | null;
    cancelled_at: string | null;
    subscribed_at: string | null;
  };
};

//Not used yet
export const getUserProfile = async () => {
  const axiosInstance = getAxiosInstance();

  if (!axiosInstance) throw new Error("Axios instance not available");
  const response = await axiosInstance.get("/project/user-profile");
  return response.data;
};

//Not used yet
export const getUserPreferences = async () => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.get("/project/user-preferences");
  return response.data;
};

export const registerUser = async () => {
  const axiosInstance = getAxiosInstance();
  const res = await axiosInstance.post("/project/register");
};

export const getUserData = async () => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.get("/project/get_user_profile", {
    headers: { accept: "application/json" },
  });
  // console.log(response);
  return response;
};

export const updateAccountSettings = async (data: Partial<UserData>) => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.put(
    "/project/update_user_profile",
    data,
  );
  return response;
};

export const uploadProfileImage = async (file: File) => {
  const axiosInstance = getAxiosInstance();
  const formData = new FormData();
  formData.append("file", file);
  const response = await axiosInstance.put(
    "/project/add_profile_image", //TODO: change this to /project/update_user_profile??
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
};

export const deleteUserProfile = async () => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.delete("/project/delete_user_profile");
  return response;
};

export const deleteUserData = async () => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.delete("project/delete_user_data");
  return response;
};

export const requestPasswordReset = async () => {
  const response = await fetch("/api/auth/update-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to send password reset email");
  }

  return await response.json();
};

export const sendVerificationEmail = async () => {
  const response = await fetch("/api/auth/send-verification", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to send verification email");
  }

  return await response.json();
};
