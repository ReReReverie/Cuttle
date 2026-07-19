# PatchTrail

PatchTrail is a local-first desktop engineering workspace that turns meeting notes, tickets, stack traces, and bug reports into actionable tasks. It provides reviewable patch previews, regression-test stubs, real local Git history, and copy-only recovery commands.

## Judge quick start â€” no rebuild required

The ready-to-run Windows package is in **release/PatchTrail-windows-x64.zip**.

1. Extract the ZIP.
2. Run **PatchTrail.exe**.
3. If Windows SmartScreen appears, choose **More info â†’ Run anyway**. The prototype is not code-signed.
4. Use the included sample context and select **Extract tasks**.
5. Select a task, choose **Analyze bug**, review the patch, and open **Regression tests**.
6. Open **Git history**. The bundled demo data works without setup; select **Choose repository** to test against any local Git repository.

No account, API key, network connection, Node.js, or Rust installation is required for this path. The application does not modify the selected repository, and every Git recovery command is copy-only.

See **release/PatchTrail-windows-x64/JUDGE_TESTING.md** for a two-minute acceptance checklist.

## Installation

### Portable Windows build

- Requirement: Windows 10 or 11 with Microsoft Edge WebView2 Runtime. WebView2 is included by default on supported Windows versions.
- Extract **release/PatchTrail-windows-x64.zip** to a writable folder and launch **PatchTrail.exe**.
- No administrator access or installer is required.

### Development setup

Requirements:

- Node.js 20+
- Rust stable with the MSVC toolchain on Windows
- Git
- Microsoft Edge WebView2 Runtime on Windows

~~~powershell
npm install
npm run desktop
~~~

Create an optimized native executable:

~~~powershell
npm run desktop:build
~~~

The executable is written to **src-tauri/target/release/patchtrail.exe**. Use **npm run dev** only when working on the React interface in a browser; repository selection and real Git history require the Tauri desktop window.

## Supported platforms

| Platform | Status | Notes |
|---|---|---|
| Windows 10/11 x64 | Tested and packaged | Use the portable judge build. |
| macOS 12+ | Source-compatible, unverified | Requires Xcode Command Line Tools and a local Tauri build. No signed package is included. |
| Linux x64 | Source-compatible, unverified | Requires WebKitGTK and standard Tauri system dependencies. No package is included. |

The submitted binary is Windows x64 only. The React/Tauri source is cross-platform, but macOS and Linux are not claimed as tested release targets.

## Current capabilities

- Deterministic, offline extraction of tasks from pasted engineering context
- Editable priority, owner, and status
- Reviewable patch diff with plain-English root-cause guidance
- Copyable regression-test stubs
- Native folder picker and Rust-backed Git history for a selected repository
- Safe branch, detached exploration, and single-file recovery commands
- Clearly separated hard-reset command with a destructive warning
- Persistent system/dark/light theme preference
- Collapsible workspace activity ledger

No Git recovery command runs automatically. Approving a suggested fix currently completes the task and records the review; it does not modify repository files.

## AI provider direction

The current implementation is intentionally functional offline. A future provider layer may support Gemini, OpenAI, Grok, and mock mode. Provider credentials must use the operating-system credential store, and unrelated repository files must never be sent to a provider.

Consumer chat login is not automatically equivalent to developer API access. Never scrape chat websites or store session cookies.

## Product rules

- The main flow is paste context â†’ identify bug â†’ review fix â†’ approve.
- Do not display a numeric confidence score.
- Git history remains optional and hidden behind a button.
- Review patches before applying them.
- Never execute git reset --hard from the application.
- Never send .env, credentials, or unrelated files to an AI provider.
- Keep mock/offline mode for demos and tests.
## Hackathon submission notes

Recommended category: Dev Tools.

PatchTrail was brainstormed in Codex, planned in Codex, and built collaboratively with Codex. Codex translated the implementation plan into a native Tauri desktop app, implemented the React workflow and Rust Git bridge, resolved Windows build/toolchain issues, added system-aware theming, created the offline demo fixture, and verified the frontend build, Rust backend, native executable, portable ZIP, and clean-package launch.

Codex accelerated the workflow by keeping the first version deterministic and local: task extraction, patch previews, regression-test stubs, demo history, and the activity ledger work without external API credentials. Key product decisions were made deliberately: advanced features stay behind focused controls, patches require review, and Git recovery commands are copy-only.

Project Codex Session ID: 019f75e1-7962-77c1-89ea-d76694d1d97d

The exact GPT-5.6 model label should be confirmed in the Codex model picker before submitting. The submission package includes SUBMISSION.md and DEMO_VIDEO_SCRIPT.md for the remaining manual hackathon fields.


