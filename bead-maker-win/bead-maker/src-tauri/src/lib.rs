use base64::{engine::general_purpose, Engine as _};
use ::image::{GenericImageView, ImageFormat, RgbaImage};
use ::image::imageops::FilterType;
use printpdf::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::{self, File};
use std::io::BufWriter;
use std::path::PathBuf;
use winreg::enums::*;
use winreg::RegKey;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BeadColor {
    pub name: String,
    pub r: u8,
    pub g: u8,
    pub b: u8,
    pub hex: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BeadStats {
    pub name: String,
    pub r: u8,
    pub g: u8,
    pub b: u8,
    pub hex: String,
    pub count: usize,
}

fn parse_hex_color(hex: &str) -> Option<(u8, u8, u8)> {
    if hex.starts_with('#') && hex.len() == 7 {
        let r = u8::from_str_radix(&hex[1..3], 16).ok()?;
        let g = u8::from_str_radix(&hex[3..5], 16).ok()?;
        let b = u8::from_str_radix(&hex[5..7], 16).ok()?;
        Some((r, g, b))
    } else {
        None
    }
}

fn color_distance(r1: u8, g1: u8, b1: u8, r2: u8, g2: u8, b2: u8) -> f64 {
    (((r1 as f64) - (r2 as f64)).powi(2)
        + ((g1 as f64) - (g2 as f64)).powi(2)
        + ((b1 as f64) - (b2 as f64)).powi(2))
    .sqrt()
}

fn find_closest_bead_color(r: u8, g: u8, b: u8, bead_colors: &[BeadColor]) -> BeadColor {
    let mut min_distance = f64::MAX;
    let mut closest = bead_colors.first().cloned().unwrap();

    for color in bead_colors {
        let dist = color_distance(r, g, b, color.r, color.g, color.b);
        if dist < min_distance {
            min_distance = dist;
            closest = color.clone();
        }
    }

    closest
}

#[tauri::command]
async fn process_image(
    image_path: String,
    pixel_width: u32,
    bead_colors_json: String,
) -> Result<(String, Vec<BeadStats>), String> {
    let bead_colors_map: HashMap<String, String> =
        serde_json::from_str(&bead_colors_json).map_err(|e| e.to_string())?;

    let bead_colors: Vec<BeadColor> = bead_colors_map
        .iter()
        .filter_map(|(name, hex)| {
            parse_hex_color(hex).map(|(r, g, b)| BeadColor {
                name: name.clone(),
                r,
                g,
                b,
                hex: hex.clone(),
            })
        })
        .collect();

    if bead_colors.is_empty() {
        return Err("No valid bead colors found".to_string());
    }

    let img = ::image::open(&image_path).map_err(|e| e.to_string())?;

    let (orig_width, orig_height) = img.dimensions();
    let ratio = orig_height as f32 / orig_width as f32;
    let target_height = ((pixel_width as f32) * ratio) as u32;

    let resized = ::image::imageops::resize(&img, pixel_width, target_height, FilterType::Nearest);

    let mut color_counts: HashMap<String, (BeadColor, usize)> = HashMap::new();

    for pixel in resized.pixels() {
        let rgba = pixel.0;
        let closest = find_closest_bead_color(rgba[0], rgba[1], rgba[2], &bead_colors);

        color_counts
            .entry(closest.name.clone())
            .and_modify(|(_, count)| *count += 1)
            .or_insert((closest.clone(), 1));
    }

    let mut stats: Vec<BeadStats> = color_counts
        .into_iter()
        .map(|(name, (color, count))| BeadStats {
            name,
            r: color.r,
            g: color.g,
            b: color.b,
            hex: color.hex,
            count,
        })
        .collect();

    stats.sort_by(|a, b| b.count.cmp(&a.count));

    let mut output_img = RgbaImage::new(pixel_width, target_height);

    for (x, y, pixel) in resized.enumerate_pixels() {
        let rgba = pixel.0;
        let closest = find_closest_bead_color(rgba[0], rgba[1], rgba[2], &bead_colors);
        output_img.put_pixel(x, y, ::image::Rgba([closest.r, closest.g, closest.b, 255]));
    }

    let mut buffer = Vec::new();
    let mut cursor = std::io::Cursor::new(&mut buffer);
    output_img
        .write_to(&mut cursor, ImageFormat::Png)
        .map_err(|e| e.to_string())?;

    let base64_image = general_purpose::STANDARD.encode(&buffer);

    Ok((format!("data:image/png;base64,{}", base64_image), stats))
}

#[tauri::command]
async fn save_files(
    image_path: String,
    pixel_width: u32,
    _bead_colors_json: String,
    stats: Vec<BeadStats>,
    image_data: String,
) -> Result<String, String> {
    let input_path = PathBuf::from(&image_path);
    let parent_dir = input_path.parent().ok_or("Invalid path")?;
    let file_stem = input_path.file_stem().unwrap().to_string_lossy();

    let base64_data = image_data
        .strip_prefix("data:image/png;base64,")
        .ok_or("Invalid image data")?;
    let image_bytes = general_purpose::STANDARD
        .decode(base64_data)
        .map_err(|e| e.to_string())?;

    let png_path = parent_dir.join(format!("{}_bead.png", file_stem));
    fs::write(&png_path, &image_bytes).map_err(|e| e.to_string())?;

    let pdf_path = parent_dir.join(format!("{}_bead.pdf", file_stem));
    create_pdf(&pdf_path, &stats, pixel_width, &input_path).map_err(|e| e.to_string())?;

    Ok(format!(
        "Files saved:\n1. {}\n2. {}",
        png_path.display(),
        pdf_path.display()
    ))
}

fn create_pdf(
    pdf_path: &PathBuf,
    stats: &[BeadStats],
    pixel_width: u32,
    original_path: &PathBuf,
) -> Result<(), String> {
    let (doc, page1, layer1) =
        PdfDocument::new("拼豆图统计", Mm(210.0), Mm(297.0), "Layer 1");

    let font = doc
        .add_builtin_font(BuiltinFont::Helvetica)
        .map_err(|e| e.to_string())?;
    let font_bold = doc
        .add_builtin_font(BuiltinFont::HelveticaBold)
        .map_err(|e| e.to_string())?;

    let current_layer = doc.get_page(page1).get_layer(layer1);

    current_layer.use_text("拼豆图统计报告", 24.0, Mm(20.0), Mm(270.0), &font_bold);
    current_layer.use_text(
        &format!("原图: {}", original_path.file_name().unwrap().to_string_lossy()),
        12.0,
        Mm(20.0),
        Mm(255.0),
        &font,
    );
    current_layer.use_text(&format!("拼豆宽度: {} 像素", pixel_width), 12.0, Mm(20.0), Mm(245.0), &font);

    let total_beads: usize = stats.iter().map(|s| s.count).sum();
    current_layer.use_text(&format!("总拼豆数: {}", total_beads), 12.0, Mm(20.0), Mm(235.0), &font);
    current_layer.use_text(&format!("不重复颜色数: {}", stats.len()), 12.0, Mm(20.0), Mm(225.0), &font);

    current_layer.use_text("颜色统计 (按数量降序):", 14.0, Mm(20.0), Mm(210.0), &font_bold);

    let mut y_pos = 195.0;
    let row_height = 7.0;

    for (i, stat) in stats.iter().enumerate() {
        if y_pos - row_height < 20.0 {
            break;
        }

        let rgb_hex = format!("#{:02X}{:02X}{:02X}", stat.r, stat.g, stat.b);
        let text = format!(
            "{}. {} - {} - {}个 ({:.2}%)",
            i + 1,
            stat.name,
            rgb_hex,
            stat.count,
            (stat.count as f64 / total_beads as f64) * 100.0
        );

        current_layer.use_text(&text, 10.0, Mm(20.0), Mm(y_pos), &font);
        y_pos -= row_height;
    }

    let file = File::create(pdf_path).map_err(|e| e.to_string())?;
    let mut writer = BufWriter::new(file);
    doc.save(&mut writer).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn register_context_menu(exe_path: String) -> Result<String, String> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);

    let shell_key = hkcu
        .create_subkey("Software\\Classes\\SystemFileAssociations\\image\\png\\shell\\BeadMaker")
        .map_err(|e| e.to_string())?
        .0;
    shell_key.set_value("", &"用拼豆图生成器打开").map_err(|e| e.to_string())?;
    shell_key.set_value("Icon", &exe_path).map_err(|e| e.to_string())?;

    let command_key = hkcu
        .create_subkey("Software\\Classes\\SystemFileAssociations\\image\\png\\shell\\BeadMaker\\command")
        .map_err(|e| e.to_string())?
        .0;
    command_key
        .set_value("", &format!("\"{}\" \"%1\"", exe_path))
        .map_err(|e| e.to_string())?;

    let shell_key_jpg = hkcu
        .create_subkey("Software\\Classes\\SystemFileAssociations\\image\\jpeg\\shell\\BeadMaker")
        .map_err(|e| e.to_string())?
        .0;
    shell_key_jpg.set_value("", &"用拼豆图生成器打开").map_err(|e| e.to_string())?;
    shell_key_jpg.set_value("Icon", &exe_path).map_err(|e| e.to_string())?;

    let command_key_jpg = hkcu
        .create_subkey("Software\\Classes\\SystemFileAssociations\\image\\jpeg\\shell\\BeadMaker\\command")
        .map_err(|e| e.to_string())?
        .0;
    command_key_jpg
        .set_value("", &format!("\"{}\" \"%1\"", exe_path))
        .map_err(|e| e.to_string())?;

    Ok("右键菜单注册成功!".to_string())
}

#[tauri::command]
fn unregister_context_menu() -> Result<String, String> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);

    let _ = hkcu.delete_subkey_all("Software\\Classes\\SystemFileAssociations\\image\\png\\shell\\BeadMaker");
    let _ = hkcu.delete_subkey_all("Software\\Classes\\SystemFileAssociations\\image\\jpeg\\shell\\BeadMaker");

    Ok("右键菜单已移除!".to_string())
}

#[tauri::command]
fn get_exe_path() -> Result<String, String> {
    std::env::current_exe()
        .map_err(|e| e.to_string())?
        .to_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "Failed to get exe path".to_string())
}

#[tauri::command]
fn read_file_as_base64(file_path: String) -> Result<String, String> {
    let bytes = fs::read(&file_path).map_err(|e| e.to_string())?;
    Ok(base64::engine::general_purpose::STANDARD.encode(&bytes))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            process_image,
            save_files,
            register_context_menu,
            unregister_context_menu,
            get_exe_path,
            read_file_as_base64
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}