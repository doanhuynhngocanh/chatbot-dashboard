require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

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

  // Test 1: Check if Supabase is configured
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    results.tests.push({
      name: 'Supabase Configuration',
      status: 'FAIL',
      details: 'Supabase credentials not set'
    });
    return res.json(results);
  }

  results.tests.push({
    name: 'Supabase Configuration',
    status: 'PASS',
    details: 'Supabase credentials are set'
  });

  // Test 2: Try to connect to Supabase
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    results.tests.push({
      name: 'Supabase Connection',
      status: 'PASS',
      details: 'Connected to Supabase successfully'
    });

    // Test 3: Check if conversations table exists
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .limit(1);

      if (error) {
        results.tests.push({
          name: 'Table Access',
          status: 'FAIL',
          details: `Error accessing conversations table: ${error.message}`
        });
      } else {
        results.tests.push({
          name: 'Table Access',
          status: 'PASS',
          details: 'Conversations table is accessible'
        });
      }
    } catch (tableError) {
      results.tests.push({
        name: 'Table Access',
        status: 'FAIL',
        details: `Exception accessing table: ${tableError.message}`
      });
    }

    // Test 4: Try to insert a test record
    try {
      const testData = {
        conversation_id: `test_${Date.now()}`,
        messages: [
          {
            role: 'user',
            content: 'Test message',
            timestamp: new Date().toISOString()
          }
        ],
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('conversations')
        .insert(testData)
        .select();

      if (error) {
        results.tests.push({
          name: 'Insert Test',
          status: 'FAIL',
          details: `Error inserting test record: ${error.message}`
        });
      } else {
        results.tests.push({
          name: 'Insert Test',
          status: 'PASS',
          details: 'Successfully inserted test record'
        });

        // Clean up - delete the test record
        await supabase
          .from('conversations')
          .delete()
          .eq('conversation_id', testData.conversation_id);
      }
    } catch (insertError) {
      results.tests.push({
        name: 'Insert Test',
        status: 'FAIL',
        details: `Exception during insert: ${insertError.message}`
      });
    }

    // Test 5: Check table structure by trying to select specific columns
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('conversation_id, messages, created_at')
        .limit(1);

      if (error) {
        results.tests.push({
          name: 'Column Access',
          status: 'FAIL',
          details: `Error selecting columns: ${error.message}`
        });
      } else {
        results.tests.push({
          name: 'Column Access',
          status: 'PASS',
          details: 'All required columns are accessible'
        });
      }
    } catch (columnError) {
      results.tests.push({
        name: 'Column Access',
        status: 'FAIL',
        details: `Exception selecting columns: ${columnError.message}`
      });
    }

  } catch (connectionError) {
    results.tests.push({
      name: 'Supabase Connection',
      status: 'FAIL',
      details: `Connection error: ${connectionError.message}`
    });
  }

  res.json(results);
}; 