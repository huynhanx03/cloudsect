use crate::domains::workspace::model::ApplyInput;
use crate::domains::workspace::service::{apply_change, read_snapshot, AppError};
use crate::infrastructure::workspace_store::StoreWorkspace;
use serde_json::Value;
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

#[tauri::command]
pub fn load_workspace(app: AppHandle) -> Result<Value, AppError> {
    let store = app.store("workspace.json").map_err(|_| AppError::storage())?;
    read_snapshot(&StoreWorkspace { store })
}

#[tauri::command]
pub fn apply_workspace_change(app: AppHandle, input: ApplyInput) -> Result<Value, AppError> {
    let store = app.store("workspace.json").map_err(|_| AppError::storage())?;
    apply_change(&StoreWorkspace { store }, input)
}
