use crate::domains::workspace::service::{AppError, WorkspaceStore};
use serde_json::Value;
use tauri_plugin_store::Store;

pub struct StoreWorkspace {
    pub store: std::sync::Arc<Store<tauri::Wry>>,
}

impl WorkspaceStore for StoreWorkspace {
    fn load(&self) -> Result<Option<Value>, AppError> {
        Ok(self.store.get("demo_workspace_v1"))
    }

    fn save(&self, snapshot: &Value) -> Result<(), AppError> {
        self.store.set("demo_workspace_v1", snapshot.clone());
        self.store.save().map_err(|_| AppError::storage())
    }
}
