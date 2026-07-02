import { getAxiosInstance } from "@/lib/services/axiosInstances";

const ProjectUrls = {
  CreateProject: "/project/create_project",
  ListProjects: "/project/list_projects",
  RenameProject: "/project/rename_project",
  PinUnpinProject: "/project/pin_project",
  DeleteProject: "/project/delete_project",
  ProjectDetailsById: "/project/get_project_id_detail",
  UpdateProjectOrgDB: "/project/update_project_org_db",
};

export const addNewProject = async (
  project_name: string,
  selected_org_db: string | null,
  is_agentic: boolean = false,
  linked_widget_id?: string | null,
) => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.post(ProjectUrls.CreateProject, {
    project_name,
    selected_org_db: selected_org_db || null,
    is_agentic,
    // When set, the BE find-or-creates a hidden, resumable edit chat for the widget.
    linked_widget_id: linked_widget_id || null,
  });
  return response;
};

export const getProjectList = async () => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.get(ProjectUrls.ListProjects);
  return response.data;
};

export const pinUnpinProject = async (project_id: any, is_pinned: boolean) => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.put(ProjectUrls.PinUnpinProject, {
    project_id,
    is_pinned,
  });
  return response.data;
};

export const deleteproject = async (project_id: any) => {
  const body = {
    project_id: project_id,
  };
  const axiosInstance = getAxiosInstance();

  const response = await axiosInstance.delete(ProjectUrls.DeleteProject, {
    data: body,
  });
  return response.data;
};

export const updateProject = async (project_id: any, project_name: any) => {
  const axiosInstance = getAxiosInstance();

  const body = {
    project_id: project_id,
    project_name: project_name,
  };
  const response = await axiosInstance.put(ProjectUrls.RenameProject, body, {});
  return response;
};

export const getProjectDetailsById = async (projectId: string) => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.get(
    `${ProjectUrls.ProjectDetailsById}?project_id=${projectId}`,
  );
  return response.data;
};

export const updateProjectOrgDB = async (
  projectId: string,
  orgDbId: string | null,
) => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.post(ProjectUrls.UpdateProjectOrgDB, {
    project_id: projectId,
    org_db_id: orgDbId,
  });
  return response.data;
};

export type ConvertToGroupRequest = {
  project_id: string;
  group_name: string;
  description?: string;
  members_can_send?: boolean;
};

export type ConvertToGroupResponse = {
  status_code: number;
  message: string;
  group: {
    group_id: string;
    project_id: string;
    session_id: string;
    group_name: string;
    description: string | null;
    members_can_send: boolean;
    orgdb_id: string;
    created_at: string;
    created_by: string;
    user_role: "admin" | "member";
    member_count: number;
  };
};

export const convertProjectToGroup = async (
  data: ConvertToGroupRequest,
): Promise<ConvertToGroupResponse> => {
  const axiosInstance = getAxiosInstance();
  const response = await axiosInstance.post<ConvertToGroupResponse>(
    "/project/projects/convert_to_group",
    data,
  );
  return response.data;
};
