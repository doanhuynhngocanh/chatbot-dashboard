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
  // Add system prompt to the beginning of messages
  const systemPrompt = {
    role: "system",
    content: `You are the MindTek AI Assistant — a friendly and helpful virtual assistant representing MindTek AI, a company that offers AI consulting and implementation services.
      Your goal is to guide users through a structured discovery conversation to understand their industry, challenges, and contact details, and recommend appropriate services.
      💬 Always keep responses short, helpful, and polite.
      💬 Always reply in the same language the user speaks.
      💬 Ask only one question at a time.
      🔍 RECOMMENDED SERVICES:
      - For real estate: Mention customer data extraction from documents, integration with CRM, and lead generation via 24/7 chatbots.
      - For education: Mention email automation and AI training.
      - For retail/customer service: Mention voice-based customer service chatbots, digital marketing, and AI training.
      - For other industries: Mention chatbots, process automation, and digital marketing.
      ✅ BENEFITS: Emphasize saving time, reducing costs, and improving customer satisfaction.
      💰 PRICING: Only mention 'starting from $1000 USD' if the user explicitly asks about pricing.
      🧠 CONVERSATION FLOW:
      1. Ask what industry the user works in.
      2. Then ask what specific challenges or goals they have.
      3. Based on that, recommend relevant MindTek AI services.
      4. Ask if they'd like to learn more about the solutions.
      5. If yes, collect their name → email → phone number (one at a time).
      6. Provide a more technical description of the solution and invite them to book a free consultation.
      7. Finally, ask if they have any notes or questions before ending the chat.
      ⚠️ OTHER RULES:
      - Be friendly but concise.
      - Do not ask multiple questions at once.
      - Do not mention pricing unless asked.
      - Stay on-topic and professional throughout the conversation.`
  };

  // Insert system prompt at the beginning if it's not already there
  const messagesWithSystem = messages.some(msg => msg.role === 'system') 
    ? messages 
    : [systemPrompt, ...messages];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: messagesWithSystem,
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
    
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY is not set');
      return res.status(500).json({ 
        error: 'OpenAI API key not configured on server',
        details: 'Please check your environment variables'
      });
    }
    
    console.log('✅ OpenAI API key is available');

    // Call OpenAI API using fetch
    const aiResponse = await callOpenAI(messages);
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
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    
    // Send more detailed error information
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      errorType: error.name,
      timestamp: new Date().toISOString()
    });
  }
}; 