# Phase 2 Implementation — Polis Intelligence Layer (Historical)

> **Archived**: This document describes the pre-Convex AI implementation using OpenAI, Anthropic, and pgvector. The active backend is Convex + Clerk. Runtime AI providers will be rebuilt using z.ai/GLM and Gemini on Convex actions. Do not use these patterns for current development.

## What Was Built

### AI Provider Integration
- OpenAI provider (chat + embeddings via OpenAI SDK)
- Anthropic provider (chat via Anthropic SDK)
- Provider registry with environment variable dispatch
- Template fallback when no provider configured

### Vector Embeddings and Semantic Search
- OpenAI text-embedding-3-small (1536 dimensions)
- pgvector extension in PostgreSQL
- Embedding generation during upload
- Batch re-embedding script

### Hybrid Retrieval
- Semantic (0.7) + keyword (0.3) weighting
- Fallback to keyword-only when embeddings unavailable

### LLM-Powered CoThinker
- Citation parsing from `[Source N]` format
- Response labelling (source-supported, interpretation, general)
- Conversation memory (last 10 messages)

### AI-Powered Tools
- Citation safety check endpoint
- Draft review with rubric analysis endpoint
- Auto-generated source summaries

## Why It Was Replaced

The OpenAI/Anthropic/pgvector stack was replaced because:
- pgvector required self-hosted PostgreSQL
- The migration to Convex removed the PostgreSQL database
- AI provider calls will move to Convex actions (Node.js runtime)
- z.ai/GLM is the new primary provider (cost-effective for students)
