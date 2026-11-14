use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplyInput {
    pub expected_revision: u64,
    pub change: WorkspaceChange,
}

#[derive(Debug, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase", rename_all_fields = "camelCase")]
pub enum WorkspaceChange {
    CreateAgent { name: String, robe_color: String },
    UpdateAgentProfile { agent_id: String, name: String, island_name: String, robe_color: String },
    RenameAgent { agent_id: String, name: String },
    RenameIsland { island_id: String, name: String },
    SetRobeColor { agent_id: String, color: String },
    AssignSession { session_id: String, agent_id: Option<String> },
    MoveAgent { agent_id: String, island_id: String },
    SetSessionArea { session_id: String, area_id: String },
    SetSessionHidden { session_id: String, hidden: bool },
    UpdatePreferences { patch: serde_json::Value },
}

