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

  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  // Test 1: Check if API key exists
  results.tests.push({
    name: 'API Key Check',
    status: process.env.OPENAI_API_KEY ? 'PASS' : 'FAIL',
    details: process.env.OPENAI_API_KEY ? 'API key is set' : 'API key is missing'
  });

  if (!process.env.OPENAI_API_KEY) {
    return res.json(results);
  }

  // Test 2: Try with fetch (native Node.js)
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5,
      }),
    });

    const data = await response.json();
    
    results.tests.push({
      name: 'Fetch API Test',
      status: response.ok ? 'PASS' : 'FAIL',
      details: response.ok ? 'API call successful' : `Error: ${data.error?.message || response.statusText}`,
      response: data
    });
  } catch (error) {
    results.tests.push({
      name: 'Fetch API Test',
      status: 'FAIL',
      details: `Network error: ${error.message}`,
      error: error.message
    });
  }

  // Test 3: Try with OpenAI SDK
  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 15000,
    });
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5,
    });
    
    results.tests.push({
      name: 'OpenAI SDK Test',
      status: 'PASS',
      details: 'SDK call successful',
      response: completion.choices[0].message
    });
  } catch (error) {
    results.tests.push({
      name: 'OpenAI SDK Test',
      status: 'FAIL',
      details: `SDK error: ${error.message}`,
      error: {
        message: error.message,
        code: error.code,
        status: error.status,
        type: error.type
      }
    });
  }

  res.json(results);
}; 