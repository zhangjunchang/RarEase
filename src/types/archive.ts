export type ArchiveStatus = "empty" | "loading" | "ready" | "extracting" | "done" | "password" | "error";

export type ArchiveEntry = {
  path: string;
  size: number;
  packedSize: number;
  modifiedAt: string | null;
  isDir: boolean;
  isEncrypted: boolean;
};

export type ArchiveSummary = {
  path: string;
  name: string;
  totalSize: number;
  fileCount: number;
  isEncrypted: boolean;
  isMultipart: boolean;
  format: string;
};

export type ExtractProgress = {
  percent: number;
  currentFile: string;
  extractedFiles: number;
  totalFiles: number;
  speed: string;
  remaining: string;
};

export type AppError = {
  title: string;
  message: string;
  actionLabel?: string;
};
