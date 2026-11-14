mod commands;
mod domains;
mod infrastructure;

pub fn run() {
    tauri::Builder::default()
        .manage(commands::window::WindowModeState::default())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            commands::workspace::load_workspace,
            commands::workspace::apply_workspace_change,
            commands::window::set_window_mode,
        ])
        .run(tauri::generate_context!())
        .expect("CloudSect failed to start");
}
