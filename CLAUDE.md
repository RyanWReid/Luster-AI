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

## Development Guidelines

### Using Specialized Agents
Claude Code provides specialized agents for different types of work. **ALWAYS use these agents proactively** for better results:

#### **Backend Development**
**Use `python-backend-architect` for:**
- FastAPI endpoint design and implementation
- Database schema design and migrations (Alembic)
- Authentication systems (Supabase JWT, OAuth)
- Image processing pipelines and AI integration
- Job queue systems (RQ, Celery alternatives)
- Performance optimization and caching strategies
- API error handling and validation patterns

**Examples:**
- "Design a new endpoint for bulk photo processing"
- "Optimize the image enhancement job queue"
- "Implement authentication middleware with Supabase"
- "Create database migrations for new features"

#### **Frontend Development**
**Use `frontend-architect` for:**
- React/Next.js component architecture
- Mobile-responsive UI design and implementation
- State management patterns (Context, Zustand, SWR)
- File upload interfaces with drag-and-drop
- Real-time UI updates and polling patterns
- TypeScript interfaces and type safety
- Tailwind CSS styling and design systems

**Examples:**
- "Build a mobile-first photo upload interface"
- "Create a status tracking component with real-time updates"
- "Design a credit purchase flow with Stripe integration"
- "Implement social login buttons (Google, Apple)"

#### **Code Review & Quality**
**Use `senior-fullstack-reviewer` for:**
- **Always review after major features** (authentication, payments, etc.)
- Security analysis of upload and processing flows
- Performance review of image processing pipelines
- Architecture validation for scalability
- Code quality and best practices enforcement
- Pre-deployment security audits

**Examples:**
- "Review the photo enhancement pipeline for security issues"
- "Analyze the credit system implementation"
- "Validate the authentication flow architecture"

#### **Alternative Backends**
**Use `bun-backend-architect` for:**
- TypeScript-first backend development
- High-performance API endpoints
- Alternative to Python when TypeScript is preferred
- Modern runtime features and optimization

### When to Use Each Agent

#### **🚀 Proactive Usage (Recommended)**
- **Before starting** major features
- **During design** of complex workflows
- **When choosing** between implementation approaches
- **For architectural** decisions

#### **🎯 Specific Scenarios**

**Mobile App Development:**
- Use `frontend-architect` for responsive design and mobile UX
- Focus on touch interactions, gestures, and mobile-specific patterns
- Implement mobile-first layouts and components

**AI Integration:**
- Use `python-backend-architect` for AI service integration
- OpenAI API optimization and error handling
- Image processing pipeline design
- AI prompt engineering and management

**Authentication & Social Login:**
- Use `python-backend-architect` for backend auth (JWT, sessions)
- Use `frontend-architect` for social login UI (Google, Apple, etc.)
- Coordinate between both for complete auth flows

**Performance Optimization:**
- Use `python-backend-architect` for backend performance
- Use `frontend-architect` for frontend performance and UX
- Use `senior-fullstack-reviewer` for overall architecture review

**Production Deployment:**
- Use `senior-fullstack-reviewer` before any production release
- Security audit of entire application
- Performance analysis and recommendations

### Agent Coordination Examples

**Feature: Social Login (Google/Apple)**
1. **Frontend**: `frontend-architect` → Design social login buttons and flows
2. **Backend**: `python-backend-architect` → Implement OAuth endpoints and user creation
3. **Review**: `senior-fullstack-reviewer` → Security and UX audit

**Feature: Mobile Photo Upload**
1. **Frontend**: `frontend-architect` → Mobile-responsive upload interface
2. **Backend**: `python-backend-architect` → File handling and validation
3. **Review**: `senior-fullstack-reviewer` → Performance and security analysis

### Quality Standards
- **80%+ test coverage** required for all features
- **Code review** mandatory before merging
- **Security audit** for authentication and payments
- **Performance testing** for image processing workflows
- **Mobile responsiveness** testing on actual devices

## Notes
- All file uploads bypass API server (direct to R2)
- Worker uses simple DB polling with SELECT FOR UPDATE SKIP LOCKED
- Credits deducted only on successful job completion
- Prompt system uses structured params converted to strings
- EXIF data stripped from all outputs for privacy