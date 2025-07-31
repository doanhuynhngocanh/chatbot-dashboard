require('dotenv').config();

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

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Starting simple chat test...');
    
    // Step 1: Check request body
    console.log('📝 Request body:', req.body);
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    console.log('✅ Request validation passed');

    // Step 2: Check environment variables
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    console.log('✅ Environment variables check passed');

    // Step 3: Test OpenAI API call
    console.log('🤖 Testing OpenAI API...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: message }],
        max_tokens: 100,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ OpenAI API error:', errorData);
      return res.status(500).json({ 
        error: 'OpenAI API error',
        details: errorData.error?.message || response.statusText
      });
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('✅ OpenAI API call successful');

    // Step 4: Return response (skip Supabase for now)
    res.json({
      response: aiResponse,
      sessionId: sessionId,
      messageCount: 1,
      test: 'simple-chat-endpoint'
    });

  } catch (error) {
    console.error('❌ Error in simple chat endpoint:', error);
    console.error('❌ Error stack:', error.stack);
    
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      errorType: error.name,
      timestamp: new Date().toISOString()
    });
  }
}; 