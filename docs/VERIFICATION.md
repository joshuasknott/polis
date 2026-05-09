# Verification Commands

Production-readiness verification for Polis.

## Quick Verify

```bash
npm run verify
```

Runs: typecheck + lint + unit tests + convex tests + security checks.

## Individual Commands

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# All tests
npm run test

# Unit tests only (src/)
npm run test:unit

# Convex tests only (convex/)
npm run test:convex

# Security static analysis
npm run test:security

# Production build
npm run build

# Convex codegen
npm run convex:codegen
```

## Pre-Deployment Checklist

1. `npm run verify` — all pass
2. `npm run build` — succeeds
3. `npm run convex:codegen` — no errors
4. `npm run test:security` — zero errors

## Test Coverage

### Unit Tests (58 tests)
- `src/lib/__tests__/utils.test.ts` — utility functions (cn, formatDate, truncate, wordCount, etc.)
- `src/lib/__tests__/types.test.ts` — type constants and production stages
- `src/lib/__tests__/convex-ui-mappers.test.ts` — Convex-to-UI data mapping
- `src/__tests__/smoke.test.ts` — page and component import resolution

### Convex Tests (40 tests)
- `convex/convex.test.ts` — auth scoping, CRUD operations, cross-reference validation

### Security Checks
- `scripts/security-checks.ts` — hardcoded API keys, localStorage secrets, console logging secrets, client-side env access, auth pattern coverage

## Architecture Notes

- All Convex pages use `export const dynamic = "force-dynamic"` to prevent SSG without Convex provider
- Convex tests use `convex-test` with `@edge-runtime/vm` per Convex guidelines
- Unit tests use `vitest` with `jsdom` environment and `@testing-library/jest-dom`
