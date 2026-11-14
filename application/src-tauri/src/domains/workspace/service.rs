use super::model::{ApplyInput, WorkspaceChange};
use serde::Serialize;
use serde_json::{json, Value};
use std::fmt;
use uuid::Uuid;

const COLORS: [&str; 8] = ["#3d836c", "#b9794a", "#766da4", "#68856a", "#b35f59", "#477d92", "#9a784f", "#72809a"];
const AREAS: [&str; 6] = ["implementation", "research", "testing", "design", "council", "rest"];
const FIXTURE: &str = include_str!("../../../../src/fixtures/demo-workspace.json");

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppError {
    pub code: &'static str,
    pub detail: &'static str,
}

impl AppError {
    pub fn storage() -> Self { Self { code: "storage", detail: "workspace_store" } }
    fn validation(detail: &'static str) -> Self { Self { code: "validation", detail } }
    fn not_found(detail: &'static str) -> Self { Self { code: "not_found", detail } }
    fn conflict(detail: &'static str) -> Self { Self { code: "conflict", detail } }
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result { write!(f, "{}:{}", self.code, self.detail) }
}

pub trait WorkspaceStore {
    fn load(&self) -> Result<Option<Value>, AppError>;
    fn save(&self, snapshot: &Value) -> Result<(), AppError>;
}

pub fn read_snapshot(store: &impl WorkspaceStore) -> Result<Value, AppError> {
    if let Some(snapshot) = store.load()? { return Ok(snapshot); }
    let snapshot: Value = serde_json::from_str(FIXTURE).map_err(|_| AppError::storage())?;
    store.save(&snapshot)?;
    Ok(snapshot)
}

pub fn apply_change(store: &impl WorkspaceStore, input: ApplyInput) -> Result<Value, AppError> {
    let current = read_snapshot(store)?;
    let revision = current.get("revision").and_then(Value::as_u64).ok_or_else(AppError::storage)?;
    if input.expected_revision != revision { return Err(AppError::conflict("revision")); }
    let mut next = current.clone();
    match input.change {
        WorkspaceChange::CreateAgent { name, robe_color } => {
            let name = valid_name(&name)?;
            validate_color(&robe_color)?;
            let order = next["islands"].as_array().map(|islands| islands.iter().filter_map(|island| island["order"].as_u64()).max().unwrap_or(0) + 1).unwrap_or(0);
            let id = Uuid::new_v4().to_string();
            let island_id = Uuid::new_v4().to_string();
            let biome = ["pine", "blossom", "bamboo", "cloud"][order as usize % 4];
            next["agents"].as_array_mut().ok_or_else(AppError::storage)?.push(json!({
                "id": id, "name": name, "title": "Đệ tử mới", "robeColor": robe_color, "islandId": island_id, "avatarSeed": order + 100
            }));
            next["islands"].as_array_mut().ok_or_else(AppError::storage)?.push(json!({
                "id": island_id, "name": name, "biome": biome, "layoutSeed": order + 100, "order": order
            }));
        }
        WorkspaceChange::UpdateAgentProfile { agent_id, name, island_name, robe_color } => {
            let name = valid_name(&name)?;
            let island_name = valid_name(&island_name)?;
            validate_color(&robe_color)?;
            let island_id = find(&next["agents"], &agent_id, "agent")?["islandId"].as_str()
                .ok_or_else(AppError::storage)?.to_owned();
            let agent = find_mut(&mut next["agents"], &agent_id, "agent")?;
            agent["name"] = json!(name);
            agent["robeColor"] = json!(robe_color);
            let island = find_mut(&mut next["islands"], &island_id, "island")?;
            island["name"] = json!(island_name);
        }
        WorkspaceChange::RenameAgent { agent_id, name } => {
            let agent = find_mut(&mut next["agents"], &agent_id, "agent")?;
            agent["name"] = json!(valid_name(&name)?);
        }
        WorkspaceChange::RenameIsland { island_id, name } => {
            let island = find_mut(&mut next["islands"], &island_id, "island")?;
            island["name"] = json!(valid_name(&name)?);
        }
        WorkspaceChange::SetRobeColor { agent_id, color } => {
            validate_color(&color)?;
            let agent = find_mut(&mut next["agents"], &agent_id, "agent")?;
            agent["robeColor"] = json!(color);
        }
        WorkspaceChange::AssignSession { session_id, agent_id } => {
            if let Some(id) = agent_id.as_deref() { find(&next["agents"], id, "agent")?; }
            let session = find_mut(&mut next["sessions"], &session_id, "session")?;
            session["agentId"] = agent_id.map_or(Value::Null, Value::String);
        }
        WorkspaceChange::MoveAgent { agent_id, island_id } => {
            find(&next["islands"], &island_id, "island")?;
            let occupied = next["agents"].as_array().is_some_and(|agents| agents.iter().any(|agent| {
                agent["id"].as_str() != Some(&agent_id) && agent["islandId"].as_str() == Some(&island_id)
            }));
            if occupied { return Err(AppError::conflict("island_occupied")); }
            let agent = find_mut(&mut next["agents"], &agent_id, "agent")?;
            agent["islandId"] = json!(island_id);
        }
        WorkspaceChange::SetSessionArea { session_id, area_id } => {
            if !AREAS.contains(&area_id.as_str()) { return Err(AppError::validation("area_id")); }
            let session = find_mut(&mut next["sessions"], &session_id, "session")?;
            session["areaId"] = json!(area_id);
        }
        WorkspaceChange::SetSessionHidden { session_id, hidden } => {
            let session = find_mut(&mut next["sessions"], &session_id, "session")?;
            session["hidden"] = json!(hidden);
        }
        WorkspaceChange::UpdatePreferences { patch } => {
            let prefs = next["preferences"].as_object_mut().ok_or_else(AppError::storage)?;
            if let Some(locale) = patch.get("locale").and_then(Value::as_str) {
                if !["vi", "en"].contains(&locale) { return Err(AppError::validation("locale")); }
                prefs.insert("locale".into(), json!(locale));
            }
            for (key, allowed) in [
                ("theme", &["light", "dark", "system"][..]),
                ("motion", &["system", "reduced", "full"][..]),
                ("quality", &["auto", "low", "balanced"][..]),
            ] {
                if let Some(value) = patch.get(key).and_then(Value::as_str) {
                    if !allowed.contains(&value) { return Err(AppError::validation("preference")); }
                    prefs.insert(key.into(), json!(value));
                }
            }
        }
    }
    next["revision"] = json!(revision + 1);
    store.save(&next)?;
    Ok(next)
}

fn valid_name(name: &str) -> Result<String, AppError> {
    let trimmed = name.trim();
    let count = trimmed.chars().count();
    if !(1..=40).contains(&count) { return Err(AppError::validation("name")); }
    Ok(trimmed.to_owned())
}

fn validate_color(color: &str) -> Result<(), AppError> {
    if COLORS.contains(&color) { Ok(()) } else { Err(AppError::validation("robe_color")) }
}

fn find<'a>(items: &'a Value, id: &str, entity: &'static str) -> Result<&'a Value, AppError> {
    items.as_array().and_then(|array| array.iter().find(|value| value["id"].as_str() == Some(id)))
        .ok_or_else(|| AppError::not_found(entity))
}

fn find_mut<'a>(items: &'a mut Value, id: &str, entity: &'static str) -> Result<&'a mut Value, AppError> {
    items.as_array_mut().and_then(|array| array.iter_mut().find(|value| value["id"].as_str() == Some(id)))
        .ok_or_else(|| AppError::not_found(entity))
}

