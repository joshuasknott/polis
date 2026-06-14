"use client";

import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Upload, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkspaceFolderSummary } from "./workspace-sections";

interface SourceUploaderProps {
  moduleId: string;
  folders: WorkspaceFolderSummary[];
}

const FOLDER_TYPE_OPTIONS = [
  { value: "readings", label: "Readings" },
  { value: "lecture_material", label: "Lecture / seminar material" },
  { value: "module_info", label: "Module info / handbook" },
  { value: "assignments", label: "Assignment briefs" },
  { value: "drafts_reviews", label: "Drafts & reviews" },
  { value: "submissions", label: "Submissions" },
];

export function SourceUploader({ moduleId, folders }: SourceUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [folderType, setFolderType] = useState<string>("readings");

  const createForUpload = useMutation(api.sources.createForUpload);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const attachStorage = useMutation(api.sources.attachStorage);

  const availableFolderTypes = FOLDER_TYPE_OPTIONS.filter((option) =>
    folders.some((f) => f.type === option.value),
  );
  const folderTypeOptions =
    availableFolderTypes.length > 0 ? availableFolderTypes : FOLDER_TYPE_OPTIONS;

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError(null);

    try {
      for (const file of Array.from(files)) {
        const sourceId = await createForUpload({
          moduleId: moduleId as Id<"modules">,
          title: file.name.replace(/\.[^/.]+$/, ""),
          fileName: file.name,
          fileType: file.type || "application/octet-stream",
          fileSize: file.size,
          folderType,
        });

        const postUrl = await generateUploadUrl({
          fileName: file.name,
          fileType: file.type || "application/octet-stream",
          fileSize: file.size,
        });

        const uploadResult = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!uploadResult.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }

        const { storageId } = await uploadResult.json();

        await attachStorage({
          sourceId: sourceId as Id<"sources">,
          storageId: storageId as Id<"_storage">,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        });
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      e.target.value = "";
      setUploading(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Add imports</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Upload PDF, DOCX, TXT, or Markdown files. Classification is suggested automatically and reviewed here.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={folderType}
            onChange={(e) => setFolderType(e.target.value)}
            disabled={uploading}
            className="rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            {folderTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/90 transition-colors",
              uploading && "opacity-60 cursor-wait",
            )}
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {uploading ? "Uploading…" : "Choose files"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.txt,.md"
            multiple
            onChange={handleUpload}
            disabled={uploading}
          />
        </div>
      </div>
      {uploadError && (
        <p className="mt-3 flex items-center gap-1.5 rounded-md border border-danger/30 bg-danger/5 px-2.5 py-1.5 text-xs text-danger">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {uploadError}
        </p>
      )}
    </div>
  );
}
