# PatchTrail demo video script

Target duration: 2 minutes 20 seconds. Record the application window and use voice narration. Do not include copyrighted music or third-party branded material.

## 0:00–0:15 — What it is

“PatchTrail is a local-first developer tool that turns meeting notes and bug reports into reviewed engineering work. It runs as a native desktop app, works offline, and keeps Git recovery under the developer's control.”

## 0:15–0:45 — Extract tasks

Open the app with the sample context visible. Click Extract tasks.

“I paste a short checkout incident transcript. PatchTrail deterministically extracts separate tasks with owners, priorities, statuses, and target files. The task queue keeps the first screen focused on the work that needs attention.”

## 0:45–1:20 — Review a bug

Select the 204 response task and click Analyze bug.

“Bug Detective explains the likely root cause, shows a reviewable diff, and keeps the repository unchanged. The Regression tests tab provides copyable test stubs. I can edit the owner, priority, or status inline, then approve the suggested fix. Approval records the review and completes the task; it does not silently edit files.”

## 1:20–1:55 — Git recovery

Open Git history and select a commit.

“Git History is intentionally hidden behind a button so the main workflow stays clean. It can show demo history immediately, or read a selected local repository through the Rust backend. The recovery helper provides Explore, Branch recovery, and Single file restore commands. Even Hard reset is only copied, never executed.”

## 1:55–2:10 — Collaboration with Codex and GPT-5.6

“I used Codex with GPT-5.6 to turn the implementation plan into the working Tauri and React application, resolve the desktop-toolchain issues, build the Rust Git bridge, and prepare a judge-ready portable package. Codex also helped keep the product local-first and safety-focused.”

## 2:10–2:20 — Close

Open the Activity ledger and theme control.

“The activity ledger keeps workspace actions visible, and the app follows the system theme with a manual dark or light option. Judges can extract the included ZIP and run the demo without rebuilding.”

