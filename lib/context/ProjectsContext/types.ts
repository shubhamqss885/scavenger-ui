export interface IProjectDetails {
  id: string;
  project_name: string;
  session_id: string;
  user_sub: string;
  created_at: string;
  updated_at: string;
  selected_org_db: string | null;
  is_agentic: boolean;
}

export interface INewProjectResponse {
  data: {
    message: string;
    project_detail: IProjectDetails;
    status_code: number;
  };
}

export type Project = {
  project_id: string;
  created_at?: string;
  is_archived?: boolean;
  is_deleted?: boolean;
  is_pinned?: boolean;
  session_id: string;
  updated_at?: string;
  project_name?: string;
  variant?: "ghost" | "secondary" | "default";
  path?: string;
  unseenPinnedmsg?: any;
  selected_org_db?: string | null;
  is_agentic?: boolean;
  // Set when this project is the hidden edit chat for a dashboard widget.
  // Such projects are kept out of the sidebar list and the project quota.
  linked_widget_id?: string | null;
  // FUTURE: dashboard layout map by conversation ID
  //dashboard_layout?: Record<string, { x: number; y: number; w: number; h: number }>;
};
