import { create } from "zustand";
import { openArchive, revealInFolder } from "../services/tauriApi";
import type { AppError, ArchiveEntry, ArchiveStatus, ArchiveSummary, ExtractProgress } from "../types/archive";

type ArchiveState = {
  status: ArchiveStatus;
  summary: ArchiveSummary | null;
  entries: ArchiveEntry[];
  destination: string;
  progress: ExtractProgress;
  error: AppError | null;
  recentFiles: string[];
  openFile: (path: string) => Promise<void>;
  startExtract: () => void;
  cancelExtract: () => void;
  reset: () => void;
  showPassword: () => void;
  showMissingPartError: () => void;
  revealDestination: () => Promise<void>;
};

const initialProgress: ExtractProgress = {
  percent: 0,
  currentFile: "",
  extractedFiles: 0,
  totalFiles: 0,
  speed: "0 MB/s",
  remaining: "--",
};

let progressTimer: number | undefined;

export const useArchiveStore = create<ArchiveState>((set, get) => ({
  status: "empty",
  summary: null,
  entries: [],
  destination: "",
  progress: initialProgress,
  error: null,
  recentFiles: ["photos.part1.rar", "design-assets.rar", "invoice-archive.rar"],

  async openFile(path) {
    clearInterval(progressTimer);
    set({ status: "loading", error: null, progress: initialProgress });

    if (!/\.(rar|r\d+|part\d+\.rar)$/i.test(path)) {
      set({
        status: "error",
        error: {
          title: "暂不支持这个文件",
          message: "第一版只支持 RAR 和分卷 RAR 文件。",
          actionLabel: "重新选择",
        },
      });
      return;
    }

    const details = await openArchive(path);
    const baseName = details.summary.name.replace(/\.part\d+\.rar$/i, "").replace(/\.rar$/i, "");

    set((state) => ({
      status: details.summary.isEncrypted ? "password" : "ready",
      summary: details.summary,
      entries: details.entries,
      destination: `/Users/you/Downloads/${baseName}`,
      recentFiles: [details.summary.name, ...state.recentFiles.filter((file) => file !== details.summary.name)].slice(0, 5),
    }));
  },

  startExtract() {
    const state = get();
    const totalFiles = state.summary?.fileCount || state.entries.length || 1;
    const sampleFiles = state.entries.map((entry) => entry.path);

    clearInterval(progressTimer);
    set({
      status: "extracting",
      progress: {
        percent: 0,
        currentFile: sampleFiles[0] || "准备解压",
        extractedFiles: 0,
        totalFiles,
        speed: "0 MB/s",
        remaining: "--",
      },
    });

    progressTimer = window.setInterval(() => {
      const current = get().progress;
      const nextPercent = Math.min(100, current.percent + 8);
      const extractedFiles = Math.min(totalFiles, Math.round((nextPercent / 100) * totalFiles));
      const currentFile = sampleFiles[extractedFiles % Math.max(sampleFiles.length, 1)] || "写入文件";

      set({
        progress: {
          percent: nextPercent,
          currentFile,
          extractedFiles,
          totalFiles,
          speed: nextPercent < 100 ? "48 MB/s" : "0 MB/s",
          remaining: nextPercent < 100 ? `${Math.max(1, Math.round((100 - nextPercent) / 8) * 4)} 秒` : "0 秒",
        },
      });

      if (nextPercent >= 100) {
        clearInterval(progressTimer);
        set({ status: "done" });
      }
    }, 280);
  },

  cancelExtract() {
    clearInterval(progressTimer);
    set({ status: "ready", progress: initialProgress });
  },

  reset() {
    clearInterval(progressTimer);
    set({
      status: "empty",
      summary: null,
      entries: [],
      destination: "",
      progress: initialProgress,
      error: null,
    });
  },

  showPassword() {
    set({ status: "password" });
  },

  showMissingPartError() {
    set({
      status: "error",
      error: {
        title: "缺少分卷文件",
        message: "未找到 photos.part3.rar，请把所有分卷放在同一个文件夹后重试。",
        actionLabel: "重试",
      },
    });
  },

  async revealDestination() {
    const destination = get().destination;
    if (destination) {
      await revealInFolder(destination);
    }
  },
}));
