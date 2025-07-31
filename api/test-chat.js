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

  // Test 1: Basic endpoint functionality
  results.tests.push({
    name: 'Basic Endpoint',
    status: 'PASS',
    details: 'Endpoint is accessible'
  });

  // Test 2: Environment variables
  const envVars = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET',
    SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'NOT SET',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'
  };

  results.tests.push({
    name: 'Environment Variables',
    status: Object.values(envVars).every(v => v === 'SET') ? 'PASS' : 'FAIL',
    details: envVars
  });

  // Test 3: Supabase connection
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    try {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
      
      // Test a simple query
      const { data, error } = await supabase
        .from('conversations')
        .select('conversation_id')
        .limit(1);

      results.tests.push({
        name: 'Supabase Connection',
        status: error ? 'FAIL' : 'PASS',
        details: error ? `Error: ${error.message}` : 'Connected successfully'
      });
    } catch (error) {
      results.tests.push({
        name: 'Supabase Connection',
        status: 'FAIL',
        details: `Exception: ${error.message}`
      });
    }
  } else {
    results.tests.push({
      name: 'Supabase Connection',
      status: 'SKIP',
      details: 'Supabase credentials not set'
    });
  }

  // Test 4: OpenAI API call
  if (process.env.OPENAI_API_KEY) {
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
        name: 'OpenAI API',
        status: response.ok ? 'PASS' : 'FAIL',
        details: response.ok ? 'API call successful' : `Error: ${data.error?.message || response.statusText}`
      });
    } catch (error) {
      results.tests.push({
        name: 'OpenAI API',
        status: 'FAIL',
        details: `Network error: ${error.message}`
      });
    }
  } else {
    results.tests.push({
      name: 'OpenAI API',
      status: 'SKIP',
      details: 'OpenAI API key not set'
    });
  }

  // Test 5: Request body parsing
  if (req.method === 'POST') {
    try {
      const { message, sessionId } = req.body;
      results.tests.push({
        name: 'Request Body',
        status: 'PASS',
        details: {
          message: message ? 'Present' : 'Missing',
          sessionId: sessionId ? 'Present' : 'Missing',
          bodyKeys: Object.keys(req.body)
        }
      });
    } catch (error) {
      results.tests.push({
        name: 'Request Body',
        status: 'FAIL',
        details: `Parsing error: ${error.message}`
      });
    }
  }

  res.json(results);
}; 