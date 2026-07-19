# Hackathon submission notes

## Recommended category

Dev Tools â€” developer productivity, bug triage, code review, and safe Git recovery.

## Project description

PatchTrail is a local-first desktop workspace for turning messy engineering context into reviewed action. A developer pastes a meeting transcript, ticket, stack trace, or bug report; PatchTrail extracts actionable tasks with owners, priorities, target files, and statuses. Selecting a task opens Bug Detective, which presents a deterministic root-cause explanation, a reviewable before/after diff, and regression-test stubs. Git History is an optional time-machine drawer backed by the selected repository's real local history. Recovery commands are parameterized and copy-only, with hard reset visibly marked destructive. The app works offline, follows the system theme, and never changes repository files automatically.

## Repository and judge package

- Repository: https://github.com/ReReReverie/PatchTrail
- Ready-to-run package: release/PatchTrail-windows-x64.zip
- Judge checklist: release/PatchTrail-windows-x64/JUDGE_TESTING.md
- Tested package platform: Windows 10/11 x64

## Codex collaboration

Codex was involved from the beginning: the product was brainstormed in Codex, the implementation plan was written in Codex, and the implementation was completed in Codex. Codex was the primary implementation partner throughout the project. It translated the implementation plan into a working product, rebuilt the initial scaffold as a native Tauri desktop app when the product requirement was clarified, implemented the React interface and Rust Git bridge, added system-aware theming, and verified the frontend build, Rust backend, native release executable, and portable ZIP launch.

Codex accelerated the workflow by keeping the core experience local and deterministic: task extraction, patch previews, test stubs, demo data, and the activity ledger were implemented without waiting on an external AI service or API credentials. Product decisions remained explicit: the main screen stays simple, advanced features are hidden behind Git History, Regression tests, and Activity controls, and no Git recovery command is executed automatically.

GPT-5.6/Codex contribution note: confirm the exact model label shown in the Codex model picker before submitting. The core implementation thread is:

Codex Session ID: 019f75e1-7962-77c1-89ea-d76694d1d97d

## Video requirement

The demonstration video is intentionally not generated in this workspace. Record a sub-three-minute screen capture with voiceover using DEMO_VIDEO_SCRIPT.md, upload it publicly to YouTube, and paste the URL into the hackathon submission form.


