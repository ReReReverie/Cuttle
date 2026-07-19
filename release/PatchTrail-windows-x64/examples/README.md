# PatchTrail example fixtures

This folder contains small, intentionally buggy test repositories for trying the PatchTrail workflow. The source files are not wired into the production build.

## Naming convention

Every new fixture uses a level suffix in its filename. The suffix describes the intended practice difficulty, not a judgement about the developer using it.

| Suffix | Intended level | Focus |
| --- | --- | --- |
| `-student` | Student | A local guard and a straightforward regression test |
| `-junior` | Junior | HTTP status handling and an error-path decision |
| `-mid` | Mid-level | Cache-key design and state isolation |
| `-senior` | Senior | Idempotency scope and cross-account data isolation |

## Quick start

1. In PatchTrail, open the **Meeting & issue context** panel.
2. Import one of the `*.txt` transcripts below, or paste its contents into the panel.
3. Click **Extract tasks**.
4. Select a task and click **Analyze bug**.
5. Review the suggested patch and open **Regression tests**.
6. Compare the generated coverage with the matching `*.test.ts` file.

The fixtures are safe to inspect, modify, or copy into a separate test repository. The `.ts` files intentionally preserve the bug until a learner applies the suggested fix.

## Included fixtures

| Fixture | Transcript | Source | Expected tests |
| --- | --- | --- | --- |
| Checkout reliability (baseline) | `bug-report-transcript.txt` | `buggy-checkout.ts` | `buggy-checkout.test.ts` |
| Todo toggle | `task-list-student.txt` | `task-list-student.ts` | `task-list-student.test.ts` |
| Profile API | `profile-api-junior.txt` | `profile-api-junior.ts` | `profile-api-junior.test.ts` |
| Regional cart cache | `cart-cache-mid.txt` | `cart-cache-mid.ts` | `cart-cache-mid.test.ts` |
| Payment idempotency | `payment-idempotency-senior.txt` | `payment-idempotency-senior.ts` | `payment-idempotency-senior.test.ts` |

The expected test files use Vitest syntax as readable test specifications. They are included as reference fixtures and are not part of the PatchTrail production build.
