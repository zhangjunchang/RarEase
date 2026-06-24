import { AlertTriangle, Archive, CheckCircle2, Eye, FileArchive, FolderOpen, KeyRound, Loader2, PackageOpen, Search, Settings } from "lucide-react";
import { useMemo, useRef } from "react";
import { useArchiveStore } from "./stores/archiveStore";
import type { ArchiveEntry } from "./types/archive";

const demoPath = "/Users/you/Downloads/photos.part1.rar";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function getFolders(entries: ArchiveEntry[]) {
  const roots = new Set<string>();
  entries.forEach((entry) => {
    const [root] = entry.path.split("/");
    if (root) roots.add(root);
  });
  return Array.from(roots);
}

export function App() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const {
    status,
    summary,
    entries,
    destination,
    progress,
    error,
    recentFiles,
    openFile,
    startExtract,
    cancelExtract,
    reset,
    showPassword,
    showMissingPartError,
    revealDestination,
  } = useArchiveStore();

  const folders = useMemo(() => getFolders(entries), [entries]);

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    void openFile(file?.name || demoPath);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      void openFile(file.name);
    }
  }

  return (
    <main className="app-shell">
      <section className="app-window" aria-label="RarEase 应用窗口">
        <header className="titlebar">
          <div className="title-left">
            <div className="app-logo">
              <FileArchive size={16} />
            </div>
            <div>
              <strong>{summary?.name || "RarEase"}</strong>
              <span>开匣</span>
            </div>
          </div>
          <div className="title-actions">
            <button className="icon-button" title="演示密码状态" onClick={showPassword}>
              <KeyRound size={17} />
            </button>
            <button className="icon-button" title="演示异常状态" onClick={showMissingPartError}>
              <AlertTriangle size={17} />
            </button>
            <button className="icon-button" title="设置">
              <Settings size={17} />
            </button>
          </div>
        </header>

        {status === "empty" && (
          <section className="empty-state">
            <div className="dropzone" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
              <div className="drop-icon">
                <Archive size={34} />
              </div>
              <h1>拖入 RAR 文件，或点击选择文件</h1>
              <p>支持 .rar、.part1.rar、.r00 分卷压缩包</p>
              <div className="button-row">
                <button className="primary-button" onClick={() => fileInputRef.current?.click()}>
                  <FolderOpen size={17} />
                  选择文件
                </button>
                <button className="secondary-button" onClick={() => void openFile(demoPath)}>
                  <Eye size={17} />
                  打开演示
                </button>
              </div>
              <input ref={fileInputRef} hidden type="file" accept=".rar,.r00,.r01,.r02,.r03" onChange={handleFileChange} />
            </div>

            <section className="recent-panel">
              <div className="section-heading">
                <strong>最近打开</strong>
                <span>本机记录</span>
              </div>
              <div className="recent-list">
                {recentFiles.map((file) => (
                  <button key={file} className="recent-item" onClick={() => void openFile(file)}>
                    <span>{file}</span>
                    <small>打开</small>
                  </button>
                ))}
              </div>
            </section>
          </section>
        )}

        {status === "loading" && (
          <section className="center-state">
            <Loader2 className="spin" size={34} />
            <h2>正在读取压缩包</h2>
            <p>解析文件列表和分卷信息。</p>
          </section>
        )}

        {status === "ready" && summary && (
          <section className="archive-view">
            <div className="summary-panel">
              <div>
                <h1>{summary.name}</h1>
                <p>{summary.path}</p>
              </div>
              <div className="summary-pills">
                <span>{summary.fileCount} 个文件</span>
                <span>{formatSize(summary.totalSize)}</span>
                <span>分卷：{summary.isMultipart ? "是" : "否"}</span>
                <span>加密：{summary.isEncrypted ? "是" : "否"}</span>
                <span>{summary.format}</span>
              </div>
            </div>

            <div className="archive-workspace">
              <aside className="folder-tree">
                <button className="tree-row active">
                  <FolderOpen size={16} />
                  全部文件
                </button>
                {folders.map((folder) => (
                  <button className="tree-row" key={folder}>
                    <FolderOpen size={16} />
                    {folder}
                  </button>
                ))}
              </aside>

              <section className="file-pane">
                <div className="toolbar">
                  <div className="search-box">
                    <Search size={16} />
                    搜索压缩包内文件
                  </div>
                  <button className="secondary-button" onClick={reset}>更换文件</button>
                </div>

                <div className="file-table">
                  <div className="file-head">
                    <span>名称</span>
                    <span>大小</span>
                    <span>修改时间</span>
                    <span>状态</span>
                  </div>
                  {entries.map((entry) => (
                    <div className="file-row" key={entry.path}>
                      <span className="file-name">
                        <FileArchive size={15} />
                        {entry.path}
                      </span>
                      <span>{formatSize(entry.size)}</span>
                      <span>{entry.modifiedAt || "-"}</span>
                      <span>{entry.isEncrypted ? "加密" : "正常"}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <footer className="destination-bar">
              <div className="path-box">解压到：{destination}</div>
              <div className="button-row">
                <button className="secondary-button">
                  <FolderOpen size={17} />
                  选择目录
                </button>
                <button className="primary-button" onClick={startExtract}>
                  <PackageOpen size={17} />
                  解压全部
                </button>
              </div>
            </footer>
          </section>
        )}

        {status === "extracting" && (
          <section className="center-state">
            <div className="status-card">
              <div className="status-heading">
                <div className="status-icon blue">
                  <PackageOpen size={23} />
                </div>
                <div>
                  <h2>正在解压 {summary?.name}</h2>
                  <p>{progress.currentFile}</p>
                </div>
              </div>
              <div className="progress-track">
                <span style={{ width: `${progress.percent}%` }} />
              </div>
              <div className="progress-stats">
                <div><strong>{progress.percent}%</strong><span>当前进度</span></div>
                <div><strong>{progress.extractedFiles} / {progress.totalFiles}</strong><span>文件数量</span></div>
                <div><strong>{progress.remaining}</strong><span>预计剩余</span></div>
              </div>
              <div className="status-footer">
                <span>速度 {progress.speed}</span>
                <button className="danger-button" onClick={cancelExtract}>取消</button>
              </div>
            </div>
          </section>
        )}

        {status === "done" && (
          <section className="center-state">
            <div className="status-card">
              <div className="status-heading">
                <div className="status-icon green">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h2>解压完成</h2>
                  <p>{summary?.fileCount || entries.length} 个文件已解压到 {destination}</p>
                </div>
              </div>
              <div className="button-row align-end">
                <button className="secondary-button" onClick={reset}>再解压一个</button>
                <button className="primary-button" onClick={() => void revealDestination()}>
                  <FolderOpen size={17} />
                  打开文件夹
                </button>
              </div>
            </div>
          </section>
        )}

        {status === "password" && (
          <section className="center-state">
            <div className="status-card">
              <div className="status-heading">
                <div className="status-icon blue">
                  <KeyRound size={23} />
                </div>
                <div>
                  <h2>这个压缩包需要密码</h2>
                  <p>密码只保留在本次任务中。</p>
                </div>
              </div>
              <label className="field-label" htmlFor="archive-password">密码</label>
              <input id="archive-password" className="text-input" type="password" autoFocus />
              <label className="checkbox-row">
                <input type="checkbox" />
                显示密码
              </label>
              <div className="button-row align-end">
                <button className="secondary-button" onClick={reset}>取消</button>
                <button className="primary-button" onClick={startExtract}>继续</button>
              </div>
            </div>
          </section>
        )}

        {status === "error" && error && (
          <section className="center-state">
            <div className="status-card">
              <div className="status-heading">
                <div className="status-icon red">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h2>{error.title}</h2>
                  <p>{error.message}</p>
                </div>
              </div>
              <div className="button-row align-end">
                <button className="secondary-button" onClick={reset}>更换文件</button>
                <button className="primary-button" onClick={() => void openFile(summary?.path || demoPath)}>
                  {error.actionLabel || "重试"}
                </button>
              </div>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
