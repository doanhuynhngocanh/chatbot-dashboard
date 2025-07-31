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
    message: 'System prompt test',
    test: 'This endpoint tests if the system prompt is working'
  };

  // Test OpenAI API call with system prompt
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
          messages: [
            {
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
            },
            {
              role: 'user',
              content: 'Hello'
            }
          ],
          max_tokens: 100,
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        results.openaiTest = 'PASS';
        results.response = data.choices[0].message.content;
      } else {
        results.openaiTest = 'FAIL';
        results.error = `HTTP ${response.status}`;
      }
    } catch (error) {
      results.openaiTest = 'FAIL';
      results.error = error.message;
    }
  } else {
    results.openaiTest = 'SKIP';
    results.error = 'OpenAI API key not set';
  }

  res.json(results);
}; 