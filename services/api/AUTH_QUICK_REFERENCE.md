# Authentication Quick Reference

## For Backend Developers

### Using Authentication in Endpoints

```python
from fastapi import Depends
from auth import get_current_user
from database import User

@app.get("/my-endpoint")
def my_endpoint(user: User = Depends(get_current_user)):
    # user.id - User's UUID
    # user.email - User's email
    return {"user_id": user.id}
```

### Optional Authentication

```python
from typing import Optional
from auth import get_optional_user

@app.get("/public-or-private")
def route(user: Optional[User] = Depends(get_optional_user)):
    if user:
        return {"authenticated": True, "user_id": user.id}
    return {"authenticated": False}
```

### Resource Ownership Check

```python
@app.get("/shoots/{shoot_id}")
def get_shoot(shoot_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    shoot = db.query(Shoot).filter(
        Shoot.id == shoot_id,
        Shoot.user_id == user.id  # Ownership check
    ).first()
    if not shoot:
        raise HTTPException(status_code=404, detail="Shoot not found")
    return shoot
```

## For Frontend/Mobile Developers

### Authentication Flow

```typescript
// 1. Request magic link
const response = await fetch('https://api.luster.ai/auth/magic-link', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com' })
});

// 2. User clicks link in email, gets redirected with token

// 3. Use token in requests
const token = 'eyJ...'; // From Supabase callback

const shoots = await fetch('https://api.luster.ai/shoots', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### React Native with Supabase

```typescript
import { supabase } from './lib/supabase';

// Sign in
await supabase.auth.signInWithOtp({
  email: 'user@example.com'
});

// Get token
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

// Make API request
const response = await fetch('https://api.luster.ai/shoots', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## Environment Variables

```bash
# .env file
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_JWKS_URL=https://your-project.supabase.co/auth/v1/.well-known/jwks.json
```

## API Endpoints

### Authentication
- `POST /auth/magic-link` - Send sign-in email
- `GET /auth/session` - Check if authenticated
- `GET /auth/me` - Get user profile + credits
- `POST /auth/verify-token` - Verify token validity
- `POST /auth/logout` - Logout (client should discard token)

### Protected (Require Auth)
- `GET /shoots` - List shoots
- `POST /shoots` - Create shoot
- `POST /uploads/presign` - Get upload URL
- `POST /jobs` - Create job
- `GET /credits` - Get balance

### Optional Auth
- `POST /api/mobile/enhance` - Works without auth (dev only)
- `GET /api/mobile/credits` - Works without auth (dev only)

### Public
- `GET /health` - Health check
- `GET /docs` - API documentation

## HTTP Status Codes

- **200** - Success
- **401** - Not authenticated (missing/invalid token)
- **402** - Payment Required (insufficient credits)
- **403** - Forbidden (resource doesn't belong to user)
- **404** - Not Found

## Testing Commands

```bash
# Test magic link
curl -X POST http://localhost:8000/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Test authenticated endpoint
curl http://localhost:8000/auth/me \
  -H "Authorization: Bearer eyJ..."

# Test public endpoint
curl http://localhost:8000/health
```

## Common Errors

**"Missing authorization credentials"**
```bash
# Wrong
curl http://localhost:8000/shoots

# Right
curl http://localhost:8000/shoots \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**"Token has expired"**
- Request new magic link
- JWT tokens expire after 1 hour

**"Insufficient credits"**
- New users have 0 credits
- Purchase via Stripe/RevenueCat

## Security Best Practices

1. **Always use HTTPS** in production
2. **Store tokens securely** (Keychain/Keystore, not localStorage)
3. **Never log tokens** in production
4. **Validate on server** - never trust client
5. **Check resource ownership** in all endpoints

## Migration Checklist

- [ ] Set up Supabase project
- [ ] Add environment variables
- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Test `/auth/magic-link` endpoint
- [ ] Update mobile app to use auth
- [ ] Test end-to-end flow
- [ ] Monitor logs for auth errors
- [ ] Add rate limiting (optional)

## Files Reference

- **auth.py** - JWT verification, user auto-creation
- **auth_endpoints.py** - API endpoints for authentication
- **AUTH_IMPLEMENTATION.md** - Complete guide
- **AUTHENTICATION_SUMMARY.md** - Implementation summary
- **This file** - Quick reference

## Need Help?

1. Check **AUTH_IMPLEMENTATION.md** for detailed guide
2. Use `/docs` for interactive API testing
3. Check logs for authentication errors
4. Verify environment variables are set
