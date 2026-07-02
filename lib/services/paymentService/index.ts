import { getAxiosInstance } from "@/lib/services/axiosInstances";

export type PlanType = "monthly" | "yearly";

export interface CreateCheckoutSessionRequest {
  plan_type: PlanType;
  customer_email: string;
  success_url: string;
  cancel_url: string;
}

export interface CreateCheckoutSessionResponse {
  stripe_session_id: string;
  stripe_session_url: string;
  message: string;
}

export interface CheckoutErrorResponse {
  detail: string;
}

export interface SubscriptionStatusResponse {
  data: {
    subscription: {
      status: string;
      subscription_id: string;
      is_active: boolean;
    };
    plan: {
      plan_id: string;
      plan_name: string;
    };
    billing: {
      next_billing_date: string | null;
      cancelled_at: string | null;
      subscribed_at: string | null;
    };
  };
  message: string;
}

export interface CancelSubscriptionRequest {
  subscription_id: string;
}

export interface CancelSubscriptionResponse {
  data: {
    plan: {
      plan_id: string;
      plan_name: string;
    };
    cancellation: {
      effective_date: string;
    };
  };
  message: string;
}

export interface CreateBillingPortalSessionRequest {
  return_url: string;
}

export interface CreateBillingPortalSessionResponse {
  message: string;
  portal_url: string;
}

export interface PaymentApiError {
  detail?: string;
  message?: string;
  status_code?: number;
}

export type PaymentServiceResponse<T> = {
  success: boolean;
  data?: T;
  error?: PaymentApiError;
  message?: string;
};

export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "unpaid";

export const createStripeCheckoutSession = async (
  request: CreateCheckoutSessionRequest,
): Promise<{ data: CreateCheckoutSessionResponse }> => {
  const axiosInstance = getAxiosInstance();

  if (!axiosInstance) {
    throw new Error("Axios instance not available");
  }

  const response = await axiosInstance.post(
    "/payment/subscriptions/stripe-checkout",
    request,
  );

  return response;
};

export const getSubscriptionStatus = async (): Promise<{
  data: SubscriptionStatusResponse;
}> => {
  const axiosInstance = getAxiosInstance();

  if (!axiosInstance) {
    throw new Error("Axios instance not available");
  }

  const response = await axiosInstance.get("/payment/subscriptions/status");

  return response;
};

export const cancelSubscription = async (
  request: CancelSubscriptionRequest,
): Promise<{ data: CancelSubscriptionResponse }> => {
  const axiosInstance = getAxiosInstance();

  if (!axiosInstance) {
    throw new Error("Axios instance not available");
  }

  const response = await axiosInstance.post(
    "/payment/subscriptions/cancel",
    request,
  );

  return response;
};

export const createBillingPortalSession = async (
  request: CreateBillingPortalSessionRequest,
): Promise<{ data: CreateBillingPortalSessionResponse }> => {
  const axiosInstance = getAxiosInstance();

  if (!axiosInstance) {
    throw new Error("Axios instance not available");
  }

  const response = await axiosInstance.post(
    `/payment/subscriptions/billing-portal?return_url=${encodeURIComponent(request.return_url)}`,
    {},
  );

  return response;
};
