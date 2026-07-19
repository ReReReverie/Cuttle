use serde::Serialize;
use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct GitCommit {
    hash: String,
    short_hash: String,
    author: String,
    timestamp: String,
    subject: String,
}

fn repository_path(value: &str) -> Result<PathBuf, String> {
    let path = Path::new(value)
        .canonicalize()
        .map_err(|_| "The selected repository could not be opened.".to_string())?;

    if !path.join(".git").exists() {
        return Err("The selected folder is not a Git repository.".to_string());
    }

    Ok(path)
}

fn validate_hash(hash: &str) -> Result<&str, String> {
    if (4..=40).contains(&hash.len()) && hash.chars().all(|character| character.is_ascii_hexdigit()) {
        Ok(hash)
    } else {
        Err("Invalid commit hash.".to_string())
    }
}

fn run_git(repo_path: &str, args: &[&str]) -> Result<String, String> {
    let repository = repository_path(repo_path)?;
    let output = Command::new("git")
        .arg("-C")
        .arg(repository)
        .args(args)
        .output()
        .map_err(|_| "Git is not installed or could not be started.".to_string())?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr).trim().to_string();
        return Err(if error.is_empty() { "Git command failed.".to_string() } else { error });
    }

    String::from_utf8(output.stdout).map_err(|_| "Git returned unreadable output.".to_string())
}

#[tauri::command]
fn git_log(repo_path: String) -> Result<Vec<GitCommit>, String> {
    let output = run_git(
        &repo_path,
        &[
            "log",
            "-n",
            "40",
            "--date=iso-strict",
            "--pretty=format:%H%x1f%h%x1f%an%x1f%aI%x1f%s",
        ],
    )?;

    Ok(output
        .lines()
        .filter_map(|line| {
            let fields: Vec<&str> = line.split('\u{1f}').collect();
            (fields.len() == 5).then(|| GitCommit {
                hash: fields[0].to_string(),
                short_hash: fields[1].to_string(),
                author: fields[2].to_string(),
                timestamp: fields[3].to_string(),
                subject: fields[4].to_string(),
            })
        })
        .collect())
}

#[tauri::command]
fn git_commit_files(repo_path: String, hash: String) -> Result<Vec<String>, String> {
    let safe_hash = validate_hash(&hash)?;
    let output = run_git(
        &repo_path,
        &["show", "--name-only", "--format=", "--no-renames", safe_hash],
    )?;

    Ok(output
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty())
        .take(100)
        .map(ToOwned::to_owned)
        .collect())
}

#[tauri::command]
fn git_status(repo_path: String) -> Result<String, String> {
    run_git(&repo_path, &["status", "--short", "--branch"])
}

#[tauri::command]
fn git_diff(repo_path: String, hash: String) -> Result<String, String> {
    let safe_hash = validate_hash(&hash)?;
    let output = run_git(
        &repo_path,
        &["show", "--format=", "--no-ext-diff", "--unified=3", safe_hash],
    )?;
    Ok(output.chars().take(120_000).collect())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            git_log,
            git_commit_files,
            git_status,
            git_diff
        ])
        .run(tauri::generate_context!())
        .expect("error while running PatchTrail");
}