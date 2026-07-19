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

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct AiInsight {
    text: String,
    model: String,
    provider: String,
}

fn analysis_prompt(task_title: &str, task_description: &str, target_file: &str) -> String {
    format!(
        "You are PatchTrail Bug Detective. Analyze this engineering task and respond in 3 concise paragraphs: (1) likely root cause, (2) a safe fix recommendation, and (3) one regression test idea. Do not claim to have edited files. Keep it under 180 words.\n\nTask: {task_title}\nContext: {task_description}\nTarget file: {target_file}"
    )
}

fn responses_text(value: &serde_json::Value) -> Option<String> {
    if let Some(text) = value.get("output_text").and_then(|item| item.as_str()) {
        if !text.trim().is_empty() {
            return Some(text.to_string());
        }
    }

    value.get("output")?.as_array()?
        .iter()
        .flat_map(|item| item.get("content").and_then(|content| content.as_array()).into_iter().flatten())
        .filter_map(|content| content.get("text").and_then(|text| text.as_str()))
        .find(|text| !text.trim().is_empty())
        .map(ToOwned::to_owned)
}

fn chat_text(value: &serde_json::Value) -> Option<String> {
    value.get("choices")?.as_array()?.first()?
        .get("message")?.get("content")?.as_str()
        .filter(|text| !text.trim().is_empty())
        .map(ToOwned::to_owned)
}

fn gemini_text(value: &serde_json::Value) -> Option<String> {
    value.get("candidates")?.as_array()?.first()?
        .get("content")?.get("parts")?.as_array()?
        .iter()
        .filter_map(|part| part.get("text").and_then(|text| text.as_str()))
        .find(|text| !text.trim().is_empty())
        .map(ToOwned::to_owned)
}

fn local_chat_url(value: &str) -> Result<reqwest::Url, String> {
    let mut url = reqwest::Url::parse(value.trim())
        .map_err(|_| "Enter a valid local model server URL.".to_string())?;
    let host = url.host_str().unwrap_or_default();
    if !matches!(host, "localhost" | "127.0.0.1" | "::1" | "[::1]") {
        return Err("Local model servers must use localhost or a loopback address.".to_string());
    }
    if !matches!(url.scheme(), "http" | "https") || !url.username().is_empty() || url.password().is_some() {
        return Err("The local model URL must use HTTP(S) without embedded credentials.".to_string());
    }
    if url.query().is_some() || url.fragment().is_some() {
        return Err("The local model URL cannot include a query or fragment.".to_string());
    }

    let path = url.path().trim_end_matches('/');
    let endpoint = if path.ends_with("/chat/completions") {
        path.to_string()
    } else if path.ends_with("/v1") {
        format!("{path}/chat/completions")
    } else {
        format!("{path}/v1/chat/completions")
    };
    url.set_path(&endpoint);
    Ok(url)
}

async fn response_json(response: reqwest::Response, provider: &str) -> Result<serde_json::Value, String> {
    let status = response.status();
    let raw = response.text().await
        .map_err(|_| format!("{provider} returned unreadable output."))?;
    if !status.is_success() {
        return Err(format!("{provider} request failed ({}). Check the key, model access, billing, and local server status.", status.as_u16()));
    }
    serde_json::from_str(&raw).map_err(|_| format!("{provider} returned an unexpected response."))
}

#[tauri::command]
async fn ai_analyze(
    provider: String,
    api_key: String,
    model: String,
    base_url: String,
    task_title: String,
    task_description: String,
    target_file: String,
) -> Result<AiInsight, String> {
    let provider = provider.trim().to_lowercase();
    let key = api_key.trim();
    let requested_model = model.trim();
    if requested_model.is_empty() || requested_model.len() > 120 {
        return Err("Enter a valid model name.".to_string());
    }
    if provider == "gemini" && !requested_model.chars().all(|character| character.is_ascii_alphanumeric() || matches!(character, '-' | '_' | '.')) {
        return Err("The Gemini model name contains unsupported characters.".to_string());
    }
    if provider != "local" && key.is_empty() {
        return Err("Enter an API key for the selected provider.".to_string());
    }

    let prompt = analysis_prompt(&task_title, &task_description, &target_file);
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(90))
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .map_err(|_| "Could not initialize the AI client.".to_string())?;

    let (label, text) = match provider.as_str() {
        "openai" => {
            let body = serde_json::json!({ "model": requested_model, "input": prompt });
            let response = client.post("https://api.openai.com/v1/responses")
                .bearer_auth(key).json(&body).send().await
                .map_err(|_| "Could not reach the OpenAI API.".to_string())?;
            let value = response_json(response, "OpenAI").await?;
            let text = responses_text(&value).ok_or_else(|| "OpenAI returned no analysis text.".to_string())?;
            ("OpenAI", text)
        }
        "gemini" => {
            let endpoint = format!("https://generativelanguage.googleapis.com/v1beta/models/{requested_model}:generateContent");
            let body = serde_json::json!({ "contents": [{ "parts": [{ "text": prompt }] }] });
            let response = client.post(endpoint).header("x-goog-api-key", key).json(&body).send().await
                .map_err(|_| "Could not reach the Gemini API.".to_string())?;
            let value = response_json(response, "Gemini").await?;
            let text = gemini_text(&value).ok_or_else(|| "Gemini returned no analysis text.".to_string())?;
            ("Gemini", text)
        }
        "grok" => {
            let body = serde_json::json!({ "model": requested_model, "input": prompt });
            let response = client.post("https://api.x.ai/v1/responses")
                .bearer_auth(key).json(&body).send().await
                .map_err(|_| "Could not reach the xAI API.".to_string())?;
            let value = response_json(response, "Grok").await?;
            let text = responses_text(&value).ok_or_else(|| "Grok returned no analysis text.".to_string())?;
            ("Grok", text)
        }
        "local" => {
            let endpoint = local_chat_url(&base_url)?;
            let body = serde_json::json!({
                "model": requested_model,
                "messages": [{ "role": "user", "content": prompt }],
                "stream": false
            });
            let mut request = client.post(endpoint).json(&body);
            if !key.is_empty() {
                request = request.bearer_auth(key);
            }
            let response = request.send().await
                .map_err(|_| "Could not reach the local model server. Confirm that Ollama or LM Studio is running.".to_string())?;
            let value = response_json(response, "Local model").await?;
            let text = chat_text(&value).or_else(|| responses_text(&value))
                .ok_or_else(|| "The local model returned no analysis text.".to_string())?;
            ("Local model", text)
        }
        _ => return Err("Unsupported AI provider.".to_string()),
    };

    Ok(AiInsight {
        text,
        model: requested_model.to_string(),
        provider: label.to_string(),
    })
}

#[cfg(test)]
mod ai_tests {
    use super::*;

    #[test]
    fn local_urls_are_loopback_only() {
        assert!(local_chat_url("http://127.0.0.1:11434/v1").is_ok());
        assert!(local_chat_url("http://localhost:1234/v1").is_ok());
        assert!(local_chat_url("https://example.com/v1").is_err());
    }

    #[test]
    fn parses_supported_response_shapes() {
        let responses = serde_json::json!({"output": [{"content": [{"type": "output_text", "text": "result"}]}]});
        let chat = serde_json::json!({"choices": [{"message": {"content": "result"}}]});
        let gemini = serde_json::json!({"candidates": [{"content": {"parts": [{"text": "result"}]}}]});
        assert_eq!(responses_text(&responses).as_deref(), Some("result"));
        assert_eq!(chat_text(&chat).as_deref(), Some("result"));
        assert_eq!(gemini_text(&gemini).as_deref(), Some("result"));
    }
}
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            git_log,
            git_commit_files,
            git_status,
            git_diff,
            ai_analyze
        ])
        .run(tauri::generate_context!())
        .expect("error while running PatchTrail");
}