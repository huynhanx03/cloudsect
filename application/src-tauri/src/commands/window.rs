use std::sync::Mutex;
use tauri::{LogicalSize, PhysicalPosition, PhysicalSize, WebviewWindow};

#[derive(Default)]
pub struct WindowModeState {
    full_bounds: Mutex<Option<(PhysicalSize<u32>, PhysicalPosition<i32>)>>,
}

#[tauri::command]
pub fn set_window_mode(window: WebviewWindow, state: tauri::State<'_, WindowModeState>, mode: String) -> Result<(), String> {
    match mode.as_str() {
        "compact" => {
            let mut bounds = state.full_bounds.lock().map_err(|_| "window_state".to_string())?;
            if bounds.is_none() {
                *bounds = Some((window.inner_size().map_err(|error| error.to_string())?, window.outer_position().map_err(|error| error.to_string())?));
            }
            drop(bounds);
            window.set_min_size(Some(LogicalSize::new(360.0, 250.0))).map_err(|error| error.to_string())?;
            window.set_always_on_top(true).map_err(|error| error.to_string())?;
            window.set_size(LogicalSize::new(380.0, 300.0)).map_err(|error| error.to_string())?;
            if let Some(monitor) = window.current_monitor().map_err(|error| error.to_string())? {
                let scale = monitor.scale_factor();
                let origin = monitor.position();
                let display = monitor.size();
                let width = (396.0 * scale).round() as i32;
                let height = (348.0 * scale).round() as i32;
                let x = origin.x.saturating_add(display.width as i32).saturating_sub(width).max(origin.x);
                let y = origin.y.saturating_add(display.height as i32).saturating_sub(height).max(origin.y);
                window.set_position(PhysicalPosition::new(x, y)).map_err(|error| error.to_string())?;
            }
            Ok(())
        }
        "full" => {
            window.set_always_on_top(false).map_err(|error| error.to_string())?;
            window.set_min_size(Some(LogicalSize::new(1000.0, 680.0))).map_err(|error| error.to_string())?;
            let bounds = state.full_bounds.lock().map_err(|_| "window_state".to_string())?.take();
            if let Some((size, position)) = bounds {
                window.set_size(size).map_err(|error| error.to_string())?;
                window.set_position(position).map_err(|error| error.to_string())
            } else {
                window.set_size(LogicalSize::new(1440.0, 900.0)).map_err(|error| error.to_string())
            }
        }
        _ => Err("unsupported_mode".to_string()),
    }
}
