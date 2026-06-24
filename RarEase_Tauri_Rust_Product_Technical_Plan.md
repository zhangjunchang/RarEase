# RarEase / 开匣：Tauri + Rust 跨平台 RAR 解压软件方案

## 1. 产品定位

RarEase 是一款面向 Windows 和 macOS 的轻量级 RAR 解压工具。第一版专注于“打开、预览、解压 RAR 文件”，不做压缩、不做复杂文件管理器、不做账号系统。

核心体验：

```text
拖入 RAR 文件 -> 查看内容 -> 选择位置 -> 一键解压
```

目标用户：

- 经常下载 `.rar`、`.part1.rar`、`.r00` 分卷压缩包的用户
- 不想安装臃肿压缩软件的用户
- 只需要快速查看和解压压缩包的用户
- 同时使用 Windows 和 macOS 的跨平台用户

第一版目标：

- 轻量
- 干净
- 稳定
- 操作步骤少
- Windows 和 macOS 体验一致

## 2. 推荐技术栈

```text
桌面框架：Tauri
后端语言：Rust
前端框架：React + TypeScript
样式方案：Tailwind CSS
状态管理：Zustand 或 React Context
解压核心：unrar 优先，预留 libarchive
打包发布：Tauri Bundler
```

选择 Tauri + Rust 的原因：

- 安装包体积比 Electron 小
- Rust 适合处理文件、路径、安全检查和后台任务
- Tauri 原生支持 Windows/macOS 打包
- 前端可以用熟悉的 React/TypeScript 快速开发
- 后续扩展 ZIP、7z、tar 等格式时不会推倒重来

## 3. 总体架构

```text
RarEase
  ├─ 前端 UI
  │   ├─ 文件拖拽
  │   ├─ 压缩包内容预览
  │   ├─ 解压设置
  │   ├─ 进度展示
  │   └─ 错误/密码弹窗
  │
  ├─ Tauri 命令层
  │   ├─ open_archive()
  │   ├─ list_entries()
  │   ├─ extract_archive()
  │   ├─ cancel_task()
  │   └─ reveal_in_folder()
  │
  ├─ Rust 核心服务
  │   ├─ ArchiveService
  │   ├─ ExtractTaskManager
  │   ├─ PasswordManager
  │   ├─ PathSecurity
  │   └─ SettingsService
  │
  └─ 解压适配层
      ├─ UnrarAdapter
      └─ LibarchiveAdapter
```

## 4. 解压核心设计

建议采用适配器模式，把 UI、业务流程和具体解压引擎分开。

第一版：

```text
RAR / RAR5 / 分卷 RAR -> UnrarAdapter
```

后续扩展：

```text
ZIP / TAR / 7z / 其他格式 -> LibarchiveAdapter 或 7zAdapter
```

Rust 接口示例：

```rust
trait ArchiveAdapter {
    fn can_handle(&self, path: &Path) -> bool;

    fn list_entries(
        &self,
        path: &Path,
        password: Option<&str>,
    ) -> Result<Vec<ArchiveEntry>>;

    fn extract(
        &self,
        archive_path: &Path,
        output_dir: &Path,
        options: ExtractOptions,
        progress: ProgressSender,
    ) -> Result<ExtractResult>;
}
```

核心数据结构：

```rust
struct ArchiveEntry {
    path: String,
    size: u64,
    packed_size: u64,
    modified_at: Option<String>,
    is_dir: bool,
    is_encrypted: bool,
}

struct ExtractOptions {
    password: Option<String>,
    overwrite: OverwriteMode,
    create_folder: bool,
    selected_entries: Option<Vec<String>>,
}

enum OverwriteMode {
    Ask,
    Replace,
    Skip,
    Rename,
}
```

## 5. 界面设计

整体风格建议：

- 安静
- 轻量
- 系统工具感
- 不做营销式首页
- 打开后第一屏就是可用界面

产品原型 HTML 演示：

```text
prototypes/rarease_prototype.html
```

该原型覆盖第一版关键状态：初始页、压缩包预览、解压中、解压完成、密码弹窗、异常提示。后续如果要做截图或继续细化视觉，可以直接基于这个 HTML 文件迭代。

### 5.1 初始首页

```text
┌──────────────────────────────────────────────┐
│ RarEase                            设置  关于 │
├──────────────────────────────────────────────┤
│                                              │
│        拖入 RAR 文件，或点击选择文件          │
│                                              │
│        [ 选择文件 ]                           │
│                                              │
├──────────────────────────────────────────────┤
│ 最近打开                                     │
│ example.part1.rar              昨天          │
│ photos.rar                     6月20日       │
└──────────────────────────────────────────────┘
```

### 5.2 打开压缩包后

```text
┌──────────────────────────────────────────────┐
│ photos.part1.rar                    更换文件 │
├──────────────────────────────────────────────┤
│ 文件  238 个        总大小 1.8 GB             │
│ 加密  否             分卷  是                 │
├──────────────────────────────────────────────┤
│ 目录树 / 文件列表                             │
│ ┌──────────────────────────────────────────┐ │
│ │ photos/                                  │ │
│ │ photos/2025/001.jpg       4.2 MB          │ │
│ │ photos/2025/002.jpg       3.8 MB          │ │
│ │ docs/readme.txt           12 KB           │ │
│ └──────────────────────────────────────────┘ │
├──────────────────────────────────────────────┤
│ 解压到：/Users/xxx/Downloads/photos           │
│ [选择目录] [自动创建同名文件夹 ✓]             │
│                                              │
│                           [ 解压全部 ]        │
└──────────────────────────────────────────────┘
```

### 5.3 解压中

```text
┌──────────────────────────────────────────────┐
│ 正在解压 photos.part1.rar                     │
├──────────────────────────────────────────────┤
│ photos/2025/001.jpg                           │
│ ███████████████░░░░░░░░░ 62%                  │
│                                              │
│ 已解压 142 / 238 个文件                       │
│ 速度 48 MB/s       剩余约 38 秒               │
│                                              │
│                         [取消]                │
└──────────────────────────────────────────────┘
```

### 5.4 解压完成

```text
┌──────────────────────────────────────────────┐
│ 解压完成                                     │
├──────────────────────────────────────────────┤
│ 238 个文件已解压到：                          │
│ /Users/xxx/Downloads/photos                   │
│                                              │
│ [打开文件夹]                 [再解压一个]      │
└──────────────────────────────────────────────┘
```

## 6. 关键交互设计

### 6.1 文件拖拽

- 拖入 `.rar` 后自动读取内容
- 拖入 `.part1.rar` 时识别为分卷起点
- 拖入 `.part2.rar` 时提示用户选择第一卷
- 拖入非 RAR 文件时给出轻提示
- 拖入多个文件时优先识别第一个主压缩包

### 6.2 密码弹窗

```text
这个压缩包需要密码

密码：[________________]
[显示密码] [记住本次任务]

[取消] [继续]
```

交互规则：

- 密码只在本次任务中保留
- 默认不持久化密码
- 密码错误时保留弹窗并提示“密码不正确”

### 6.3 错误提示

错误提示要尽量说人话。

分卷缺失：

```text
缺少分卷文件：
photos.part3.rar

请把所有分卷放在同一个文件夹后重试。
```

密码错误：

```text
密码不正确

请检查密码后重新输入。
```

文件损坏：

```text
文件可能已损坏

可以尝试重新下载压缩包。
```

权限不足：

```text
无法写入目标文件夹

请选择其他位置，或检查当前文件夹权限。
```

## 7. 前端组件拆分

```text
src/
  ├─ app/
  │   ├─ App.tsx
  │   └─ routes.tsx
  │
  ├─ components/
  │   ├─ DropZone.tsx
  │   ├─ ArchiveSummary.tsx
  │   ├─ FileTable.tsx
  │   ├─ DestinationPicker.tsx
  │   ├─ ProgressPanel.tsx
  │   ├─ PasswordDialog.tsx
  │   ├─ ErrorDialog.tsx
  │   └─ TitleBar.tsx
  │
  ├─ stores/
  │   └─ archiveStore.ts
  │
  ├─ services/
  │   └─ tauriApi.ts
  │
  └─ styles/
      └─ globals.css
```

主要组件职责：

- `DropZone`：文件拖拽和选择
- `ArchiveSummary`：压缩包基础信息
- `FileTable`：文件列表和目录展示
- `DestinationPicker`：选择解压目录
- `ProgressPanel`：解压进度、速度、剩余时间、取消按钮
- `PasswordDialog`：密码输入
- `ErrorDialog`：错误提示和重试操作
- `TitleBar`：窗口标题、设置、关于入口

## 8. Rust 目录结构

```text
src-tauri/src/
  ├─ main.rs
  ├─ commands.rs
  ├─ archive/
  │   ├─ mod.rs
  │   ├─ service.rs
  │   ├─ entry.rs
  │   ├─ options.rs
  │   └─ adapters/
  │       ├─ mod.rs
  │       ├─ unrar.rs
  │       └─ libarchive.rs
  │
  ├─ extract/
  │   ├─ task.rs
  │   ├─ progress.rs
  │   └─ manager.rs
  │
  ├─ security/
  │   └─ path.rs
  │
  └─ settings/
      └─ store.rs
```

Tauri 命令建议：

```rust
#[tauri::command]
async fn list_entries(path: String, password: Option<String>) -> Result<Vec<ArchiveEntry>, AppError>;

#[tauri::command]
async fn extract_archive(
    archive_path: String,
    output_dir: String,
    options: ExtractOptions,
) -> Result<ExtractTaskId, AppError>;

#[tauri::command]
async fn cancel_task(task_id: String) -> Result<(), AppError>;

#[tauri::command]
async fn reveal_in_folder(path: String) -> Result<(), AppError>;
```

## 9. 安全设计

解压软件必须重点处理路径安全。

必须防止：

- 压缩包内路径包含 `../`
- 压缩包内路径是绝对路径
- Windows 盘符路径写入，例如 `C:\Windows\...`
- 文件被解压到用户选择目录之外
- 特殊文件、软链接造成意外覆盖
- 同名文件覆盖用户已有文件

路径检查流程：

```text
压缩包内路径
  ↓
规范化
  ↓
拒绝绝对路径和上级目录跳转
  ↓
拼接目标目录
  ↓
确认最终路径仍在目标目录内
  ↓
允许写入
```

其他安全措施：

- 解压前检查目标目录是否可写
- 解压前估算磁盘空间
- 默认不覆盖已有文件
- 覆盖前弹窗确认
- 错误日志不记录用户密码
- 密码默认只存在内存中

## 10. Windows 和 macOS 差异

### 10.1 Windows

重点能力：

- 支持 `.rar` 文件关联
- 支持右键菜单：“解压到当前文件夹”“解压到同名文件夹”
- 支持解压完成后在资源管理器中打开
- 安装包使用 `.msi` 或 `.exe`

注意事项：

- 路径长度限制
- 文件名非法字符
- 管理员权限目录
- 防病毒软件误报
- 不同 Windows 版本的外壳集成差异

### 10.2 macOS

重点能力：

- 支持拖拽文件到 Dock 图标打开
- 支持 Finder “打开方式”
- 支持 Apple Silicon 和 Intel
- 安装包使用 `.dmg`
- 支持解压完成后在 Finder 中显示

注意事项：

- 应用签名
- Apple 公证
- 文件访问授权
- 沙盒权限
- Finder 右键扩展第一版可以暂缓

## 11. MVP 开发计划

### 第 1 周：项目基础

- 初始化 Tauri + React + TypeScript
- 完成主界面和拖拽区域
- 完成文件选择
- Rust 接收文件路径
- 建立前后端通信

### 第 2 周：RAR 读取

- 接入 `unrar`
- 读取 RAR 文件列表
- 展示目录、文件名、大小
- 判断是否加密
- 初步处理分卷

### 第 3 周：解压流程

- 实现选择解压目录
- 实现解压全部
- 实现进度事件
- 支持取消
- 解压完成后打开目录

### 第 4 周：异常和体验

- 密码弹窗
- 密码错误提示
- 分卷缺失提示
- 文件损坏提示
- 覆盖策略
- 最近文件

### 第 5 周：跨平台打包

- Windows 安装包
- macOS `.dmg`
- 应用图标
- 应用名称配置
- 自动更新预留
- 手动测试

## 12. 第一版功能范围

第一版建议包含：

- 打开 RAR 文件
- 预览文件列表
- 解压全部
- 密码支持
- 分卷支持
- 进度显示
- 取消解压
- 错误提示
- 打开解压目录
- Windows/macOS 打包

第一版暂不包含：

- 创建 RAR
- 编辑压缩包
- 云盘
- 账号系统
- 广告系统
- 复杂主题市场
- 内置文件管理器
- Finder/Explorer 深度右键集成

## 13. 视觉风格

品牌感觉：

- 干净
- 可靠
- 速度感
- 不压迫
- 接近系统工具，而不是娱乐网站

颜色建议：

```text
背景：#F7F8FA
主文字：#1F2937
次文字：#6B7280
主按钮：#2563EB
成功色：#16A34A
错误色：#DC2626
边框：#E5E7EB
```

控件建议：

- 主按钮：蓝色，“解压全部”
- 次按钮：灰白，“选择目录”
- 危险按钮：红色，“取消”
- 圆角：6-8px
- 表格行高：紧凑但不拥挤
- 信息密度：偏工具软件，不做大面积装饰

图标建议使用 lucide：

- 文件：`FileArchive`
- 文件夹：`FolderOpen`
- 解压：`PackageOpen`
- 设置：`Settings`
- 成功：`CheckCircle`
- 错误：`AlertTriangle`
- 密码：`Lock`

## 14. 商业化方向

免费版：

- 解压 RAR
- 解压 ZIP
- 密码支持
- 基础分卷支持

Pro 版可考虑：

- 批量解压
- 右键菜单
- 自动分类解压
- 解压历史
- 损坏包检测
- 更多格式支持
- 自动更新
- 企业授权

建议第一版完全免费，先验证用户是否喜欢这个体验。

## 15. 许可证和合规提醒

RAR 是专有格式。产品可以做 RAR 解压，但不要把官方 UnRAR 代码用于实现 RAR 压缩算法，也不要宣称支持创建 RAR。

建议：

- 第一版只做 RAR 解压
- 明确产品定位为 extractor / unpacker
- 不提供 RAR 压缩功能
- 使用第三方库前检查许可证
- 商业发布前对 `unrar`、`libarchive`、图标、字体等依赖做一次许可证审查

## 16. 推荐最终路线

```text
产品名：RarEase
中文名：开匣
技术栈：Tauri + Rust + React + TypeScript
第一版核心：只做 RAR 解压
解压核心：优先 unrar，接口预留 libarchive
目标平台：Windows 10/11 + macOS 13+
风格：轻量、干净、系统工具感
```

这条路线的优势是：第一版可以比较快做出来，后续扩展 ZIP、7z、批量解压、右键菜单时，也不需要重写核心架构。

## 17. 文档建议修改点

当前文档的技术路线比较完整，但在正式进入开发前，建议补充或明确下面几类内容。

### 17.1 产品范围再收窄

第一版建议把“解压选中文件”暂缓，只保留：

- 打开 RAR
- 预览文件列表
- 解压全部
- 密码支持
- 分卷支持
- 进度、取消、完成后打开目录

原因是“选中文件解压”会牵涉目录树勾选、半选状态、批量选择、文件过滤和路径映射，容易拖慢第一版节奏。

### 17.2 增加用户流程和验收标准

建议为核心流程补充验收标准，例如：

```text
用户拖入 photos.part1.rar
应用应在 2 秒内进入读取状态
读取成功后展示文件数量、总大小、是否加密、是否分卷
用户点击解压全部后，应显示进度、当前文件、已处理文件数和取消按钮
解压完成后，应提供打开文件夹和再解压一个两个操作
```

这样后续开发和测试不会只依赖主观感觉。

### 17.3 明确解压引擎和许可证风险

文档已经提醒 RAR 合规问题，但建议在技术选型里进一步确认：

- 使用的 Rust `unrar` 封装是否需要系统安装 unrar
- 是否把 unrar 二进制随应用分发
- unrar 许可证是否允许当前商业化方式
- macOS/Windows 打包时二进制放置路径和签名方式

如果后续要上架或商业发布，这部分最好在开发前确认。

### 17.4 补充异常状态清单

建议在错误提示之外补一张异常状态表，至少包含：

- 文件不存在或被移动
- 文件被其他程序占用
- 密码错误
- 分卷缺失
- 分卷版本不一致
- 目标目录不可写
- 磁盘空间不足
- 解压后文件名冲突
- 压缩包内存在危险路径

每个异常都应该明确：用户看到什么、能做什么、是否可以重试。

### 17.5 补充原型图和页面状态

当前文档已有 ASCII 线框，但不够直观。已新增 HTML 原型：

```text
prototypes/rarease_prototype.html
```

建议后续把它作为产品原型来源，并在需求文档中截图引用这些状态：

- 初始空状态
- 压缩包预览状态
- 解压中状态
- 解压完成状态
- 密码输入状态
- 异常提示状态
