# LusterAI Project Index

> **Last Updated:** December 2024
> **Version:** 1.0.0
> Real Estate Photo Enhancement Platform

---

## Quick Navigation

| Section | Description |
|---------|-------------|
| [Architecture Overview](#architecture-overview) | System design and data flow |
| [Directory Structure](#directory-structure) | Project organization |
| [API Reference](#api-reference) | Backend endpoints and services |
| [Mobile App](#mobile-app) | React Native architecture |
| [Web App](#web-app) | Next.js frontend |
| [Worker Service](#worker-service) | Image processing pipeline |
| [Database Schema](#database-schema) | Data models and relations |
| [Integration Points](#integration-points) | Auth, storage, payments |
| [Development Guide](#development-guide) | Setup and workflows |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├──────────────────────────┬──────────────────────────────────────┤
│     Mobile App           │           Web App                    │
│   (React Native/Expo)    │        (Next.js 14)                  │
│   - iOS/Android          │        - App Router                  │
│   - RevenueCat billing   │        - Tailwind + Radix            │
└───────────┬──────────────┴───────────────┬──────────────────────┘
            │                              │
            ▼                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SUPABASE AUTH                                │
│              Magic Links + JWT Verification                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API SERVICE                                 │
│                   (FastAPI + Python)                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────────┐  │
│  │ Uploads │ │  Jobs   │ │ Credits │ │ Gallery │ │  Billing  │  │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └─────┬─────┘  │
└───────┼──────────┼─────────┼──────────┼───────────────┼─────────┘
        │          │         │          │               │
        ▼          ▼         ▼          ▼               ▼
┌───────────┐ ┌─────────┐ ┌──────────────────┐ ┌───────────────────┐
│ R2 Storage│ │  Worker │ │    PostgreSQL    │ │  Stripe/RevenueCat│
│(Cloudflare)│ │ (RQ)   │ │    (Supabase)    │ │     Payments      │
└───────────┘ └────┬────┘ └──────────────────┘ └───────────────────┘
                   │
                   ▼
          ┌────────────────┐
          │   OpenAI API   │
          │  gpt-image-1   │
          └────────────────┘
```

### Data Flow: Image Enhancement

```
1. UPLOAD          2. PROCESS           3. DELIVER
   ─────►             ─────►              ─────►

┌────────┐        ┌────────────┐        ┌────────────┐
│ Client │──────► │ Presigned  │──────► │    R2      │
│        │        │    URL     │        │  Storage   │
└────────┘        └────────────┘        └─────┬──────┘
                                              │
┌────────┐        ┌────────────┐              │
│ Client │──────► │ Create Job │◄─────────────┘
│        │        │ (deduct $) │
└────────┘        └─────┬──────┘
                        │
                        ▼
                  ┌────────────┐        ┌────────────┐
                  │   Worker   │──────► │  OpenAI    │
                  │  (polls)   │◄───────│ Enhance    │
                  └─────┬──────┘        └────────────┘
                        │
                        ▼
┌────────┐        ┌────────────┐        ┌────────────┐
│ Client │◄────── │ Poll Status│◄───────│ R2 Output  │
│(result)│        │ + Get URL  │        │  Uploaded  │
└────────┘        └────────────┘        └────────────┘
```

---

## Directory Structure

```
LusterAI/
├── apps/
│   └── web/                    # Next.js frontend
│       ├── app/                # App Router pages
│       │   ├── (auth)/         # Auth pages (login, signup)
│       │   ├── (main)/         # Main app pages
│       │   ├── components/     # React components
│       │   ├── hooks/          # Custom React hooks
│       │   ├── lib/            # Utilities and API client
│       │   └── types/          # TypeScript definitions
│       └── test/               # Vitest + Playwright tests
│
├── mobile/                     # React Native (Expo)
│   └── src/
│       ├── screens/            # App screens
│       ├── components/         # UI components
│       ├── context/            # React Context providers
│       ├── services/           # API service modules
│       ├── navigation/         # React Navigation setup
│       ├── hooks/              # Custom hooks
│       ├── lib/                # Utilities + API client
│       └── utils/              # Helper functions
│
├── services/
│   ├── api/                    # FastAPI backend
│   │   ├── main.py             # App entry + endpoints
│   │   ├── database.py         # SQLAlchemy models
│   │   ├── auth.py             # JWT verification
│   │   ├── schemas.py          # Pydantic models
│   │   ├── s3_client.py        # R2 storage client
│   │   ├── openai_client.py    # OpenAI API client
│   │   ├── credit_service.py   # Credit management
│   │   ├── job_queue.py        # RQ job enqueuing
│   │   ├── middleware.py       # CORS, logging
│   │   ├── rate_limiter.py     # SlowAPI config
│   │   └── alembic/            # Database migrations
│   │
│   └── worker/                 # Job processing
│       ├── processor.py        # ImageProcessor class
│       ├── job_processor.py    # RQ job handler
│       ├── openai_client.py    # OpenAI wrapper
│       ├── rq_worker.py        # Worker startup
│       └── pipeline/           # Advanced processing
│           ├── orchestrator.py
│           ├── stages/
│           └── prompts/
│
├── packages/
│   ├── shared/                 # Python shared code
│   │   └── prompts.py          # Prompt templates
│   └── shared-ts/              # TypeScript shared types
│
├── infra/
│   ├── schema.sql              # Database schema
│   ├── docker-compose.yml      # Local dev stack
│   └── r2-cors.json            # R2 CORS config
│
├── CLAUDE.md                   # AI assistant instructions
├── PROJECT_INDEX.md            # This file
└── package.json                # Monorepo scripts
```

---

## API Reference

### Base URL
- **Development:** `http://localhost:8000`
- **Production:** `https://api.luster.ai`

### Authentication
All authenticated endpoints require:
```
Authorization: Bearer <supabase_jwt_token>
```

---

### Upload Endpoints

#### `POST /uploads/presign`
Get presigned URL for direct R2 upload.

```typescript
// Request
{
  "filename": "living_room.jpg",
  "content_type": "image/jpeg",
  "shoot_id": "uuid-optional"
}

// Response
{
  "upload_url": "https://r2.cloudflare.com/...",
  "asset_id": "uuid",
  "object_key": "userId/shootId/assetId/original.jpg"
}
```

#### `POST /uploads/confirm`
Confirm upload completion and create asset record.

```typescript
// Request
{
  "asset_id": "uuid",
  "object_key": "path/to/file.jpg"
}

// Response
{
  "asset": { "id": "uuid", "filename": "...", ... }
}
```

#### `POST /api/mobile/uploads/presign`
Mobile-specific presigned URL endpoint.

#### `POST /api/mobile/uploads/confirm`
Mobile-specific upload confirmation.

---

### Job Endpoints

#### `POST /jobs`
Create image enhancement job. **Rate limited: 10/minute**

```typescript
// Request
{
  "asset_id": "uuid",
  "prompt": "Enhance this living room photo",
  "style": "bright_airy"  // optional
}

// Response
{
  "job": {
    "id": "uuid",
    "status": "queued",
    "credits_used": 1
  }
}
```

#### `GET /jobs/{job_id}`
Get job status and output URL.

```typescript
// Response
{
  "job": {
    "id": "uuid",
    "status": "succeeded",  // queued | processing | succeeded | failed
    "output_url": "https://signed-url...",
    "error_message": null,
    "created_at": "2024-12-18T...",
    "completed_at": "2024-12-18T..."
  }
}
```

#### `POST /api/mobile/enhance`
Mobile image enhancement (multipart form upload).

#### `POST /api/mobile/enhance-base64`
Mobile base64 image enhancement.

#### `GET /api/mobile/enhance/{job_id}/status`
Poll job status (mobile).

---

### Project Endpoints

#### `POST /shoots`
Create new shoot/project.

```typescript
// Request
{ "name": "123 Main Street Photos" }

// Response
{ "shoot": { "id": "uuid", "name": "...", ... } }
```

#### `GET /shoots`
List user's shoots with job status aggregates.

#### `GET /shoots/{shoot_id}/assets`
Get assets in shoot with signed URLs.

#### `DELETE /api/mobile/projects/{shoot_id}`
Delete project and all associated files.

---

### Credit Endpoints

#### `GET /credits`
Get user credit balance.

```typescript
// Response
{ "balance": 10 }
```

#### `GET /api/mobile/credits/balance`
Mobile credit balance (authenticated).

---

### Gallery Endpoints

#### `GET /api/mobile/gallery`
Paginated gallery with signed URLs.

```typescript
// Query: ?page=1&limit=20

// Response
{
  "items": [
    {
      "id": "uuid",
      "original_url": "https://...",
      "output_url": "https://...",
      "created_at": "..."
    }
  ],
  "total": 50,
  "page": 1,
  "pages": 3
}
```

#### `GET /api/mobile/listings`
Get completed property listings.

#### `GET /api/mobile/styles`
Get available enhancement styles.

---

### Utility Endpoints

#### `GET /health`
Health check with service status.

```typescript
// Response
{
  "status": "healthy",
  "database": "connected",
  "storage": "connected",
  "version": "1.0.0"
}
```

---

## Mobile App

### Screen Hierarchy

```
App
└── NavigationContainer
    └── RootNavigator (Stack)
        ├── Welcome          # Onboarding
        ├── Auth             # Signup form
        ├── Login            # Magic link
        └── Main             # Authenticated
            └── MainTabs (Bottom Tabs)
                ├── Dashboard    # Home screen
                ├── Gallery      # Photo gallery
                └── Settings     # User settings
            └── Modal Screens (Stack)
                ├── NewListing        # Photo capture
                ├── StyleSelection    # Pick enhancement style
                ├── Confirmation      # Review before process
                ├── Processing        # Job status polling
                ├── Result            # Before/after view
                ├── Project           # Project details
                ├── Credits           # Purchase credits
                ├── AllProperties     # All listings
                └── AccountSettings   # Profile management
```

### Context Providers

| Context | File | Purpose |
|---------|------|---------|
| `AuthContext` | `context/AuthContext.tsx` | Supabase auth state, user session |
| `ListingsContext` | `context/ListingsContext.tsx` | Properties, projects, listings data |
| `PhotoContext` | `context/PhotoContext.tsx` | Current photo being processed |
| `LoadingContext` | `context/LoadingContext.tsx` | Global loading indicators |
| `NetworkContext` | `context/NetworkContext.tsx` | Connectivity status |

### Services

| Service | File | Purpose |
|---------|------|---------|
| `uploadService` | `services/uploadService.ts` | Presigned URL upload flow |
| `enhancementService` | `services/enhancementService.ts` | Job creation and polling |
| `creditService` | `services/creditService.ts` | Credit balance, purchases |
| `listingsService` | `services/listingsService.ts` | Fetch properties/projects |
| `galleryService` | `services/galleryService.ts` | Gallery image loading |
| `revenueCatService` | `services/revenueCatService.ts` | In-app purchase handling |

### Key Components

| Component | Purpose |
|-----------|---------|
| `ComparisonSlider` | Before/after image comparison with drag |
| `GalleryView` | Masonry-style image gallery |
| `PhotoCollection` | Grid display of photos |
| `FloatingTabBar` | Custom bottom navigation |
| `OfflineBanner` | Network status indicator |
| `ErrorBoundary` | Graceful error handling |

---

## Web App

### Page Structure (App Router)

```
app/
├── page.tsx                 # Landing page
├── layout.tsx               # Root layout with providers
├── globals.css              # Tailwind globals
│
├── (auth)/
│   ├── login/page.tsx       # Magic link login
│   └── signup/page.tsx      # Email signup
│
├── (main)/
│   ├── enhance/
│   │   ├── page.tsx         # Upload interface
│   │   ├── style/page.tsx   # Style selection
│   │   ├── processing/page.tsx  # Status polling
│   │   └── results/page.tsx     # Results display
│   ├── projects/page.tsx    # Projects list
│   └── settings/page.tsx    # User settings
│
└── onboarding/page.tsx      # First-time user flow
```

### Component Library

```
components/
├── ui/                      # Base primitives
│   ├── button.tsx           # Button variants
│   ├── card.tsx             # Card container
│   ├── input.tsx            # Form inputs
│   ├── badge.tsx            # Status badges
│   ├── progress.tsx         # Progress indicators
│   ├── toast.tsx            # Notifications
│   └── logo.tsx             # Brand logo
│
├── features/                # Feature components
│   ├── desktop-layout.tsx   # Desktop responsive
│   ├── mobile-layout.tsx    # Mobile responsive
│   └── mobile-nav.tsx       # Mobile navigation
│
└── settings/                # Settings components
    ├── settings-tabs.tsx
    ├── profile-edit-modal.tsx
    └── sections/
        ├── account-section.tsx
        ├── subscription-section.tsx
        └── preferences-section.tsx
```

---

## Worker Service

### Processing Pipeline

```
┌─────────────────┐
│   Job Queued    │
│  (RQ or Poll)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Download Asset  │
│   from R2       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Validate Image  │
│ (format, size)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Build Prompt    │
│ (style + room)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  OpenAI API     │
│  gpt-image-1    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Upload Output   │
│    to R2        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Update Job      │
│ Status: Success │
└─────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `processor.py` | `ImageProcessor` class - core enhancement logic |
| `job_processor.py` | RQ job handler, orchestrates workflow |
| `openai_client.py` | `LusterOpenAIClient` - OpenAI API wrapper |
| `rq_worker.py` | Worker process startup |

### Enhancement Tiers

| Tier | Resolution | Quality | Credits |
|------|------------|---------|---------|
| Free | 1024x1024 | Low | 1 |
| Premium | 1536x1024 | High | 2 |

### Style Presets

```python
STYLES = {
    "default": "Professional editorial real estate photography",
    "bright_airy": "Bright, airy interior with crisp whites",
    "dusk": "Warm evening atmosphere with golden hour lighting",
    "sky_replacement": "Clear blue sky replacement",
    "lawn_cleanup": "Enhanced landscaping with manicured grass"
}
```

---

## Database Schema

### Entity Relationship

```
┌──────────┐       ┌──────────┐       ┌──────────┐
│  users   │──1:N──│  shoots  │──1:N──│  assets  │
└────┬─────┘       └──────────┘       └────┬─────┘
     │                                     │
     │ 1:1                                 │ 1:N
     ▼                                     ▼
┌──────────┐                         ┌──────────┐
│ credits  │                         │   jobs   │
└──────────┘                         └────┬─────┘
                                          │
                                          │ 1:N
                                          ▼
                                    ┌────────────┐
                                    │ job_events │
                                    └────────────┘
```

### Table Details

#### `users`
```sql
id          UUID PRIMARY KEY
email       VARCHAR(255) UNIQUE NOT NULL
created_at  TIMESTAMP DEFAULT NOW()
updated_at  TIMESTAMP DEFAULT NOW()
```

#### `credits`
```sql
id          UUID PRIMARY KEY
user_id     UUID REFERENCES users(id)
balance     INTEGER DEFAULT 0
updated_at  TIMESTAMP DEFAULT NOW()
```

#### `shoots`
```sql
id          UUID PRIMARY KEY
user_id     UUID REFERENCES users(id)
name        VARCHAR(255)
created_at  TIMESTAMP DEFAULT NOW()
updated_at  TIMESTAMP DEFAULT NOW()
```

#### `assets`
```sql
id                UUID PRIMARY KEY
shoot_id          UUID REFERENCES shoots(id)
user_id           UUID REFERENCES users(id)
original_filename VARCHAR(255)
file_path         VARCHAR(500)
file_size         BIGINT
mime_type         VARCHAR(100)
created_at        TIMESTAMP DEFAULT NOW()
```

#### `jobs`
```sql
id            UUID PRIMARY KEY
asset_id      UUID REFERENCES assets(id)
user_id       UUID REFERENCES users(id)
prompt        TEXT
status        VARCHAR(50)  -- queued, processing, succeeded, failed
output_path   VARCHAR(500)
error_message TEXT
credits_used  INTEGER DEFAULT 1
started_at    TIMESTAMP
completed_at  TIMESTAMP
created_at    TIMESTAMP DEFAULT NOW()
```

#### `job_events`
```sql
id          UUID PRIMARY KEY
job_id      UUID REFERENCES jobs(id)
event_type  VARCHAR(50)  -- created, started, completed, failed
details     JSONB
created_at  TIMESTAMP DEFAULT NOW()
```

---

## Integration Points

### Authentication (Supabase)

```typescript
// Client-side
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Sign in with magic link
await supabase.auth.signInWithOtp({ email })

// Get session token
const { data: { session } } = await supabase.auth.getSession()
const token = session?.access_token
```

```python
# Server-side verification (auth.py)
from jose import jwt
token = jwt.decode(token, jwks, algorithms=['RS256'])
user_id = token['sub']
```

### Storage (Cloudflare R2)

```python
# Presigned URL generation (s3_client.py)
import boto3
s3 = boto3.client('s3',
    endpoint_url=S3_ENDPOINT,
    aws_access_key_id=S3_ACCESS_KEY_ID,
    aws_secret_access_key=S3_SECRET_ACCESS_KEY
)

url = s3.generate_presigned_url('put_object',
    Params={'Bucket': BUCKET, 'Key': object_key},
    ExpiresIn=3600
)
```

**Storage Layout:**
```
/{userId}/{shootId}/{assetId}/
  ├── original.jpg
  ├── outputs/{jobId}_v1.jpg
  └── thumb.jpg
```

### Payments (RevenueCat)

```typescript
// Mobile (revenueCatService.ts)
import Purchases from 'react-native-purchases'

await Purchases.configure({ apiKey: REVENUECAT_KEY })
const { customerInfo } = await Purchases.purchaseProduct(productId)
```

```python
# Webhook handler (revenue_cat.py)
@app.post("/webhooks/revenuecat")
async def handle_revenuecat_webhook(payload: dict):
    if payload['event'] == 'INITIAL_PURCHASE':
        add_credits(user_id, credits_amount)
```

### AI Enhancement (OpenAI)

```python
# openai_client.py
from openai import OpenAI
client = OpenAI(api_key=OPENAI_API_KEY)

response = client.images.edit(
    model="gpt-image-1",
    image=open(input_path, "rb"),
    prompt=enhancement_prompt,
    size="1536x1024",
    quality="high"
)
output_url = response.data[0].url
```

---

## Development Guide

### Prerequisites

- Node.js 20+
- Python 3.11+
- Docker & Docker Compose
- Expo CLI (`npm install -g expo-cli`)

### Quick Start

```bash
# Clone and install
git clone https://github.com/luster-ai/luster.git
cd luster
npm install

# Start local infrastructure
npm run dev:db

# Start all services
npm run dev
```

### Service Ports

| Service | Port | URL |
|---------|------|-----|
| API | 8000 | http://localhost:8000 |
| Web | 3000 | http://localhost:3000 |
| PostgreSQL | 5432 | localhost:5432 |
| MinIO | 9000 | http://localhost:9000 |
| Redis | 6379 | localhost:6379 |

### Environment Variables

Create `.env` files in each service directory:

**services/api/.env**
```
DATABASE_URL=postgresql+psycopg://user:pass@localhost:5432/luster
OPENAI_API_KEY=sk-...
S3_ENDPOINT=https://account.r2.cloudflarestorage.com
S3_BUCKET=luster
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
SUPABASE_URL=https://project.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_JWKS_URL=https://project.supabase.co/auth/v1/.well-known/jwks.json
```

**apps/web/.env.local**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

**mobile/.env**
```
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_SUPABASE_URL=https://project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_REVENUECAT_IOS_KEY=...
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=...
```

### NPM Scripts

```bash
# Development
npm run dev           # Start all services concurrently
npm run dev:api       # FastAPI only
npm run dev:web       # Next.js only
npm run dev:mobile    # Expo only
npm run dev:worker    # RQ worker only
npm run dev:db        # Docker PostgreSQL + MinIO

# Testing
npm run test          # All tests
npm run test:api      # pytest
npm run test:web      # vitest

# Code Quality
npm run lint          # ESLint + Ruff
npm run format        # Prettier + Black
npm run typecheck     # TypeScript + mypy

# Database
npm run db:migrate    # Run Alembic migrations
npm run db:reset      # Reset database
```

### Common Tasks

**Add a new API endpoint:**
1. Add route in `services/api/main.py`
2. Add Pydantic schema in `services/api/schemas.py`
3. Add tests in `services/api/tests/`

**Add a new mobile screen:**
1. Create screen in `mobile/src/screens/`
2. Add to navigator in `mobile/src/navigation/`
3. Add types in `mobile/src/types/`

**Add a new enhancement style:**
1. Add preset in `packages/shared/prompts.py`
2. Update styles endpoint in `main.py`
3. Add UI in mobile `StyleSelectionScreen`

---

## Cross-Reference Index

### By Feature

| Feature | API | Mobile | Web | Worker |
|---------|-----|--------|-----|--------|
| Authentication | `auth.py`, `auth_endpoints.py` | `AuthContext.tsx` | `(auth)/` | - |
| Upload | `/uploads/*` | `uploadService.ts` | `use-upload.ts` | - |
| Enhancement | `/jobs/*` | `enhancementService.ts` | `use-job-polling.ts` | `processor.py` |
| Credits | `/credits/*` | `creditService.ts` | - | `credit_service.py` |
| Gallery | `/gallery/*` | `galleryService.ts` | - | - |
| Billing | `/billing/*` | `revenueCatService.ts` | - | - |

### By File Type

| Type | Locations |
|------|-----------|
| API Routes | `services/api/main.py` |
| DB Models | `services/api/database.py` |
| Pydantic Schemas | `services/api/schemas.py` |
| React Screens | `mobile/src/screens/` |
| React Components | `mobile/src/components/`, `apps/web/app/components/` |
| Context Providers | `mobile/src/context/` |
| API Services | `mobile/src/services/`, `apps/web/app/lib/` |
| Hooks | `mobile/src/hooks/`, `apps/web/app/hooks/` |
| Types | `mobile/src/types/`, `apps/web/app/types/` |
| Migrations | `services/api/alembic/versions/` |
| Tests | `services/api/tests/`, `apps/web/test/` |

---

## Related Documentation

- [CLAUDE.md](./CLAUDE.md) - AI assistant instructions
- [DESIGN_GUIDELINES.md](./DESIGN_GUIDELINES.md) - UI/UX design system
- [FIGMA_IMPLEMENTATION.md](./FIGMA_IMPLEMENTATION.md) - Figma to code process
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment guide
- [mobile/README.md](./mobile/README.md) - Mobile app setup

---

*Generated with Claude Code | December 2024*
