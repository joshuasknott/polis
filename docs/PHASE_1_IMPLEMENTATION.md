# Phase 1 Implementation — Polis (Historical)

> **Archived**: This document describes the pre-Convex Prisma/Auth.js/PostgreSQL implementation. The active backend is Convex + Clerk. Do not use these instructions, file paths, or patterns for current development. See `AGENTS.md` for the current architecture.

## What Was Built

### Database (PostgreSQL + Prisma)
- Full Prisma schema with 15 models
- Prisma 7 with `@prisma/adapter-pg`
- Seed script with realistic demo data

### Authentication (Auth.js v5)
- Credentials-based auth for local development
- JWT session strategy
- Middleware-based route protection

### File Upload
- `POST /api/sources/upload`
- Files stored locally in `./uploads/`

### Text Extraction
- PDF via `pdf-parse`, DOCX via `mammoth`

### Chunking
- 1000-word chunks with 150-word overlap

### Retrieval
- Keyword-based retrieval over source chunks

### Source-Grounded Assistant
- `POST /api/assistant` — retrieval-aware template responses

### Essay/Evidence Persistence
- Essays with sections and evidence items in PostgreSQL

## Why It Was Replaced

The Prisma/PostgreSQL/Auth.js stack was replaced by Convex + Clerk to:
- Eliminate self-hosted database management
- Provide real-time reactivity via Convex subscriptions
- Simplify auth with Clerk's managed identity
- Enable serverless AI actions via Convex
- Remove the need for API routes as a backend layer
