# Polis — Deployment Guide

## Prerequisites

- A [Convex](https://convex.dev) account and project
- A [Clerk](https://clerk.com) account and application
- A hosting platform for Next.js (Vercel recommended)
- (Planned) z.ai API key for AI features
- (Planned) Google Gemini API key for AI features

## 1. Configure Clerk

1. Create a Clerk application at [dashboard.clerk.com](https://dashboard.clerk.com)
2. Copy the **Publishable Key** and **Secret Key** from API Keys
3. Note the **JWT Issuer Domain** from JWT Verifiers (e.g. `https://your-instance.clerk.accounts.dev`)
4. Create a JWT template named `convex`:
   - Issuer: your JWT issuer domain
   - Audience: `convex`
   - Claims: default (sub, name, email, picture)

## 2. Configure Convex

1. Create a Convex project at [dashboard.convex.dev](https://dashboard.convex.dev)
2. Note the deployment URL
3. Set the Clerk JWT issuer domain in the Convex auth configuration (done automatically by `convex/auth.config.ts`)

## 3. Deploy Convex Functions

```bash
# Deploy all Convex functions to production
npx convex deploy
```

This deploys all queries, mutations, and actions defined in `convex/*.ts`.

## 4. Deploy Next.js

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Set the following environment variables:

| Variable | Value |
|----------|-------|
| `CONVEX_DEPLOYMENT` | Your Convex production deployment URL |
| `NEXT_PUBLIC_CONVEX_URL` | Your Convex production URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `CLERK_JWT_ISSUER_DOMAIN` | Clerk JWT issuer domain |

3. Deploy

### Other Platforms

```bash
# Build the production bundle
npm run build

# Start the production server
npm run start
```

Set all environment variables in your hosting platform's dashboard.

## 5. (Planned) Configure AI Providers

When AI features are wired:

| Variable | Description |
|----------|-------------|
| `ZAI_API_KEY` | z.ai/Zhipu GLM API key (primary provider) |
| `GOOGLE_AI_API_KEY` | Google Gemini API key (secondary provider) |
| `ENCRYPTION_SECRET` | AES-256-GCM secret for user API keys (`openssl rand -hex 32`) |

## Verification

```bash
# Verify code quality
npm run lint

# Verify build succeeds
npm run build

# Verify Convex functions compile
npx convex deploy --dry-run
```

### Post-Deployment Checks

1. Visit the deployed URL — landing page should load
2. Click "Get Started" — Clerk sign-in should appear
3. Sign in — dashboard should load with Convex data
4. Create a module — should persist to Convex
5. Check Convex dashboard — tables should show data

## Environment Variable Summary

| Variable | Required Now | Required Later | Description |
|----------|-------------|----------------|-------------|
| `CONVEX_DEPLOYMENT` | Yes | — | Convex deployment identifier |
| `NEXT_PUBLIC_CONVEX_URL` | Yes | — | Convex client URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | — | Clerk publishable key |
| `CLERK_SECRET_KEY` | Yes | — | Clerk secret key |
| `CLERK_JWT_ISSUER_DOMAIN` | Yes | — | Clerk JWT issuer for Convex |
| `ZAI_API_KEY` | No | Yes | z.ai API key |
| `GOOGLE_AI_API_KEY` | No | Yes | Gemini API key |
| `ENCRYPTION_SECRET` | No | Yes | Key encryption secret |
