import { apiRequest } from "@/lib/api";

export type Workspace = {
  business_id: string;
  business_name: string;
  role: string;
  user_id: string;
};

type WorkspaceResponse = {
  success: boolean;
  workspace: Workspace;
};

export async function getCurrentWorkspace() {
  const response =
    await apiRequest<WorkspaceResponse>(
      "/dashboard/workspace"
    );

  return response.workspace;
}