# RarEase / 开匣

RarEase is a lightweight desktop RAR extractor built with Tauri, Rust, React, and TypeScript.

开匣是一款面向 Windows 和 macOS 的轻量级 RAR 解压工具。项目目标是提供一个干净、快速、低打扰的桌面体验：打开 RAR 文件，预览内容，选择位置，一键解压。

> Current status: early prototype. The desktop shell, main UI, archive preview flow, progress flow, and packaging skeleton are in place. Real RAR parsing and extraction are still on the roadmap.

## Features

- Clean desktop UI for archive extraction workflows
- Drag-and-drop oriented first screen
- Archive summary and file list preview
- Extraction progress, cancel state, and completion state
- Password and error-state UI prototypes
- Tauri desktop shell for macOS and Windows
- macOS `.app` build verified
- GitHub Actions workflow for Windows builds

## Screens

The first version focuses on a small, direct workflow:

```text
Drop or choose RAR file -> Preview contents -> Choose destination -> Extract
```

An HTML product prototype is available at:

```text
prototypes/rarease_prototype.html
```

## Tech Stack

- Desktop framework: Tauri 2
- Native backend: Rust
- Frontend: React + TypeScript
- Build tool: Vite
- State management: Zustand
- Icons: lucide-react

## Getting Started

### Requirements

- Node.js 24+
- npm
- Rust stable toolchain
- macOS or Windows

Check your local tools:

```bash
node --version
npm --version
cargo --version
rustc --version
```

### Install Dependencies

```bash
npm install
```

If your npm cache has permission issues, use a project-local cache:

```bash
npm install --cache .npm-cache
```

### Run Web Preview

```bash
npm run dev
```

Open:

```text
http://localhost:1420/
```

### Run Desktop App

```bash
npm run tauri -- dev
```

If your terminal cannot find `cargo`, make sure Rust is in your `PATH`.

On this development machine, Rust may also be available from:

```bash
export PATH="$HOME/.rustup/toolchains/stable-aarch64-apple-darwin/bin:$PATH"
```

## Build

### Build Frontend

```bash
npm run build
```

### Build macOS App

```bash
npm run tauri -- build --bundles app
```

The generated app is placed under:

```text
src-tauri/target/release/bundle/macos/
```

### Build Windows Installer

Windows installers should be built on Windows or through GitHub Actions.

On Windows:

```bash
npm ci
npm run tauri -- build
```

Expected output folders:

```text
src-tauri/target/release/bundle/msi/
src-tauri/target/release/bundle/nsis/
```

A Windows build workflow is included at:

```text
.github/workflows/build-windows.yml
```

## Project Structure

```text
.
├── src/                         # React frontend
│   ├── App.tsx                  # Main application UI
│   ├── main.tsx                 # Frontend entry
│   ├── services/                # Tauri API wrapper
│   ├── stores/                  # Zustand stores
│   ├── types/                   # Shared frontend types
│   └── styles.css               # Application styles
│
├── src-tauri/                   # Tauri and Rust desktop app
│   ├── src/
│   │   ├── lib.rs               # Tauri commands and app bootstrap
│   │   └── main.rs              # Native entry
│   ├── icons/                   # App icons
│   ├── capabilities/            # Tauri permissions
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── prototypes/                  # Product prototype
├── .github/workflows/           # CI build workflows
└── RarEase_Tauri_Rust_Product_Technical_Plan.md
```

## Roadmap

- [x] Product and technical plan
- [x] HTML product prototype
- [x] React desktop UI
- [x] Tauri app shell
- [x] macOS `.app` packaging
- [x] Windows build workflow
- [ ] Real RAR file listing
- [ ] Real RAR extraction
- [ ] Password-protected archive support
- [ ] Multipart RAR validation
- [ ] Destination picker integration
- [ ] Extraction progress from native backend
- [ ] Path traversal and overwrite protection
- [ ] Signed and notarized macOS release
- [ ] Windows installer release

## Development Notes

The current Rust backend returns demo archive data so that the UI workflow can be developed and tested before the extraction engine is connected.

Real extraction should be implemented behind a small adapter layer, so the frontend does not need to know whether the backend uses `unrar`, `libarchive`, or another extraction engine.

Important implementation areas:

- Archive listing
- Extraction task management
- Password handling
- Multipart archive detection
- Path security checks
- Overwrite strategy
- Platform-specific reveal/open behavior

## License and Format Notice

RAR is a proprietary archive format. RarEase is intended as an extractor/unpacker only and does not aim to create RAR archives.

Before publishing a commercial release, review the licenses of the extraction backend, bundled binaries, fonts, icons, and third-party dependencies.

## Contributing

This project is still in an early stage. Issues, ideas, and implementation notes are welcome.

Good first areas to improve:

- Replace demo archive data with real archive listing
- Add tests for path security rules
- Improve empty, loading, and error states
- Replace the temporary app icon with final brand artwork
- Add release signing and packaging documentation
