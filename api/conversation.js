const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

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

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

  const { sessionId } = req.query;

  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    // GET - Fetch conversation
    if (req.method === 'GET') {
      console.log('📖 Loading conversation:', sessionId);

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('conversation_id', sessionId)
        .single();

      if (error) {
        console.error('❌ Error fetching conversation:', error);
        return res.status(404).json({ error: 'Conversation not found' });
      }

      console.log('✅ Conversation loaded successfully');
      res.json({ conversation: data.messages || [] });
    }

    // DELETE - Delete conversation
    else if (req.method === 'DELETE') {
      console.log('🗑️ Deleting conversation:', sessionId);

      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('conversation_id', sessionId);

      if (error) {
        console.error('❌ Error deleting conversation:', error);
        return res.status(500).json({ error: 'Failed to delete conversation' });
      }

      console.log('✅ Conversation deleted successfully');
      res.json({ success: true, message: 'Conversation deleted successfully' });
    }

    // POST - Analyze conversation
    else if (req.method === 'POST') {
      console.log('🔍 Analyzing conversation:', sessionId);

      // Get conversation messages
      const { data: conversation, error: fetchError } = await supabase
        .from('conversations')
        .select('messages')
        .eq('conversation_id', sessionId)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching conversation for analysis:', fetchError);
        return res.status(404).json({ error: 'Conversation not found' });
      }

      if (!conversation.messages || conversation.messages.length === 0) {
        return res.status(400).json({ error: 'No messages found in conversation' });
      }

      // Prepare conversation text for analysis
      const conversationText = conversation.messages
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n\n');

      console.log('📄 Conversation text prepared for analysis');

      // System prompt for analysis
      const systemPrompt = `Extract the following customer details from the transcript:
- Name
- Email address
- Phone number
- Industry
- Problems, needs, and goals summary
- Availability
- Whether they have booked a consultation (true/false)
- Any special notes
- Lead quality (categorize as 'good', 'ok', or 'spam')

If the user provided contact details, set lead quality to "good"; otherwise, "spam".

Return ONLY a valid JSON object with these fields:
{
  "customer_name": "",
  "customer_email": "",
  "customer_phone": "",
  "customer_industry": "",
  "customer_problem": "",
  "customer_availability": "",
  "customer_consultation": false,
  "special_notes": "",
  "lead_quality": "spam"
}

Use empty strings for missing information.`;

      try {
        console.log('🤖 Calling OpenAI for analysis...');

        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: conversationText }
          ],
          max_tokens: 1000,
          temperature: 0.3,
        });

        const analysisResult = completion.choices[0].message.content;
        console.log('📄 Raw OpenAI response:', analysisResult);

        // Extract JSON from the response
        let jsonString = analysisResult;
        
        // Try to extract JSON from markdown code blocks
        const jsonMatch = analysisResult.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonString = jsonMatch[1];
        } else {
          // Try to extract JSON from regular code blocks
          const codeMatch = analysisResult.match(/```\s*([\s\S]*?)\s*```/);
          if (codeMatch) {
            jsonString = codeMatch[1];
          }
        }

        console.log('🔍 Extracted JSON string:', jsonString);

        let analysis;
        try {
          analysis = JSON.parse(jsonString);
        } catch (parseError) {
          console.error('❌ JSON parsing error:', parseError);
          console.error('Attempting to parse entire response...');
          try {
            analysis = JSON.parse(analysisResult);
          } catch (secondParseError) {
            console.error('❌ Second parsing attempt failed:', secondParseError);
            return res.status(500).json({ 
              error: 'Failed to parse analysis result',
              details: 'Invalid JSON response from OpenAI',
              rawResponse: analysisResult
            });
          }
        }

        console.log('✅ Analysis parsed successfully:', analysis);

        // Update conversation with analysis results
        const { error: updateError } = await supabase
          .from('conversations')
          .update({
            customer_name: analysis.customer_name || '',
            customer_email: analysis.customer_email || '',
            customer_phone: analysis.customer_phone || '',
            customer_industry: analysis.customer_industry || '',
            customer_problem: analysis.customer_problem || '',
            customer_availability: analysis.customer_availability || '',
            customer_consultation: analysis.customer_consultation || false,
            special_notes: analysis.special_notes || '',
            lead_quality: analysis.lead_quality || 'spam'
          })
          .eq('conversation_id', sessionId);

        if (updateError) {
          console.error('❌ Error updating conversation with analysis:', updateError);
          return res.status(500).json({ error: 'Failed to save analysis results' });
        }

        console.log('✅ Analysis results saved to database');
        res.json({ 
          success: true, 
          analysis: analysis,
          message: 'Analysis completed successfully' 
        });

      } catch (openaiError) {
        console.error('❌ OpenAI API error:', openaiError);
        res.status(500).json({ 
          error: 'Failed to analyze conversation',
          details: openaiError.message 
        });
      }
    }

    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('❌ Error in conversation endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}; 