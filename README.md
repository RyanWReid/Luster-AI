# Luster AI - Local Development Setup

Real estate photo enhancement platform with AI processing queue.

## Quick Start

1. **Install dependencies**
   ```bash
   npm install  # Install root dependencies
   npm run setup  # Install all service dependencies
   ```

2. **Add your OpenAI API key**
   ```bash
   # Edit services/worker/.env
   OPENAI_API_KEY=your_actual_openai_api_key
   ```

3. **Start all services**
   ```bash
   npm run dev
   ```

This starts:
- Database (Postgres on port 5432)
- API server (FastAPI on port 8000) 
- Worker (Python background processor)
- Web app (Next.js on port 3000)

4. **Open the app**
   ```
   http://localhost:3000
   ```

## Architecture

```
/apps/web          # Next.js frontend (port 3000)
/services/api      # FastAPI backend (port 8000)  
/services/worker   # Python job processor
/infra             # Docker setup for Postgres
/uploads           # Local file storage (original images)
/outputs           # Local file storage (processed images)
```

## How It Works

1. **Upload**: User uploads photos via web interface
2. **Queue**: Photos are stored locally, jobs created in database
3. **Process**: Worker polls database, processes images with ChatGPT API
4. **Download**: User downloads enhanced photos

## Your Integration

Replace the placeholder in `services/worker/processor.py` with your actual ChatGPT image processing code:

```python
def process_image(self, input_path: str, prompt: str, output_path: str) -> bool:
    # TODO: Replace with your existing script
    # Current placeholder just copies the image
```

## Available Scripts

- `npm run dev` - Start all services
- `npm run stop` - Stop database
- `npm run setup` - Install all dependencies

## Database

- **Host**: localhost:5432
- **Database**: luster  
- **User**: luster
- **Password**: luster_dev

Default user with 10 credits is created automatically.

## File Structure

```
uploads/           # Original uploaded images
outputs/           # AI-processed images  
infra/schema.sql   # Database schema
```

## Next Steps

1. Replace processor placeholder with your ChatGPT script
2. Test the full upload → process → download flow
3. Add your desired style presets
4. Deploy to production (Vercel + Railway recommended)

## Deployment Ready

The codebase is designed to easily switch to production:
- **Frontend**: Deploy to Vercel
- **Backend**: Deploy to Railway 
- **Database**: Use Supabase Postgres
- **Storage**: Switch to Cloudflare R2
- **Auth**: Add Supabase Auth