import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { createServiceUrl } from "./localDevConfig";
import {
  refreshOrForceLogout,
  isTokenRefreshInProgress,
  resetTokenRefreshState,
} from "./tokenRefresh";

let axiosInstance: AxiosInstance | null = null;
let indexingLambdaAxiosInstance: AxiosInstance | null = null;
let qaPossibleLambdaAxiosInstance: AxiosInstance | null = null;

// Queue for requests that failed during token refresh
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else if (token) resolve(token);
  });
  failedQueue = [];
};

// Handle 401 auth errors with token refresh and retry,
// on refresh failure triggers force logout modal instead of redirecting directly
interface RetryableRequest extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const handle401WithRefresh = async (error: AxiosError): Promise<any> => {
  const originalRequest: RetryableRequest | undefined = error.config;

  if (error.response?.status !== 401) throw error;
  if (!originalRequest) throw error;
  if (originalRequest._retry) throw error;

  // If refresh already in progress, queue this request
  if (isTokenRefreshInProgress()) {
    return new Promise((resolve, reject) => {
      failedQueue.push({
        resolve: (token: string) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(axios(originalRequest));
        },
        reject,
      });
    });
  }

  // Mark as retry to prevent infinite loop
  originalRequest._retry = true;

  try {
    const newToken = await refreshOrForceLogout();

    // Update Authorization header on all axios instances
    [axiosInstance, indexingLambdaAxiosInstance, qaPossibleLambdaAxiosInstance]
      .filter(Boolean)
      .forEach((instance) => {
        instance!.defaults.headers.common["Authorization"] =
          `Bearer ${newToken}`;
      });

    processQueue(null, newToken);

    // Retry original request with new token
    originalRequest.headers.Authorization = `Bearer ${newToken}`;
    return axios(originalRequest);
  } catch (refreshError: any) {
    processQueue(refreshError, null);
    throw error;
  }
};

export const createAxiosInstance = (accessToken: string) => {
  resetTokenRefreshState();
  failedQueue = [];

  axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  // Request interceptor for local development service routing
  axiosInstance.interceptors.request.use((config) => {
    if (config.url) {
      const service = config.url.split("/")[1];

      if (service) {
        config.baseURL = createServiceUrl(config.baseURL || "", service);
      }
    }
    return config;
  });

  axiosInstance.interceptors.response.use(
    (response) => response,
    handle401WithRefresh,
  );

  indexingLambdaAxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_INDEXING_LAMBDA_BASE_URL,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    maxBodyLength: Infinity,
  });

  indexingLambdaAxiosInstance.interceptors.response.use(
    (response) => response,
    handle401WithRefresh,
  );

  qaPossibleLambdaAxiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_QA_POSSIBLE_LAMBDA_BASE_URL,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  qaPossibleLambdaAxiosInstance.interceptors.response.use(
    (response) => response,
    handle401WithRefresh,
  );
};

export const getAxiosInstance = (): AxiosInstance => {
  if (!axiosInstance) {
    throw new Error("Axios instance not initialized");
  }
  return axiosInstance;
};

export const getIndexingLambdaAxiosInstance = (): AxiosInstance => {
  if (!indexingLambdaAxiosInstance) {
    throw new Error("Lambda axios instance not initialized");
  }
  return indexingLambdaAxiosInstance;
};

export const getQaPossibleLambdaAxiosInstance = (): AxiosInstance => {
  if (!qaPossibleLambdaAxiosInstance) {
    throw new Error("Lambda axios instance not initialized");
  }
  return qaPossibleLambdaAxiosInstance;
};
