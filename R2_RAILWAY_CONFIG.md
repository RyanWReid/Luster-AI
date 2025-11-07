# R2 Environment Variables for Railway

## Required Environment Variables

Add these environment variables to **BOTH** the API and Worker services in Railway:

### R2 Storage Configuration

```bash
# Cloudflare Account ID
R2_ACCOUNT_ID=166b9c9bf337bddc8d414180df2bfe1f

# R2 Access Credentials
R2_ACCESS_KEY_ID=tIHzXW6koFvM0Xe9yfs0X9TO8-1LyXkg-45tv8wp
R2_SECRET_ACCESS_KEY=<YOUR_SECRET_ACCESS_KEY_HERE>

# R2 Bucket Name
R2_BUCKET_NAME=luster
```

## How to Add Variables in Railway

### Option 1: Railway Dashboard (Recommended)
1. Go to your Railway project dashboard
2. Click on the **API Service**
3. Go to the **Variables** tab
4. Click **Raw Editor**
5. Add the variables above (one per line, format: `KEY=value`)
6. Click **Save**
7. Repeat for the **Worker Service**

### Option 2: Railway CLI
```bash
# For API service
railway variables set R2_ACCOUNT_ID=166b9c9bf337bddc8d414180df2bfe1f --service api
railway variables set R2_ACCESS_KEY_ID=tIHzXW6koFvM0Xe9yfs0X9TO8-1LyXkg-45tv8wp --service api
railway variables set R2_SECRET_ACCESS_KEY=<YOUR_SECRET_KEY> --service api
railway variables set R2_BUCKET_NAME=luster --service api

# For Worker service
railway variables set R2_ACCOUNT_ID=166b9c9bf337bddc8d414180df2bfe1f --service worker
railway variables set R2_ACCESS_KEY_ID=tIHzXW6koFvM0Xe9yfs0X9TO8-1LyXkg-45tv8wp --service worker
railway variables set R2_SECRET_ACCESS_KEY=<YOUR_SECRET_KEY> --service worker
railway variables set R2_BUCKET_NAME=luster --service worker
```

## Verification

After adding the environment variables:

1. **Redeploy both services** - Railway should automatically redeploy when you add variables
2. **Check the health endpoint**: `https://your-api-url.railway.app/health`
   - You should see `"r2_storage": "enabled"` in the response
3. **Check logs** for any R2 initialization errors

## R2 Endpoint Structure

The S3 client will automatically construct the R2 endpoint:
```
https://166b9c9bf337bddc8d414180df2bfe1f.r2.cloudflarestorage.com
```

## Storage Layout in R2

Files will be organized as:
```
/{userId}/{shootId}/{assetId}/original.{ext}
/{userId}/{shootId}/{assetId}/outputs/{jobId}_v{n}.jpg
/{userId}/{shootId}/{assetId}/thumb.jpg
```

## Security Notes

- ✅ The Secret Access Key was shown only once during token creation in Cloudflare
- ✅ If you didn't save it, you'll need to create a new R2 API token
- ✅ Never commit these credentials to version control
- ✅ Railway encrypts environment variables at rest

## Testing R2 Integration

Once variables are configured:

1. **Test presigned upload URL generation**:
   ```bash
   curl -X POST https://your-api-url.railway.app/uploads/presign \
     -H "Content-Type: application/json" \
     -d '{
       "shoot_id": "YOUR_SHOOT_ID",
       "filename": "test.jpg",
       "content_type": "image/jpeg"
     }'
   ```

2. **Test direct upload** using the returned presigned URL
3. **Test asset confirmation** after upload completes
4. **Create a job** to test worker downloading from R2 and uploading enhanced image back

## Next Steps

1. ✅ Add environment variables to both services
2. ✅ Verify services redeploy successfully
3. ✅ Test presigned URL generation
4. ✅ Test direct client upload to R2
5. ✅ Test worker processing with R2 storage
