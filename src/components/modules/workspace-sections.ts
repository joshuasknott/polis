import type { CommandCenterAssignment, WorkspaceSourceItem } from "@/lib/convex-ui-mappers";

export interface WorkspaceModuleMeta {
  id: string;
  title: string;
  code: string;
  description: string;
  academicYear: string;
  semester: string;
  colour: string;
}

export interface WorkspaceFolderSummary {
  id: string;
  name: string;
  type: string;
  sourceCount: number;
}

export interface WorkspaceSectionData {
  module: WorkspaceModuleMeta;
  folders: WorkspaceFolderSummary[];
  sources: WorkspaceSourceItem[];
  assignments: CommandCenterAssignment[];
}

export interface WorkspaceSectionProps {
  data: WorkspaceSectionData;
}
