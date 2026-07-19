# PatchTrail demo fixture

These files intentionally contain three bugs for testing the PatchTrail workflow.

1. Paste `bug-report-transcript.txt` into the Meeting & issue context panel.
2. Click **Extract tasks**.
3. Select a generated task and click **Analyze bug**.
4. Review the diff and the regression-test tab.
5. Use `buggy-checkout.test.ts` as the expected test coverage after the fixes.

The fixture is intentionally not wired into the production build. It is safe to inspect, modify, or copy into a separate test repository.
