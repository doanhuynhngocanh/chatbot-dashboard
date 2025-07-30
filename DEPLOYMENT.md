# Deployment Guide

## Quick Deployment to Vercel

### Option 1: Deploy from Root Directory

1. **Navigate to the chatbot directory**:
   ```bash
   cd chatbot
   ```

2. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

3. **Login to Vercel**:
   ```bash
   vercel login
   ```

4. **Deploy the project**:
   ```bash
   vercel
   ```

5. **Set environment variables** in the Vercel dashboard:
   - Go to your project settings
   - Navigate to Environment Variables
   - Add the required environment variables

6. **Deploy to production**:
   ```bash
   vercel --prod
   ```

### Option 2: Deploy from GitHub

1. **Push to GitHub** from the root directory:
   ```bash
   # From the root directory (Dung Lai Lap Trinh - AI Agent)
   git add .
   git commit -m "Add chatbot Vercel deployment"
   git push origin main
   ```

2. **Import to Vercel**:
   - Go to [Vercel](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - **Important**: Set the **Root Directory** to `chatbot`
   - Configure environment variables
   - Deploy

### 3. Database Setup

Create a `conversations` table in Supabase with the following structure:

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

### 4. Test Your Deployment

- Visit your Vercel URL
- Test the chat functionality
- Test the dashboard at `/dashboard.html`
- Test the health endpoint at `/api/health`

## Project Structure

```
chatbot/
├── api/                    # Vercel serverless functions
│   ├── chat.js            # Main chat endpoint
│   ├── conversations.js   # Fetch conversations list
│   ├── conversation.js    # Individual conversation operations
│   └── health.js          # Health check endpoint
├── public/                # Static files
│   ├── index.html         # Main chat interface
│   ├── dashboard.html     # Dashboard interface
│   ├── script.js          # Chat functionality
│   ├── dashboard.js       # Dashboard functionality
│   └── style.css          # Styling
├── vercel.json            # Vercel configuration
├── package.json           # Dependencies
├── .gitignore            # Git ignore file
├── README.md             # Documentation
├── DEPLOYMENT.md         # This file
└── TROUBLESHOOTING.md    # Troubleshooting guide
```

## Environment Variables

Make sure to set these in your Vercel project settings:

- `OPENAI_API_KEY` - Your OpenAI API key
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key

## API Endpoints

- **POST** `/api/chat` - Send chat messages
- **GET** `/api/conversations?page=1&limit=10` - Fetch conversations
- **GET** `/api/conversation?sessionId=123` - Fetch specific conversation
- **DELETE** `/api/conversation?sessionId=123` - Delete conversation
- **POST** `/api/conversation?sessionId=123` - Analyze conversation
- **GET** `/api/health` - Health check endpoint

## Local Development

1. **Navigate to the chatbot directory**:
   ```bash
   cd chatbot
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create a `.env` file** with your environment variables:
   ```
   OPENAI_API_KEY=your_openai_key
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_key
   ```

4. **Run locally**:
   ```bash
   npm run dev
   ```

## Important Notes

- **Root Directory**: When deploying from GitHub, make sure to set the Root Directory to `chatbot` in Vercel
- **Environment Variables**: All environment variables must be set in Vercel dashboard
- **Database**: The conversations table must be created in Supabase before using the app
- **Health Check**: Use `/api/health` to test if the API is working

## Troubleshooting

If you encounter issues:

1. **Check the troubleshooting guide**: `TROUBLESHOOTING.md`
2. **Verify Root Directory**: Make sure Vercel is set to use the `chatbot` directory
3. **Test health endpoint**: Visit `/api/health` to check API status
4. **Check environment variables**: Ensure all required variables are set
5. **Review Vercel logs**: Check function logs in the Vercel dashboard 