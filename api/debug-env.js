module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Check environment variables
  const envVars = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET',
    SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'NOT SET',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV || 'NOT SET'
  };

  // Check if OpenAI API key is actually valid (don't expose the key)
  let openaiStatus = 'NOT TESTED';
  let openaiError = null;
  let apiKeyPrefix = null;
  
  if (process.env.OPENAI_API_KEY) {
    // Show first few characters of API key for debugging (safely)
    apiKeyPrefix = process.env.OPENAI_API_KEY.substring(0, 7) + '...';
    
    try {
      const OpenAI = require('openai');
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        timeout: 10000, // 10 second timeout
      });
      
      // Test with a simple request
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5,
      });
      
      openaiStatus = 'WORKING';
    } catch (error) {
      openaiStatus = 'ERROR';
      openaiError = {
        message: error.message,
        code: error.code,
        status: error.status,
        type: error.type,
        stack: error.stack ? error.stack.split('\n')[0] : null
      };
    }
  }

  res.json({
    message: 'Environment Variables Debug',
    timestamp: new Date().toISOString(),
    environment: envVars,
    openaiStatus: openaiStatus,
    openaiError: openaiError,
    apiKeyPrefix: apiKeyPrefix,
    allEnvKeys: Object.keys(process.env).filter(key => 
      key.includes('OPENAI') || key.includes('SUPABASE') || key.includes('VERCEL')
    )
  });
}; 