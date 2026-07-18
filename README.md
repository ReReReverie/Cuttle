# PatchTrail

PatchTrail is a lightweight desktop developer tool for identifying bugs from meeting transcriptions, tickets, stack traces, and bug reports. It can propose fixes, generate regression tests, and optionally provide Git recovery commands.

## Setup

Requirements: Node.js 20+, npm, and Git.

```bash
npm install
npm run dev
npm run build
```

The current project is a React + TypeScript + Vite prototype. The target product is a packaged desktop application using Tauri. Tauri commands should handle local repository access and Git operations.

## AI account setup

PatchTrail should support provider account login through official OAuth/device authorization when that flow provides developer API access. It should also support user API keys when account login does not grant API access.

Planned providers:

- Gemini
- OpenAI / ChatGPT developer API
- Grok
- Mock/offline provider

After login or API-key validation, PatchTrail automatically selects the matching provider. Consumer chat login is not automatically equivalent to developer API access. Never scrape chat websites or store session cookies.

For local development, use mock mode or environment variables that are never committed:

```powershell
$env:PATCHTRAIL_PROVIDER = "gemini"
$env:PATCHTRAIL_API_KEY = "your-key"
npm run dev
```

Production tokens and API keys must be stored in the operating-system credential store.

## Product rules

- The main flow is paste context -> identify bug -> review fix -> apply approved change.
- Do not display a numeric confidence score.
- Git History is optional and hidden behind a button or separate window.
- Review patches before applying them.
- Never execute `git reset --hard` without explicit confirmation.
- Never send `.env`, keys, or unrelated files to an AI provider.
- Keep a mock/offline mode for demos and tests.

See `implementation_setup.md` for the complete architecture and acceptance criteria.
