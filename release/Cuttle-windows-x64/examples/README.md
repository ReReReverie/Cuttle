# Cuttle example fixtures

This folder contains small, intentionally buggy test repositories for trying the Cuttle workflow. Each ticket is self-contained in its own folder with the ticket transcript, buggy source, and matching regression tests. The source files are not wired into the production build.

## Fixture layout

Each fixture follows this layout:

```text
examples/<fixture>/
- <ticket>.txt
- <buggy-source>.ts
- <buggy-source>.test.ts
```

## Naming convention

Every new fixture uses a level suffix in its filename. The suffix describes the intended practice difficulty, not a judgement about the developer using it.

| Suffix | Intended level | Focus |
| --- | --- | --- |
| `-student` | Student | A local guard and a straightforward regression test |
| `-junior` | Junior | HTTP status handling and an error-path decision |
| `-mid` | Mid-level | Cache-key design and state isolation |
| `-senior` | Senior | Idempotency scope and cross-account data isolation |

## Quick start

1. In Cuttle, open the **Meeting & issue context** panel.
2. Import a fixture's `*.txt` transcript, or paste its contents into the panel.
3. Click **Extract tasks**.
4. Select a task and click **Analyze bug**.
5. Review the suggested patch and open **Regression tests**.
6. Compare the generated coverage with the matching `*.test.ts` file.

The fixtures are safe to inspect, modify, or copy into a separate test repository. The `.ts` files intentionally preserve the bug until a learner applies the suggested fix.

## Included fixtures

| Fixture | Ticket | Buggy source | Expected tests |
| --- | --- | --- | --- |
| Checkout reliability (baseline) | [`checkout-reliability/bug-report-transcript.txt`](checkout-reliability/bug-report-transcript.txt) | [`checkout-reliability/buggy-checkout.ts`](checkout-reliability/buggy-checkout.ts) | [`checkout-reliability/buggy-checkout.test.ts`](checkout-reliability/buggy-checkout.test.ts) |
| Todo toggle | [`task-list-student/task-list-student.txt`](task-list-student/task-list-student.txt) | [`task-list-student/task-list-student.ts`](task-list-student/task-list-student.ts) | [`task-list-student/task-list-student.test.ts`](task-list-student/task-list-student.test.ts) |
| Profile API | [`profile-api-junior/profile-api-junior.txt`](profile-api-junior/profile-api-junior.txt) | [`profile-api-junior/profile-api-junior.ts`](profile-api-junior/profile-api-junior.ts) | [`profile-api-junior/profile-api-junior.test.ts`](profile-api-junior/profile-api-junior.test.ts) |
| Regional cart cache | [`cart-cache-mid/cart-cache-mid.txt`](cart-cache-mid/cart-cache-mid.txt) | [`cart-cache-mid/cart-cache-mid.ts`](cart-cache-mid/cart-cache-mid.ts) | [`cart-cache-mid/cart-cache-mid.test.ts`](cart-cache-mid/cart-cache-mid.test.ts) |
| Payment idempotency | [`payment-idempotency-senior/payment-idempotency-senior.txt`](payment-idempotency-senior/payment-idempotency-senior.txt) | [`payment-idempotency-senior/payment-idempotency-senior.ts`](payment-idempotency-senior/payment-idempotency-senior.ts) | [`payment-idempotency-senior/payment-idempotency-senior.test.ts`](payment-idempotency-senior/payment-idempotency-senior.test.ts) |

The expected test files use Vitest syntax as readable test specifications. They are included as reference fixtures and are not part of the Cuttle production build.
