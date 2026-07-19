# Cuttle

Cuttle is a local-first desktop engineering workspace that turns meeting notes, tickets, stack traces, and bug reports into actionable tasks. It provides reviewable patch previews, regression-test stubs, real local Git history, and copy-only recovery commands.

## Judge quick start — no rebuild required

Download the latest [Cuttle GitHub Release](https://github.com/ReReReverie/PatchTrail/releases/latest) and choose the package for the judge's machine:

| Judge machine | Download | Launch |
|---|---|---|
| Windows 10/11 x64 | Cuttle-v<version>-windows-x64-portable.zip | Extract and run Cuttle.exe |
| macOS Apple Silicon | Cuttle-v<version>-macos-arm64.dmg | Drag Cuttle to Applications |
| macOS Intel | Cuttle-v<version>-macos-x64.dmg | Drag Cuttle to Applications |
| Linux x64 | Cuttle-v<version>-linux-x64-appimage.AppImage | Make executable, then run |
| Ubuntu/Debian x64 | Cuttle-v<version>-linux-x64-deb.deb | Install with the system package manager |

The offline demo requires no account, API key, network connection, Node.js, or Rust installation. The application does not modify the selected repository, and every Git recovery command is copy-only.

Use [release/JUDGE_TESTING.md](release/JUDGE_TESTING.md) for the two-minute acceptance checklist and platform launch notes.

## Installation

### Windows

The portable ZIP requires Windows 10/11 x64 and Microsoft Edge WebView2. Extract it to a writable folder and run Cuttle.exe; no administrator access is required. The NSIS setup executable is also available when an installer is preferred. If Windows SmartScreen appears, choose More info, then Run anyway because the prototype is not code-signed.

### macOS

Use the DMG matching the Mac's processor: arm64 for Apple Silicon or x64 for Intel. Drag Cuttle to Applications and open it. The build is ad-hoc signed but not notarized; if macOS blocks it, open System Settings, Privacy & Security, Open Anyway, and then relaunch.

### Linux

The AppImage is the most portable option: make it executable with chmod +x Cuttle-*.AppImage and run it. Use the .deb package on Ubuntu or Debian. AppImage launch may require FUSE on older distributions; the .deb package is the fallback.

### Development setup

Requirements:

- Node.js 20+
- Rust stable with the MSVC toolchain on Windows
- Git
- Microsoft Edge WebView2 Runtime on Windows
- WebKitGTK 4.1 development packages on Linux

~~~powershell
npm ci
npm run desktop
~~~

Create an optimized native executable:

~~~powershell
npm run desktop:build
~~~

Use npm run dev only for React interface work in a browser; repository selection and real Git history require the Tauri desktop window.

## Supported platforms

| Platform | Release target | Validation |
|---|---|---|
| Windows 10/11 x64 | Portable ZIP and NSIS installer | Locally smoke-tested and CI-built |
| macOS 12+ Apple Silicon | Ad-hoc signed DMG | Native macOS CI build and package smoke check |
| macOS 12+ Intel | Ad-hoc signed DMG | Native macOS CI build and package smoke check |
| Linux x64 | AppImage and Debian package | Ubuntu 22.04 CI build and package smoke check |

The release workflow runs on native GitHub-hosted runners, so a local Mac or Linux machine is not required to produce these artifacts. The project does not claim manual hardware testing for macOS or Linux.

## Current capabilities

- Deterministic, offline extraction of tasks from pasted engineering context or imported text files
- Editable priority, owner, and status
- Reviewable patch diff with plain-English root-cause guidance
- Copyable regression-test stubs
- Isolated patch verification in a temporary Git worktree, with available project tests and builds
- Native folder picker and Rust-backed Git history for a selected repository
- Safe branch, detached exploration, and single-file recovery commands
- Clearly separated hard-reset command with a destructive warning
- Persistent system/dark/light theme preference
- Collapsible workspace activity ledger

No Git recovery command runs automatically. Approving a suggested fix currently completes the task and records the review; it does not modify repository files.

## AI providers

Cuttle works without AI credentials in **Offline demo** mode. Bug Detective can also use one of four user-controlled providers:

| Provider | Default model | Account or key | Network behavior |
| --- | --- | --- | --- |
| Local open-source | `gpt-oss:20b` | None by default | Loopback-only Ollama or LM Studio server |
| OpenAI API | `gpt-5.6-sol` | OpenAI Platform API key | Fixed `api.openai.com` endpoint |
| Gemini API | `gemini-3.5-flash` | Google AI Studio API key | Fixed Google Generative Language endpoint |
| Grok API | `grok-4.5` | xAI API key | Fixed `api.x.ai` endpoint |

Provider keys, local tokens, model names, and the local server URL are held in application memory only and are cleared when Cuttle closes. They are never written to localStorage or repository files. Cloud requests contain only the selected task title, description, and target-file path. Cuttle does not scrape consumer chat sites or reuse browser sessions.

The local provider accepts OpenAI-compatible `/v1/chat/completions` servers on `localhost`, `127.0.0.1`, or `::1`. Remote custom hosts, embedded URL credentials, query strings, fragments, and HTTP redirects are rejected by the Rust backend.

## Product rules

- The main flow is paste context → identify bug → review fix → approve.
- Do not display a numeric confidence score.
- Git history remains optional and hidden behind a button.
- Review patches before applying them.
- Never execute git reset --hard from the application.
- Never send .env, credentials, or unrelated files to an AI provider.
- Keep mock/offline mode for demos and tests.
## Hackathon submission notes

Recommended category: Dev Tools.

Cuttle was brainstormed in Codex, planned in Codex, and built collaboratively with Codex. Codex translated the implementation plan into a native Tauri desktop app, implemented the React workflow and Rust Git bridge, resolved Windows build/toolchain issues, added system-aware theming, created the offline demo fixture, and verified the frontend build, Rust backend, native executable, portable ZIP, and clean-package launch.

Codex accelerated the workflow by keeping the first version deterministic and local: task extraction, patch previews, regression-test stubs, demo history, and the activity ledger work without external API credentials. Key product decisions were made deliberately: advanced features stay behind focused controls, patches require review, and Git recovery commands are copy-only.

Codex Session ID for /feedback: 019f75e1-7962-77c1-89ea-d76694d1d97d

The exact GPT-5.6 model label should be confirmed in the Codex model picker before submitting. The submission package includes SUBMISSION.md and DEMO_VIDEO_SCRIPT.md for the remaining manual hackathon fields.

### AI provider setup

Open **AI provider** in the top-right corner and choose a mode. The popup displays the matching checklist, model field, credential field, and a copyable official setup page.

#### Local open-source model with Ollama

1. Install [Ollama](https://ollama.com/download) on Windows, macOS, or Linux.
2. Pull a model, for example `ollama pull gpt-oss:20b`.
3. Keep Ollama running. Its OpenAI-compatible URL is normally `http://127.0.0.1:11434/v1`.
4. Choose **Local open-source**, enter the exact pulled model name, and analyze a task. No token is required for Ollama's default local configuration.

LM Studio is also supported: load a model, start the local server in its Developer tab, and use `http://127.0.0.1:1234/v1`. If LM Studio authentication is enabled, paste its local server token into the optional token field.

#### OpenAI API

1. Create a key at [OpenAI Platform](https://platform.openai.com/api-keys) and configure API billing.
2. Choose **OpenAI API**, paste the key, and confirm the model available to the account.
3. ChatGPT subscriptions and API billing are separate; Cuttle does not use ChatGPT cookies or sessions.

#### Gemini API

1. Create a key in [Google AI Studio](https://aistudio.google.com/apikey) and configure the associated project/billing if required.
2. Choose **Gemini API**, paste the key, and use `gemini-3.5-flash` or another compatible model available to the project.

#### Grok API

1. Create an API key and configure credits in the [xAI Console](https://console.x.ai/).
2. Choose **Grok API**, paste the key, and use `grok-4.5` or another model available to the API team.

Select an extracted task and click **Analyze bug** after configuration. Judges can test every core workflow in **Offline demo** mode without an account, key, billing, local model installation, or network access.
