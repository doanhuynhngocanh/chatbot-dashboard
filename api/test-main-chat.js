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

  // Test 1: Check if we can import the main chat function
  try {
    const chatFunction = require('./chat.js');
    results.tests.push({
      name: 'Import Chat Function',
      status: 'PASS',
      details: 'Successfully imported chat function'
    });
  } catch (error) {
    results.tests.push({
      name: 'Import Chat Function',
      status: 'FAIL',
      details: `Import error: ${error.message}`
    });
    return res.json(results);
  }

  // Test 2: Try to call the chat function with test data
  try {
    const testReq = {
      method: 'POST',
      body: {
        message: 'Hello, this is a test',
        sessionId: 'test_session_' + Date.now()
      }
    };

    const testRes = {
      status: (code) => ({
        json: (data) => {
          results.tests.push({
            name: 'Chat Function Test',
            status: code === 200 ? 'PASS' : 'FAIL',
            details: `Response status: ${code}`,
            response: data
          });
        }
      }),
      setHeader: () => {},
      end: () => {}
    };

    // Call the chat function
    await require('./chat.js')(testReq, testRes);

  } catch (error) {
    results.tests.push({
      name: 'Chat Function Test',
      status: 'FAIL',
      details: `Function error: ${error.message}`,
      error: {
        message: error.message,
        stack: error.stack
      }
    });
  }

  res.json(results);
}; 