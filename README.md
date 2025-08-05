# AI Chatbot with Dashboard

This repository contains a Vercel serverless chatbot with dashboard functionality.

## Project Structure

```
Dung Lai Lap Trinh - AI Agent/
└── chatbot/                    # Vercel deployment directory
    ├── api/                    # Serverless functions
    │   ├── chat.js            # Main chat endpoint
    │   ├── conversations.js   # Fetch conversations list
    │   ├── conversation.js    # Individual conversation operations
    │   ├── health.js          # Health check endpoint
    │   └── test-webhook.js    # Webhook testing endpoint
    ├── public/                # Static files
    │   ├── index.html         # Main chat interface
    │   ├── dashboard.html     # Dashboard interface
    │   ├── test-webhook.html  # Webhook testing interface
    │   ├── script.js          # Chat functionality
    │   ├── dashboard.js       # Dashboard functionality
    │   └── style.css          # Styling
    ├── vercel.json            # Vercel configuration
    ├── package.json           # Dependencies
    ├── .gitignore            # Git ignore file
    ├── README.md             # Detailed documentation
    ├── DEPLOYMENT.md         # Deployment guide
    └── TROUBLESHOOTING.md    # Troubleshooting guide
```

## Quick Start

### For Development:
```bash
cd chatbot
npm install
npm run dev
```

### For Deployment:
1. **Push to GitHub** from the root directory
2. **Import to Vercel** and set Root Directory to `chatbot`
3. **Set environment variables** in Vercel dashboard
4. **Deploy**

## Documentation

- **Main Documentation**: `chatbot/README.md`
- **Deployment Guide**: `chatbot/DEPLOYMENT.md`
- **Troubleshooting**: `chatbot/TROUBLESHOOTING.md`

## Features

- 🤖 AI-powered chat using OpenAI GPT-3.5-turbo
- 📊 Conversation dashboard with filtering and pagination
- 🔍 AI-powered conversation analysis
- 💾 Persistent storage with Supabase
- 🌐 Automatic webhook integration for conversation processing
- 🎨 Modern, responsive UI
- 📱 Mobile-friendly design

## Environment Variables Required

- `OPENAI_API_KEY` - Your OpenAI API key
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `WEBHOOK_URL` - Your webhook URL for processing conversations (optional)

## License

MIT License 