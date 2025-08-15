# Luster AI - Real Estate Photo Enhancement Platform

## Overview
Web-first photo enhancement platform using OpenAI's gpt-image-1 for real estate photos. Users upload photos, apply style presets, and get enhanced outputs. Built with FastAPI + Worker, Supabase (Auth + Postgres), Cloudflare R2 storage, and Stripe for credit packs.

## Tech Stack
- **Frontend**: Next.js (App Router + Tailwind)
- **API**: FastAPI HTTP server  
- **Worker**: Python worker (CLI loop)
- **Database**: Postgres via Supabase
- **Storage**: Cloudflare R2 (S3 API)
- **Auth**: Supabase Auth (magic links)
- **Payments**: Stripe (credit packs)
- **AI**: OpenAI gpt-image-1 for image edits
- **Hosting**: Railway

## Project Structure
```
/apps/web                # Next.js frontend
/services/api            # FastAPI HTTP server
/services/worker         # Python worker (CLI loop)
/packages/shared         # Types, prompt templates, style profiles
/infra                   # docker-compose for local (Postgres, MinIO), migrations
```

## Database Schema
- **users**: Basic user info (matches Supabase auth)
- **credits**: Credit balance per user
- **shoots**: Photo shoot groupings
- **assets**: File storage tracking (original/output/thumb)
- **jobs**: Processing jobs with status tracking
- **job_events**: Audit trail for jobs
- **prompt_versions**: Versioned prompt templates

## Key Features
1. **Upload Flow**: Browser → R2 via presigned URLs (no API proxy)
2. **Job Processing**: Worker polls DB, downloads original, calls OpenAI, stores output
3. **Credit System**: Stripe checkout → credit packs → deduct on success
4. **Style Presets**: Structured prompts (dusk, sky replacement, lawn cleanup)
5. **Status Tracking**: Real-time job status via polling

## Storage Layout (R2)
```
/{userId}/{shootId}/{assetId}/original.heic
/{userId}/{shootId}/{assetId}/outputs/{jobId}_v{n}.jpg
/{userId}/{shootId}/{assetId}/thumb.jpg
```

## API Endpoints
- `POST /uploads/presign` - Get presigned upload URL
- `POST /jobs` - Create processing job
- `GET /jobs/:id` - Get job status and outputs
- `GET /shoots/:id/assets` - List shoot assets with signed URLs
- `POST /billing/checkout` - Create Stripe checkout session
- `POST /webhooks/stripe` - Handle payment webhooks

## Environment Variables
```
OPENAI_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
S3_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=luster
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_JWKS_URL=<SUPABASE_URL>/auth/v1/.well-known/jwks.json
DATABASE_URL=postgresql+psycopg://user:pass@host:5432/db
APP_URL=https://app.luster.example
```

## MVP Acceptance Criteria
1. **Auth**: Magic link sign-in, auto-create users, default 0 credits
2. **Upload**: 10MB JPG upload via presigned POST
3. **Job**: Queued → processing → succeeded workflow
4. **Credits**: 402 error if balance=0, deduct 1 on success
5. **UI**: Job status, download outputs, purchase credits
6. **Audit**: job_events tracking
7. **Safety**: Strip GPS EXIF from outputs

## Implementation Plan

### Phase 1: Infrastructure Setup
- [ ] Set up monorepo structure
- [ ] Create docker-compose for local development
- [ ] Set up Postgres migrations
- [ ] Configure environment variables

### Phase 2: Database & Auth
- [ ] Create database schema (users, credits, shoots, assets, jobs, job_events, prompt_versions)
- [ ] Implement Supabase JWT verification in FastAPI
- [ ] Set up auth middleware with JWKS caching

### Phase 3: Storage & Upload
- [ ] Implement R2 presigned URL generation
- [ ] Create upload endpoint with asset tracking
- [ ] Set up S3 client for worker operations

### Phase 4: Core API
- [ ] Build job creation endpoint
- [ ] Implement job status endpoint
- [ ] Create asset listing with signed URLs
- [ ] Add error handling and validation

### Phase 5: AI Processing
- [ ] Create OpenAI image edit client with retry logic
- [ ] Build structured prompt system
- [ ] Implement EXIF stripping for privacy
- [ ] Create worker polling loop

### Phase 6: Frontend
- [ ] Set up Next.js with Supabase auth
- [ ] Build upload interface with drag-drop
- [ ] Create job status polling
- [ ] Implement download interface

### Phase 7: Billing
- [ ] Set up Stripe checkout integration
- [ ] Create credit purchase flow
- [ ] Implement webhook handling
- [ ] Add credit balance validation

### Phase 8: Polish & Deploy
- [ ] Add comprehensive error handling
- [ ] Implement logging and monitoring
- [ ] Set up Railway deployment
- [ ] Add basic admin interface

## Non-Goals (Deferred)
- Realtime updates (SSE/WebSocket) - use polling only
- Queue systems (Redis/Celery) - use DB locking
- Organization/team features
- Metered billing
- Vector search
- Mobile app

## Notes
- All file uploads bypass API server (direct to R2)
- Worker uses simple DB polling with SELECT FOR UPDATE SKIP LOCKED
- Credits deducted only on successful job completion
- Prompt system uses structured params converted to strings
- EXIF data stripped from all outputs for privacy