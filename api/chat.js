const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    const { message, sessionId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    console.log('💬 Chat request received:');
    console.log('Session ID:', sessionId);
    console.log('Message:', message);

    // Get conversation history from Supabase
    let conversationHistory = [];
    if (supabase) {
      try {
        const { data: existingConversation, error } = await supabase
          .from('conversations')
          .select('messages')
          .eq('conversation_id', sessionId)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
          console.error('❌ Error fetching conversation:', error);
        } else if (existingConversation && existingConversation.messages) {
          conversationHistory = existingConversation.messages;
          console.log('📚 Loaded conversation history:', conversationHistory.length, 'messages');
        }
      } catch (error) {
        console.error('❌ Error accessing Supabase:', error);
      }
    }

    // Add user message to history
    conversationHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });

    // Prepare messages for OpenAI
    const messages = conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    console.log('🤖 Calling OpenAI API...');
    console.log('Messages to send:', messages.length);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0].message.content;
    console.log('✅ OpenAI response received');

    // Add AI response to history
    conversationHistory.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString()
    });

    // Save to Supabase
    if (supabase) {
      try {
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
        } else {
          console.log('✅ Conversation saved to Supabase');
        }
      } catch (error) {
        console.error('❌ Error saving conversation:', error);
      }
    }

    // Return response
    res.json({
      response: aiResponse,
      sessionId: sessionId,
      messageCount: conversationHistory.length
    });

  } catch (error) {
    console.error('❌ Error in chat endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}; 