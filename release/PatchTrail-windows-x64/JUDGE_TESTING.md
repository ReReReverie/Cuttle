# PatchTrail judge testing

This package runs without a build, account, API key, or network connection.

## Two-minute acceptance test

1. Launch PatchTrail.exe.
2. Confirm that the app follows the Windows theme. Use the top-right theme button to cycle system, dark, and light modes.
3. Keep the provided checkout transcript and click Extract tasks.
4. Confirm that task cards appear progressively and include owner, priority, target file, and status.
5. Select the checkout task and click Analyze bug.
6. Confirm that the result shows a plain-English confidence label, root cause, red/green diff, and a Review required notice.
7. Open Regression tests and copy a test stub.
8. Click Approve fix and confirm that the task is completed and the activity counter updates.
9. Open Git history. Demo history is immediately available.
10. Optional: click Choose repository and select a local Git repository. Confirm that its commits and changed files load.
11. Copy Branch recovery or Restore one file. Confirm that PatchTrail only copies the command and does not run it.
12. Inspect Hard reset and confirm that it is visibly marked destructive.

## Optional AI provider tests

The full acceptance test above works offline. To test another provider, open **AI provider**, select it, follow its popup checklist, configure the model/key, select a task, and click **Analyze bug**.

- **Local open-source:** Start Ollama at `http://127.0.0.1:11434/v1` or LM Studio at `http://127.0.0.1:1234/v1`, then enter the exact loaded model name. A token is optional.
- **OpenAI:** Create a key at https://platform.openai.com/api-keys and configure API billing.
- **Gemini:** Create a key at https://aistudio.google.com/apikey and configure its Google project if required.
- **Grok:** Create a key and credits at https://console.x.ai/.

A successful result is labeled with the selected provider and actual model. Credentials are held only in memory and clear when the app closes. Local custom endpoints are restricted to loopback addresses; cloud providers use fixed official hosts.

## Expected safety behavior

- The application never executes recovery commands.
- Approve fix records approval and completes the task; it does not edit repository files.
- Repository reads use fixed Git arguments through the native Rust backend.
- Invalid folders and commit hashes return user-visible errors.
- Transcript parsing and patch generation remain deterministic and local. Only optional Bug Detective analysis uses the selected provider.

## Troubleshooting

- Windows SmartScreen: choose More info, then Run anyway. This prototype is not code-signed.
- Blank window or launch failure: install Microsoft Edge WebView2 Runtime, then relaunch.
- Real Git history unavailable: verify that Git is installed and select the repository root containing its .git entry.
- The bundled demo flow remains testable even when no repository is selected.