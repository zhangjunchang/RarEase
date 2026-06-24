use serde::{Deserialize, Serialize};
use tauri_plugin_opener::OpenerExt;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ArchiveEntry {
    path: String,
    size: u64,
    packed_size: u64,
    modified_at: Option<String>,
    is_dir: bool,
    is_encrypted: bool,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ArchiveSummary {
    path: String,
    name: String,
    total_size: u64,
    file_count: usize,
    is_encrypted: bool,
    is_multipart: bool,
    format: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ArchiveDetails {
    summary: ArchiveSummary,
    entries: Vec<ArchiveEntry>,
}

#[tauri::command]
fn open_archive(path: String) -> Result<ArchiveDetails, String> {
    let name = std::path::Path::new(&path)
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or("archive.rar")
        .to_string();

    let entries = vec![
        ArchiveEntry {
            path: "photos/2025/001.jpg".to_string(),
            size: 4_200_000,
            packed_size: 3_800_000,
            modified_at: Some("2025-12-12".to_string()),
            is_dir: false,
            is_encrypted: false,
        },
        ArchiveEntry {
            path: "photos/2025/002.jpg".to_string(),
            size: 3_800_000,
            packed_size: 3_400_000,
            modified_at: Some("2025-12-12".to_string()),
            is_dir: false,
            is_encrypted: false,
        },
        ArchiveEntry {
            path: "docs/readme.txt".to_string(),
            size: 12_400,
            packed_size: 5_200,
            modified_at: Some("2025-12-10".to_string()),
            is_dir: false,
            is_encrypted: false,
        },
        ArchiveEntry {
            path: "raw/session-01.mov".to_string(),
            size: 802_000_000,
            packed_size: 690_000_000,
            modified_at: Some("2025-12-08".to_string()),
            is_dir: false,
            is_encrypted: false,
        },
    ];

    let total_size = entries.iter().map(|entry| entry.size).sum();
    let lower_name = name.to_lowercase();

    Ok(ArchiveDetails {
        summary: ArchiveSummary {
            path,
            name,
            total_size,
            file_count: 238,
            is_encrypted: lower_name.contains("locked"),
            is_multipart: lower_name.contains(".part") || lower_name.ends_with(".r00"),
            format: "RAR5".to_string(),
        },
        entries,
    })
}

#[tauri::command]
fn reveal_in_folder(app: tauri::AppHandle, path: String) -> Result<(), String> {
    app.opener()
        .reveal_item_in_dir(path)
        .map_err(|error| error.to_string())
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![open_archive, reveal_in_folder])
        .run(tauri::generate_context!())
        .expect("error while running RarEase");
}
