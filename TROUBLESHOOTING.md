# Troubleshooting Guide

## Common Issues and Solutions

### 1. 404 Error on Root Path

**Problem**: `GET https://your-app.vercel.app/ 404 (Not Found)`

**Solutions**:
1. **Check Root Directory**: Make sure Vercel is set to use the `chatbot` directory as the root
2. **Check file structure**: Ensure `chatbot/public/index.html` exists
3. **Verify vercel.json**: Make sure routes are configured correctly
4. **Check deployment logs**: Look for build errors in Vercel dashboard

**Test the health endpoint**: Visit `https://your-app.vercel.app/api/health`

### 2. Wrong Root Directory in Vercel

**Problem**: Vercel is not finding the files

**Solution**: 
1. Go to Vercel Dashboard → Your Project → Settings → General
2. Set **Root Directory** to `chatbot`
3. Redeploy the project

### 3. Environment Variables Not Set

**Problem**: API calls fail with authentication errors

**Solution**: 
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add these variables:
   - `OPENAI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

### 4. Database Connection Issues

**Problem**: Supabase connection fails

**Solutions**:
1. **Check Supabase credentials**: Verify URL and key are correct
2. **Create database table**: Run this SQL in Supabase:
   ```sql
   CREATE TABLE conversations (
     conversation_id TEXT PRIMARY KEY,
     messages JSONB,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     customer_name TEXT,
     customer_email TEXT,
     customer_phone TEXT,
     customer_industry TEXT,
     customer_problem TEXT,
     customer_availability TEXT,
     customer_consultation BOOLEAN,
     special_notes TEXT,
     lead_quality TEXT
   );
   ```

### 5. CORS Issues

**Problem**: Frontend can't call API endpoints

**Solution**: API endpoints already include CORS headers, but check:
1. **Browser console** for CORS errors
2. **Network tab** to see if requests are being made
3. **API endpoint URLs** are correct

### 6. Build Failures

**Problem**: Deployment fails during build

**Solutions**:
1. **Check package.json**: Ensure all dependencies are listed
2. **Verify Node.js version**: Should be >= 18.0.0
3. **Check file paths**: Ensure all files are in correct directories
4. **Verify Root Directory**: Make sure Vercel is set to `chatbot`

## Testing Your Deployment

### 1. Health Check
Visit: `https://your-app.vercel.app/api/health`
Expected: JSON response with status "ok"

### 2. Static Files
Visit: `https://your-app.vercel.app/`
Expected: Chat interface loads

### 3. Dashboard
Visit: `https://your-app.vercel.app/dashboard.html`
Expected: Dashboard interface loads

### 4. API Endpoints
Test with curl or Postman:
```bash
# Health check
curl https://your-app.vercel.app/api/health

# Chat endpoint
curl -X POST https://your-app.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","sessionId":"test123"}'
```

## Debugging Steps

1. **Check Vercel Function Logs**:
   - Go to Vercel Dashboard → Your Project → Functions
   - Click on any function to see logs

2. **Test Locally**:
   ```bash
   cd chatbot
   npm install
   npx vercel dev
   ```

3. **Check Environment Variables**:
   - Verify all required variables are set
   - Check for typos in variable names

4. **Verify File Structure**:
   ```
   chatbot/
   ├── api/
   │   ├── chat.js
   │   ├── conversations.js
   │   ├── conversation.js
   │   └── health.js
   ├── public/
   │   ├── index.html
   │   ├── dashboard.html
   │   ├── script.js
   │   ├── dashboard.js
   │   └── style.css
   ├── vercel.json
   └── package.json
   ```

5. **Check Root Directory Setting**:
   - In Vercel Dashboard → Settings → General
   - Root Directory should be set to `chatbot`

## Common Error Messages

- **"Module not found"**: Check file paths and imports
- **"Environment variable not set"**: Add missing environment variables
- **"CORS error"**: Check API endpoint URLs
- **"Database connection failed"**: Verify Supabase credentials
- **"OpenAI API error"**: Check OpenAI API key and quota
- **"404 Not Found"**: Check Root Directory setting in Vercel

## Getting Help

1. **Check Vercel Documentation**: https://vercel.com/docs
2. **Review Function Logs**: In Vercel Dashboard
3. **Test API Endpoints**: Use the health endpoint first
4. **Verify Environment Variables**: All required variables must be set
5. **Check Root Directory**: Ensure Vercel is set to use the `chatbot` directory 