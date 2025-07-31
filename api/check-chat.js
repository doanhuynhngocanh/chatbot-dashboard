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
    message: 'Chat endpoint check',
    tests: []
  };

  // Test 1: Check if chat.js exists and can be imported
  try {
    const chatModule = require('./chat.js');
    results.tests.push({
      name: 'Chat Module Import',
      status: 'PASS',
      details: 'Chat module can be imported'
    });
  } catch (error) {
    results.tests.push({
      name: 'Chat Module Import',
      status: 'FAIL',
      details: `Import error: ${error.message}`
    });
  }

  // Test 2: Check if the function is callable
  try {
    const chatFunction = require('./chat.js');
    if (typeof chatFunction === 'function') {
      results.tests.push({
        name: 'Chat Function Type',
        status: 'PASS',
        details: 'Chat function is callable'
      });
    } else {
      results.tests.push({
        name: 'Chat Function Type',
        status: 'FAIL',
        details: 'Chat function is not callable'
      });
    }
  } catch (error) {
    results.tests.push({
      name: 'Chat Function Type',
      status: 'FAIL',
      details: `Type check error: ${error.message}`
    });
  }

  // Test 3: Check environment variables
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

  res.json(results);
}; 