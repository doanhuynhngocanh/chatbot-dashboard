require('dotenv').config();

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const webhookUrl = process.env.WEBHOOK_URL;
    
    const debugInfo = {
      webhookUrl: webhookUrl ? '✅ Set' : '❌ Not set',
      webhookUrlValue: webhookUrl || 'Not configured',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      allEnvVars: {
        OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Not set',
        SUPABASE_URL: process.env.SUPABASE_URL ? '✅ Set' : '❌ Not set',
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set',
        WEBHOOK_URL: webhookUrl ? '✅ Set' : '❌ Not set'
      }
    };

    console.log('🔍 Debug webhook info:', debugInfo);

    res.json({
      success: true,
      debug: debugInfo,
      message: webhookUrl ? 'Webhook URL is configured' : 'Webhook URL is NOT configured'
    });

  } catch (error) {
    console.error('❌ Error in debug endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}; 