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

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    console.log('🔍 Fetching conversations from database for dashboard...');

    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    console.log(`📄 Pagination: page=${page}, limit=${limit}, offset=${offset}`);

    // First, get total count for pagination info
    const { count, error: countError } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error getting conversation count:', countError);
      return res.status(500).json({ error: countError.message });
    }

    // Then get paginated data
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('❌ Error fetching conversations from database:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('✅ Fetched conversations from database:', data?.length || 0);
    console.log(`📊 Total conversations: ${count}, Showing: ${offset + 1}-${Math.min(offset + limit, count)}`);

    // Map the data for frontend compatibility
    const mappedConversations = (data || []).map(row => ({
      conversation_id: row.conversation_id,
      sessionId: row.conversation_id, // For compatibility
      timestamp: row.created_at || row.timestamp,
      created_at: row.created_at,
      messages: row.messages || [],
      customer_name: row.customer_name,
      customer_email: row.customer_email,
      customer_phone: row.customer_phone,
      customer_industry: row.customer_industry,
      customer_problem: row.customer_problem,
      customer_availability: row.customer_availability,
      customer_consultation: row.customer_consultation,
      special_notes: row.special_notes,
      lead_quality: row.lead_quality
    }));

    // Return paginated response with metadata
    res.json({
      conversations: mappedConversations,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalConversations: count,
        conversationsPerPage: limit,
        hasNextPage: page < Math.ceil(count / limit),
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('❌ Error in conversations endpoint:', error);
    res.status(500).json({ error: 'Failed to fetch conversations from database' });
  }
}; 