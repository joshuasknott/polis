"use client";

import { useRef, useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Upload, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkspaceFolderSummary } from "./workspace-sections";

interface SourceUploaderProps {
  moduleId: string;
  folders: WorkspaceFolderSummary[];
}

export function SourceUploader({ moduleId, folders }: SourceUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [phase, setPhase] = useState<string>("Choose files");

  const createBatch = useMutation(api.imports.createBatch);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const registerFile = useMutation(api.imports.registerFile);
  const processBatch = useAction(api.importClassification.processBatch);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const selectedFiles = Array.from(files);

    setUploading(true);
    setUploadError(null);
    setPhase("Creating batch...");

    try {
      const batchId = await createBatch({
        moduleId: moduleId as Id<"modules">,
        name: `Import ${new Date().toLocaleDateString()}`,
        totalFiles: selectedFiles.length,
      });

      for (const file of selectedFiles) {
        setPhase(`Uploading ${file.name}`);
        const postUrl = await generateUploadUrl({
          fileName: file.name,
          fileType: file.type || "application/octet-stream",
          fileSize: file.size,
        });

        const uploadResult = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });

        if (!uploadResult.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }

        const { storageId } = await uploadResult.json();

        await registerFile({
          batchId: batchId as Id<"importBatches">,
          storageId: storageId as Id<"_storage">,
          fileName: file.name,
          fileType: file.type || "application/octet-stream",
          fileSize: file.size,
        });
      }

      setPhase("Processing import...");
      await processBatch({ batchId: batchId as Id<"importBatches"> });
      setPhase("Choose files");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
      setPhase("Choose files");
    } finally {
      e.target.value = "";
      setUploading(false);
    }
  }

  const hasGroups = folders.length > 0;

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Import coursework files</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Upload PDF, DOCX, TXT, or Markdown files. Polis keeps the raw upload, classifies it, then organizes it inside Sources{hasGroups ? "." : " when groups are available."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "inline-flex min-h-9 items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/90",
              uploading && "cursor-wait opacity-60",
            )}
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {uploading ? phase : "Choose files"}
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
