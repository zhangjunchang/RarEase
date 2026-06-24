import { invoke } from "@tauri-apps/api/core";
import type { ArchiveEntry, ArchiveSummary } from "../types/archive";

export type ArchiveDetails = {
  summary: ArchiveSummary;
  entries: ArchiveEntry[];
};

const demoEntries: ArchiveEntry[] = [
  {
    path: "photos/2025/001.jpg",
    size: 4_200_000,
    packedSize: 3_800_000,
    modifiedAt: "2025-12-12",
    isDir: false,
    isEncrypted: false,
  },
  {
    path: "photos/2025/002.jpg",
    size: 3_800_000,
    packedSize: 3_400_000,
    modifiedAt: "2025-12-12",
    isDir: false,
    isEncrypted: false,
  },
  {
    path: "docs/readme.txt",
    size: 12_400,
    packedSize: 5_200,
    modifiedAt: "2025-12-10",
    isDir: false,
    isEncrypted: false,
  },
  {
    path: "raw/session-01.mov",
    size: 802_000_000,
    packedSize: 690_000_000,
    modifiedAt: "2025-12-08",
    isDir: false,
    isEncrypted: false,
  },
  {
    path: "raw/session-02.mov",
    size: 746_000_000,
    packedSize: 631_000_000,
    modifiedAt: "2025-12-08",
    isDir: false,
    isEncrypted: false,
  },
];

export async function openArchive(path: string): Promise<ArchiveDetails> {
  try {
    return await invoke<ArchiveDetails>("open_archive", { path });
  } catch {
    const name = path.split(/[\\/]/).pop() || "photos.part1.rar";
    return {
      summary: {
        path,
        name,
        totalSize: demoEntries.reduce((sum, entry) => sum + entry.size, 0),
        fileCount: 238,
        isEncrypted: name.toLowerCase().includes("locked"),
        isMultipart: /\.part\d+\.rar$/i.test(name) || /\.r\d+$/i.test(name),
        format: "RAR5",
      },
      entries: demoEntries,
    };
  }
}

export async function revealInFolder(path: string): Promise<void> {
  try {
    await invoke("reveal_in_folder", { path });
  } catch {
    console.info("Reveal in folder is only available inside the Tauri app.", path);
  }
}
