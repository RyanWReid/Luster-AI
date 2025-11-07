# Supabase Authentication Implementation

## Overview

This document describes the Supabase JWT authentication implementation for the Luster AI FastAPI backend.

## Architecture

### Components

1. **auth.py** - Core authentication module
   - JWT verification using JWKS
   - Public key caching (1-hour TTL)
   - User auto-creation with default credits
   - FastAPI dependencies for authenticated/optional auth

2. **auth_endpoints.py** - Authentication API endpoints
   - Magic link sign-in
   - Session management
   - User profile retrieval
   - Token verification

3. **main.py** - Updated to use authentication
   - All endpoints now use `get_current_user` dependency
   - Mobile endpoints support optional auth for backward compatibility
   - DEFAULT_USER_ID fallback for development

## Authentication Flow

### 1. Magic Link Sign-In

```
Client                    API                     Supabase Auth
  |                        |                            |
  |--POST /auth/magic-link-|                            |
  |  { email: "user@..." } |                            |
  |                        |---POST /auth/v1/otp------->|
  |                        |                            |
  |                        |<--200 OK-------------------|
  |<--200 OK---------------|                            |
  |                        |                            |
  |                        |        Email with link     |
  |<--------------------------------------------[User clicks link in email]
  |                        |                            |
  |--[Redirected to app with token]-------------------->|
```

**Endpoint:** `POST /auth/magic-link`

**Request:**
```json
{
  "email": "user@example.com",
  "redirect_to": "https://app.luster.ai/auth/callback" // optional
}
```

**Response:**
```json
{
  "message": "Magic link sent! Check your email to sign in.",
  "email": "user@example.com"
}
```

### 2. Making Authenticated Requests

After receiving the JWT token from Supabase, include it in requests:

```bash
curl -H "Authorization: Bearer <jwt_token>" \
  https://api.luster.ai/shoots
```

### 3. Token Verification

The API automatically:
1. Extracts token from `Authorization: Bearer <token>` header
2. Fetches JWKS from Supabase (cached for 1 hour)
3. Verifies token signature and expiration
4. Extracts user ID and email from JWT claims
5. Gets or creates user in database
6. Returns User object to endpoint

## API Endpoints

### Authentication Endpoints

#### POST /auth/magic-link
Send magic link email for passwordless sign-in.

#### GET /auth/session
Check current authentication session.

**Response (authenticated):**
```json
{
  "authenticated": true,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com"
}
```

**Response (not authenticated):**
```json
{
  "authenticated": false
}
```

#### GET /auth/me
Get current user's profile and credit balance.

**Requires:** Authentication

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "created_at": "2025-11-07T10:00:00",
  "updated_at": "2025-11-07T10:00:00",
  "credits": {
    "balance": 0,
    "updated_at": "2025-11-07T10:00:00"
  }
}
```

#### POST /auth/verify-token
Verify if provided token is valid.

**Requires:** Authentication

**Response:**
```json
{
  "valid": true,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com"
}
```

#### POST /auth/logout
Logout current user (client should discard token).

**Requires:** Authentication

**Response:**
```json
{
  "message": "Logged out successfully. Token should be removed from client."
}
```

### Protected Endpoints

All main API endpoints now require authentication:

- `GET /shoots` - List user's shoots
- `POST /shoots` - Create new shoot
- `POST /uploads/presign` - Generate upload URL
- `POST /uploads/confirm` - Confirm upload
- `POST /uploads` - Direct upload
- `POST /jobs` - Create processing job
- `GET /jobs/{job_id}` - Get job status
- `GET /shoots/{shoot_id}/assets` - Get shoot assets
- `GET /credits` - Get credit balance

### Optional Authentication Endpoints

These endpoints work with or without authentication (for backward compatibility):

- `GET /api/mobile/test` - No auth required
- `POST /api/mobile/enhance` - Optional auth (falls back to DEFAULT_USER_ID)
- `POST /api/mobile/enhance-base64` - Optional auth
- `GET /api/mobile/enhance/{job_id}/status` - Optional auth (verifies ownership if authenticated)
- `GET /api/mobile/credits` - Optional auth
- `GET /api/mobile/styles` - No auth required

### Public Endpoints

These endpoints don't require authentication:

- `GET /health` - Health check
- `POST /webhooks/stripe` - Stripe webhook
- `POST /webhooks/revenuecat` - RevenueCat webhook
- `GET /docs` - API documentation
- `GET /openapi.json` - OpenAPI schema

## User Auto-Creation

When a user authenticates for the first time:

1. JWT token is verified
2. User ID extracted from `sub` claim
3. Database checked for existing user
4. If not found:
   - User record created with ID and email
   - Credit record created with balance = 0
5. User object returned

**Database Schema:**
```sql
-- User table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Credits table
CREATE TABLE credits (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) UNIQUE,
  balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Error Handling

### 401 Unauthorized
Token is missing, invalid, or expired.

```json
{
  "detail": "Missing authorization credentials"
}
```

### 403 Forbidden
User authenticated but doesn't have access to resource.

```json
{
  "detail": "Access denied"
}
```

### 402 Payment Required
User has insufficient credits.

```json
{
  "detail": "Insufficient credits"
}
```

### 404 Not Found
Resource doesn't exist or doesn't belong to user.

```json
{
  "detail": "Shoot not found"
}
```

## Environment Variables

Required in `.env`:

```bash
# Supabase Authentication
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here  # Optional
SUPABASE_JWKS_URL=https://your-project.supabase.co/auth/v1/.well-known/jwks.json
```

### Getting Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Settings** > **API**
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (use cautiously, has admin privileges)

## Security Features

### JWT Verification
- Uses RS256 algorithm (asymmetric encryption)
- Verifies signature using public key from JWKS
- Checks token expiration
- Validates audience claim

### JWKS Caching
- Public keys cached for 1 hour
- Reduces latency for token verification
- Falls back to stale cache if fetch fails
- Auto-refreshes on cache expiration

### Resource Ownership
- All endpoints verify resource belongs to authenticated user
- Prevents users from accessing others' data
- Applies to shoots, assets, and jobs

### Rate Limiting
Consider adding rate limiting middleware for:
- `/auth/magic-link` - Prevent email spam
- All endpoints - Prevent abuse

## Mobile App Integration

### iOS/Android (React Native)

```typescript
import { supabase } from './supabase-client';

// Sign in with magic link
async function signIn(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: 'myapp://auth/callback'
    }
  });
  if (error) throw error;
}

// Get session token
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

// Make authenticated request
const response = await fetch('https://api.luster.ai/shoots', {
  headers: {
    'Authorization': `Bearer ${token}`,
  }
});
```

### Automatic Token Refresh

Supabase client libraries handle token refresh automatically:

```typescript
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed:', session?.access_token);
  }
});
```

## Testing Authentication

### Using cURL

```bash
# 1. Send magic link
curl -X POST https://api.luster.ai/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# 2. Click link in email, extract token from redirect URL

# 3. Use token for authenticated requests
export TOKEN="eyJ..."

curl https://api.luster.ai/auth/me \
  -H "Authorization: Bearer $TOKEN"

curl https://api.luster.ai/shoots \
  -H "Authorization: Bearer $TOKEN"
```

### Using Postman

1. Create request
2. Go to **Authorization** tab
3. Select **Bearer Token**
4. Paste JWT token in value field
5. Send request

### Development/Testing

For local development without Supabase:

```bash
# Use DEFAULT_USER_ID (hardcoded in main.py)
# Mobile endpoints accept requests without auth
curl -X POST http://localhost:8000/api/mobile/enhance \
  -F "image=@test.jpg" \
  -F "style=luster"
```

## Troubleshooting

### "Missing authorization credentials"
- Check `Authorization` header is present
- Verify format: `Bearer <token>` (note the space)
- Ensure token hasn't expired

### "Token has expired"
- JWT tokens expire after 1 hour by default
- Use Supabase client's auto-refresh feature
- Or request new magic link

### "Invalid token"
- Token may be malformed
- Verify it's from Supabase (not other JWT)
- Check SUPABASE_URL matches token issuer

### "Public key not found for kid: xxx"
- JWKS cache may be stale
- Wait 1 hour for auto-refresh
- Or restart API server to clear cache

### "Insufficient credits"
- User has 0 credits (default for new users)
- Purchase credit pack via Stripe/RevenueCat
- Or manually add credits via admin interface

## Next Steps

1. **Add rate limiting** - Prevent abuse of magic link endpoint
2. **Implement token blocklist** - For immediate logout enforcement
3. **Add OAuth providers** - Google, Apple, etc.
4. **Enhanced logging** - Track authentication events
5. **Admin endpoints** - Manage users and credits
6. **Session management** - Track active sessions

## References

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [JWT.io](https://jwt.io/) - Decode and verify JWTs
- [JWKS RFC](https://datatracker.ietf.org/doc/html/rfc7517)
