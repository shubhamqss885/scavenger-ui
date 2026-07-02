import { getAxiosInstance } from "@/lib/services/axiosInstances";

export interface OrgFeatures {
  TEXT2SQL: boolean;
  TEXT2SQLONLYMODE: boolean;
  LINEAR_ANALYSIS: boolean;
  FORM_FILLER: boolean;
  EXPLORATORY_GRAPHS: boolean;
  QUALITY_DATASET_ANALYSIS: boolean;
  DESCRIPTIVE_STATS: boolean;
  MANAGEMENT_SUMMARY: boolean;
  IMPORTANT_FEATURES: boolean;
  BULK_ANALYSIS: boolean;
  AGENTIC_CHAT: boolean;
}

export interface OrganizationDetails {
  org_id: string;
  organization_name: string;
  logo_image_url: string;
  index_name: string;
  has_static_index: boolean;
  static_index_namespace_name: string;
  is_deleted: boolean;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  features: OrgFeatures;
}

export interface UserOrganizationProfile {
  id: number;
  sub: string;
  current_organization: string;
  base_organization: string;
}

export interface PaginationMetadata {
  page: number;
  page_size: number;
  total_pages: number;
  total_records: number;
  has_previous: boolean;
  has_next: boolean;
}

export interface PaginatedOrganizationsResponse {
  data: OrganizationDetails[];
  pagination: PaginationMetadata;
}

export const getUserOrganization =
  async (): Promise<UserOrganizationProfile> => {
    const axiosInstance = getAxiosInstance();
    const response = await axiosInstance.get(
      "/organization/get_user_organization",
    );
    return response.data.profile_detail;
  };

export const getOrganizationDetails = async (
  orgId: string,
): Promise<OrganizationDetails> => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.get(
    `/organization/get_organization/${orgId}`,
  );
  return response.data.organization_details;
};

export const getAllOrganizations = async (
  page: number = 1,
  page_size: number = 10,
  search?: string,
  is_private: boolean = false,
): Promise<PaginatedOrganizationsResponse> => {
  const axiosInstance = getAxiosInstance();
  const params: Record<string, string | number | boolean> = {
    page,
    page_size,
    is_private,
  };

  if (search) {
    params.search = search;
  }

  const response = await axiosInstance.get(
    "/organization/get_all_organizations",
    { params },
  );
  return {
    data: response.data.data,
    pagination: response.data.pagination,
  };
};

export const switchUserOrganization = async (
  orgId: string,
): Promise<UserOrganizationProfile> => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.put(
    "/organization/switch_user_organization",
    {
      current_organization: orgId,
    },
  );
  return response.data.profile_detail;
};
