require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing Supabase client:', error);
    supabase = null;
  }
}

// OpenAI API call using fetch (works in Vercel)
async function callOpenAI(messages) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

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

  const debugSteps = [];

  try {
    debugSteps.push({ step: 1, status: 'PASS', message: 'Request received' });

    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    debugSteps.push({ step: 2, status: 'PASS', message: 'Request validation passed' });

    console.log('💬 Chat request received:');
    console.log('Session ID:', sessionId);
    console.log('Message:', message);

    // Get conversation history from Supabase
    let conversationHistory = [];
    if (supabase) {
      try {
        debugSteps.push({ step: 3, status: 'START', message: 'Fetching conversation from Supabase' });
        
        const { data: existingConversation, error } = await supabase
          .from('conversations')
          .select('messages')
          .eq('conversation_id', sessionId)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
          console.error('❌ Error fetching conversation:', error);
          debugSteps.push({ step: 3, status: 'FAIL', message: `Supabase error: ${error.message}` });
        } else if (existingConversation && existingConversation.messages) {
          conversationHistory = existingConversation.messages;
          console.log('📚 Loaded conversation history:', conversationHistory.length, 'messages');
          debugSteps.push({ step: 3, status: 'PASS', message: `Loaded ${conversationHistory.length} messages` });
        } else {
          debugSteps.push({ step: 3, status: 'PASS', message: 'No existing conversation found' });
        }
      } catch (error) {
        console.error('❌ Error accessing Supabase:', error);
        debugSteps.push({ step: 3, status: 'FAIL', message: `Exception: ${error.message}` });
      }
    } else {
      debugSteps.push({ step: 3, status: 'SKIP', message: 'Supabase not configured' });
    }

    // Add user message to history
    conversationHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });

    debugSteps.push({ step: 4, status: 'PASS', message: 'Added user message to history' });

    // Prepare messages for OpenAI
    const messages = conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    console.log('🤖 Calling OpenAI API...');
    console.log('Messages to send:', messages.length);
    
    debugSteps.push({ step: 5, status: 'START', message: 'Calling OpenAI API' });
    
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY is not set');
      debugSteps.push({ step: 5, status: 'FAIL', message: 'OpenAI API key not set' });
      return res.status(500).json({ 
        error: 'OpenAI API key not configured on server',
        details: 'Please check your environment variables'
      });
    }
    
    console.log('✅ OpenAI API key is available');

    // Call OpenAI API using fetch
    const aiResponse = await callOpenAI(messages);
    console.log('✅ OpenAI response received');

    debugSteps.push({ step: 5, status: 'PASS', message: 'OpenAI API call successful' });

    // Add AI response to history
    conversationHistory.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString()
    });

    debugSteps.push({ step: 6, status: 'PASS', message: 'Added AI response to history' });

    // Save to Supabase
    if (supabase) {
      try {
        debugSteps.push({ step: 7, status: 'START', message: 'Saving to Supabase' });
        
        const conversationData = {
          conversation_id: sessionId,
          messages: conversationHistory,
          created_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('conversations')
          .upsert(conversationData, { 
            onConflict: 'conversation_id',
            ignoreDuplicates: false 
          });

        if (error) {
          console.error('❌ Error saving to Supabase:', error);
          debugSteps.push({ step: 7, status: 'FAIL', message: `Supabase save error: ${error.message}` });
        } else {
          console.log('✅ Conversation saved to Supabase');
          debugSteps.push({ step: 7, status: 'PASS', message: 'Conversation saved to Supabase' });
        }
      } catch (error) {
        console.error('❌ Error saving conversation:', error);
        debugSteps.push({ step: 7, status: 'FAIL', message: `Exception: ${error.message}` });
      }
    } else {
      debugSteps.push({ step: 7, status: 'SKIP', message: 'Supabase not configured' });
    }

    debugSteps.push({ step: 8, status: 'PASS', message: 'Preparing response' });

    // Return response
    res.json({
      response: aiResponse,
      sessionId: sessionId,
      messageCount: conversationHistory.length,
      debugSteps: debugSteps
    });

  } catch (error) {
    console.error('❌ Error in debug chat endpoint:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    
    debugSteps.push({ step: 'ERROR', status: 'FAIL', message: error.message });
    
    // Send more detailed error information
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      errorType: error.name,
      timestamp: new Date().toISOString(),
      debugSteps: debugSteps
    });
  }
}; 