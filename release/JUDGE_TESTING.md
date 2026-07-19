# Cuttle judge testing

## Download

Use the latest GitHub Release (https://github.com/ReReReverie/PatchTrail/releases/latest) and select the package matching the judge's operating system:

- Windows x64: Cuttle-v<version>-windows-x64-portable.zip or the NSIS setup executable
- macOS Apple Silicon: Cuttle-v<version>-macos-arm64.dmg
- macOS Intel: Cuttle-v<version>-macos-x64.dmg
- Linux x64: Cuttle-v<version>-linux-x64-appimage.AppImage
- Ubuntu/Debian x64: Cuttle-v<version>-linux-x64-deb.deb

The release also includes SHA256SUMS.txt.

## Launch notes

- Windows: extract the portable ZIP and run Cuttle.exe. If SmartScreen appears, choose More info, then Run anyway.
- macOS: drag Cuttle from the DMG to Applications. The build is ad-hoc signed but not notarized; if Gatekeeper blocks it, use System Settings, Privacy & Security, Open Anyway.
- Linux AppImage: run chmod +x Cuttle-*.AppImage once, then launch it. If FUSE is unavailable, use the .deb package on Ubuntu/Debian or run the AppImage with --appimage-extract-and-run.

No account, API key, network connection, Node.js, or Rust installation is required for the offline demo. Git is needed only for the optional real-repository history and verification flows.

## Two-minute acceptance test

1. Launch Cuttle.
2. Confirm that the app follows the system theme. Use the top-right theme button to cycle system, dark, and light modes.
3. Keep the provided checkout transcript and click Extract tasks.
4. Confirm that task cards appear progressively and include owner, priority, target file, and status.
5. Select the checkout task and click Analyze bug.
6. Confirm that the result shows a plain-English confidence label, root cause, red/green diff, and a Review required notice.
7. Open Regression tests and copy a test stub.
8. Click Approve fix and confirm that the task is completed and the activity counter updates.
9. Open Git history. Demo history is immediately available.
10. Optional: click Choose repository and select a local Git repository. Confirm that its commits and changed files load.
11. Copy Branch recovery or Restore one file. Confirm that Cuttle only copies the command and does not run it.
12. Inspect Hard reset and confirm that it is visibly marked destructive.

## Validation note

Windows is locally smoke-tested. macOS and Linux packages are built and package-smoke-tested by native GitHub Actions runners; this project does not claim manual hardware testing for those platforms.
