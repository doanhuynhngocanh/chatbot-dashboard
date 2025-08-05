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

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { testData } = req.body;

    if (!testData) {
      return res.status(400).json({ error: 'Test data is required' });
    }

    const webhookUrl = process.env.WEBHOOK_URL;
    
    if (!webhookUrl) {
      return res.status(400).json({ 
        error: 'Webhook URL not configured',
        message: 'Please set WEBHOOK_URL environment variable'
      });
    }

    console.log('🧪 Testing webhook with URL:', webhookUrl);
    console.log('📤 Sending test data:', testData);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const responseText = await response.text();
    
    if (response.ok) {
      console.log('✅ Webhook test successful');
      res.json({
        success: true,
        status: response.status,
        response: responseText,
        message: 'Webhook test completed successfully'
      });
    } else {
      console.error('❌ Webhook test failed:', response.status, responseText);
      res.status(response.status).json({
        success: false,
        status: response.status,
        response: responseText,
        message: 'Webhook test failed'
      });
    }

  } catch (error) {
    console.error('❌ Error in webhook test:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}; 