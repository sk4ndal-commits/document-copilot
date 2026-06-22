# Document Copilot

## The Problem

Companies accumulate knowledge across network drives, Confluence spaces, and SharePoint sites. Finding a specific answer means opening multiple files, skimming through pages, and hoping you land on the right document — a process that routinely takes 20–40 minutes.

## The Solution

Document Copilot connects to your existing document sources and turns them into a conversational knowledge base. Ask a question; get a direct, sourced answer in seconds. No migration, no manual tagging — your documents stay where they are.

## Before vs. After

| | Before | After |
|---|---|---|
| Finding a policy | Open SharePoint → search → skim 3 PDFs | Ask the question, read the answer |
| Onboarding | Hand new hires a folder of 200 docs | They ask questions as they arise |
| Cross-referencing | Open each file manually | One query, results from all sources |

---

## How It Works

A **RAG (Retrieval-Augmented Generation)** pipeline:

1. **Ingest** — Documents are pulled from Confluence, SharePoint, a watched network drive, or uploaded directly.
2. **Chunk & Embed** — Text is split into overlapping chunks and converted to vector embeddings.
3. **Store** — Embeddings go into Qdrant (per-tenant collection); metadata into PostgreSQL.
4. **Search** — The user's query is embedded and matched against stored chunks.
5. **Answer** — Matching chunks are sent as context to a self-hosted LLM, which returns a grounded, cited answer.

---

## Architecture

```
React Frontend  →  FastAPI Backend  →  Ingestion Pipeline
                        │                    ↓
                   Connectors          Qdrant (vectors)
                   (Confluence,        PostgreSQL (metadata)
                    SharePoint)
                        ↑
              Network Drive Agent
              (standalone binary, watches local folders)
                        ↑
                LLM (self-hosted, OpenAI-compatible API)
```