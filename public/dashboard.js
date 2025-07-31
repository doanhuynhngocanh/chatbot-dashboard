// Dashboard functionality
const conversationList = document.getElementById('conversationList');
const messagesView = document.getElementById('messagesView');
const messagesContainer = document.getElementById('messagesContainer');
const messagesTitle = document.getElementById('messagesTitle');
const returnToDashboardBtn = document.getElementById('returnToDashboard');
const errorContainer = document.getElementById('errorContainer');
const analysisView = document.getElementById('analysisView');
const analysisContainer = document.getElementById('analysisContainer');
const analysisTitle = document.getElementById('analysisTitle');
const returnToDashboardFromAnalysisBtn = document.getElementById('returnToDashboardFromAnalysis');
const refreshBtn = document.getElementById('refreshBtn');

// Filter elements
const filterContainer = document.getElementById('filterContainer');
const toggleFiltersBtn = document.getElementById('toggleFiltersBtn');
const industryFilter = document.getElementById('industryFilter');
const consultationFilter = document.getElementById('consultationFilter');
const leadQualityFilter = document.getElementById('leadQualityFilter');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');
const activeFilters = document.getElementById('activeFilters');

let allConversations = [];
let currentPage = 1;
let paginationInfo = null;
let currentFilters = {
    industry: '',
    consultation: '',
    leadQuality: ''
};

// Fetch conversations from database
async function fetchConversations(page = 1) {
    try {
        console.log(`🔍 Fetching conversations from database (page ${page})...`);
        
        const response = await fetch(`/api/conversations?page=${page}&limit=10`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Fetched conversations:', data);
        console.log('📊 Number of conversations:', data.conversations?.length || 0);
        console.log('📄 Pagination info:', data.pagination);
        
        if (data.conversations && data.conversations.length > 0) {
            console.log('📊 First conversation:', {
                id: data.conversations[0].conversation_id,
                timestamp: data.conversations[0].timestamp,
                created_at: data.conversations[0].created_at,
                messages_count: data.conversations[0].messages?.length || 0
            });
        }
        
        allConversations = data.conversations || [];
        currentPage = page;
        paginationInfo = data.pagination;
        populateFilterOptions();
        renderConversationList();
        
    } catch (error) {
        console.error('❌ Error fetching conversations:', error);
        showError('Failed to load conversations. Please try again.');
    }
}

// Populate filter options from conversations data
function populateFilterOptions() {
    const industries = new Map(); // Use Map to store lowercase key -> original case
    const consultations = new Set();
    const leadQualities = new Set();
    
    allConversations.forEach(conv => {
        if (conv.customer_industry && conv.customer_industry.trim()) {
            const industry = conv.customer_industry.trim();
            const industryLower = industry.toLowerCase();
            // Keep the first occurrence of each industry (case-insensitive)
            if (!industries.has(industryLower)) {
                industries.set(industryLower, industry);
            }
        }
        if (conv.customer_consultation !== undefined && conv.customer_consultation !== null) {
            consultations.add(conv.customer_consultation.toString());
        }
        if (conv.lead_quality && conv.lead_quality.trim()) {
            leadQualities.add(conv.lead_quality.trim());
        }
    });
    
    // Populate industry filter
    industryFilter.innerHTML = '<option value="">All Industries</option>';
    Array.from(industries.entries()).sort((a, b) => a[0].localeCompare(b[0])).forEach(([lowerKey, originalCase]) => {
        const option = document.createElement('option');
        option.value = lowerKey; // Store lowercase value for comparison
        option.textContent = originalCase; // Display original case
        industryFilter.appendChild(option);
    });
    
    // Populate consultation filter
    consultationFilter.innerHTML = '<option value="">All</option>';
    Array.from(consultations).sort().forEach(consultation => {
        const option = document.createElement('option');
        option.value = consultation;
        option.textContent = consultation === 'true' ? 'Yes' : 'No';
        consultationFilter.appendChild(option);
    });
    
    // Populate lead quality filter
    leadQualityFilter.innerHTML = '<option value="">All Qualities</option>';
    Array.from(leadQualities).sort().forEach(quality => {
        const option = document.createElement('option');
        option.value = quality;
        option.textContent = quality.charAt(0).toUpperCase() + quality.slice(1);
        leadQualityFilter.appendChild(option);
    });
}

// Apply filters to conversations
function applyFilters(conversations) {
    return conversations.filter(conv => {
        // Industry filter (case-insensitive)
        if (currentFilters.industry && conv.customer_industry && 
            conv.customer_industry.toLowerCase() !== currentFilters.industry.toLowerCase()) {
            return false;
        }
        
        // Consultation filter
        if (currentFilters.consultation && conv.customer_consultation !== (currentFilters.consultation === 'true')) {
            return false;
        }
        
        // Lead quality filter
        if (currentFilters.leadQuality && conv.lead_quality !== currentFilters.leadQuality) {
            return false;
        }
        
        return true;
    });
}

// Update active filters display
function updateActiveFilters() {
    activeFilters.innerHTML = '';
    
    Object.entries(currentFilters).forEach(([key, value]) => {
        if (value) {
            const filterTag = document.createElement('div');
            filterTag.className = 'filter-tag';
            
            let label = '';
            switch(key) {
                case 'industry':
                    // Find the original case from the dropdown options
                    const industryOption = Array.from(industryFilter.options).find(option => 
                        option.value.toLowerCase() === value.toLowerCase()
                    );
                    const displayIndustry = industryOption ? industryOption.textContent : value;
                    label = `Industry: ${displayIndustry}`;
                    break;
                case 'consultation':
                    label = `Consultation: ${value === 'true' ? 'Yes' : 'No'}`;
                    break;
                case 'leadQuality':
                    label = `Quality: ${value.charAt(0).toUpperCase() + value.slice(1)}`;
                    break;
            }
            
            filterTag.innerHTML = `
                ${label}
                <button class="remove-filter" onclick="removeFilter('${key}')">×</button>
            `;
            activeFilters.appendChild(filterTag);
        }
    });
}

// Remove specific filter
function removeFilter(filterKey) {
    currentFilters[filterKey] = '';
    
    // Reset corresponding select element
    switch(filterKey) {
        case 'industry':
            industryFilter.value = '';
            break;
        case 'consultation':
            consultationFilter.value = '';
            break;
        case 'leadQuality':
            leadQualityFilter.value = '';
            break;
    }
    
    updateActiveFilters();
    renderConversationList();
}

// Clear all filters
function clearAllFilters() {
    currentFilters = {
        industry: '',
        consultation: '',
        leadQuality: ''
    };
    
    industryFilter.value = '';
    consultationFilter.value = '';
    leadQualityFilter.value = '';
    
    updateActiveFilters();
    renderConversationList();
}

// Render conversation list
function renderConversationList() {
    if (allConversations.length === 0) {
        conversationList.innerHTML = `
            <div class="empty-state">
                <h3>No conversations found</h3>
                <p>Start a conversation in the chat to see it here.</p>
            </div>
        `;
        return;
    }
    
    // Apply filters and sort conversations by timestamp (newest first)
    const filteredConversations = applyFilters(allConversations);
    const sortedConversations = filteredConversations.sort((a, b) => {
        const dateA = new Date(a.timestamp || a.created_at || 0);
        const dateB = new Date(b.timestamp || b.created_at || 0);
        return dateB - dateA;
    });
    
    conversationList.innerHTML = '';
    
    sortedConversations.forEach(conv => {
        const li = document.createElement('li');
        li.className = 'conversation-item';
        
        // Format timestamp
        const timestamp = conv.timestamp || conv.created_at;
        const formattedDate = timestamp ? new Date(timestamp).toLocaleString() : 'Unknown date';
        
        // Count messages
        const messageCount = conv.messages ? conv.messages.length : 0;
        
        // Check if conversation has been analyzed
        const hasAnalysis = conv.customer_name || conv.customer_email || conv.lead_quality;
        const analysisStatus = hasAnalysis ? '✅ Analyzed' : '⏳ Not Analyzed';
        const analysisClass = hasAnalysis ? 'analyzed' : 'not-analyzed';
        
        // Lead quality badge
        let leadQualityBadge = '';
        if (conv.lead_quality) {
            leadQualityBadge = `<span class="lead-quality-badge ${conv.lead_quality}">${conv.lead_quality.toUpperCase()}</span>`;
        }
        
        li.innerHTML = `
            <div class="conversation-info">
                <div class="conversation-id">${conv.conversation_id || conv.sessionId}</div>
                <div class="conversation-timestamp">${formattedDate}</div>
                ${leadQualityBadge ? `<div class="lead-quality-display">${leadQualityBadge}</div>` : ''}
            </div>
            <div class="conversation-actions">
                <div class="conversation-count">${messageCount} messages</div>
                <div class="analysis-status ${analysisClass}">${analysisStatus}</div>
                <button class="analyze-btn" onclick="event.stopPropagation(); analyzeConversation('${conv.conversation_id || conv.sessionId}')">
                    🔍 Analyze
                </button>
                <button class="delete-btn" onclick="event.stopPropagation(); deleteConversation('${conv.conversation_id || conv.sessionId}')">
                    🗑️ Delete
                </button>
            </div>
        `;
        
        li.onclick = () => showMessages(conv.conversation_id || conv.sessionId);
        conversationList.appendChild(li);
    });
    
    // Add pagination controls
    if (paginationInfo) {
        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'pagination-container';
        
        const startItem = (currentPage - 1) * paginationInfo.conversationsPerPage + 1;
        const endItem = Math.min(currentPage * paginationInfo.conversationsPerPage, paginationInfo.totalConversations);
        
        paginationContainer.innerHTML = `
            <div class="pagination-info">
                Showing ${startItem}-${endItem} of ${paginationInfo.totalConversations} conversations
            </div>
            <div class="pagination-controls">
                <button class="pagination-btn prev-btn" ${!paginationInfo.hasPrevPage ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
                    ← Previous
                </button>
                <span class="page-info">Page ${currentPage} of ${paginationInfo.totalPages}</span>
                <button class="pagination-btn next-btn" ${!paginationInfo.hasNextPage ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
                    Next →
                </button>
            </div>
        `;
        
        conversationList.appendChild(paginationContainer);
    }
}

// Change page function
async function changePage(page) {
    if (page < 1 || (paginationInfo && page > paginationInfo.totalPages)) {
        return;
    }
    
    console.log(`🔄 Changing to page ${page}`);
    await fetchConversations(page);
}

// Show messages for a specific conversation
async function showMessages(sessionId) {
    try {
        console.log('📖 Loading messages for session:', sessionId);
        
        const response = await fetch(`/api/conversation?sessionId=${sessionId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Loaded messages:', data);
        
        renderMessages(data.conversation, sessionId);
        
    } catch (error) {
        console.error('❌ Error loading messages:', error);
        showError('Failed to load messages for this conversation.');
    }
}

// Render messages
function renderMessages(messages, sessionId) {
    // Hide conversation list and show messages view
    conversationList.style.display = 'none';
    messagesView.style.display = 'block';
    
    // Update title
    messagesTitle.textContent = `Messages - ${sessionId}`;
    
    // Clear previous messages
    messagesContainer.innerHTML = '';
    
    if (!messages || messages.length === 0) {
        messagesContainer.innerHTML = `
            <div class="empty-state">
                <h3>No messages found</h3>
                <p>This conversation appears to be empty.</p>
            </div>
        `;
        return;
    }
    
    // Sort messages by timestamp if available
    const sortedMessages = messages.sort((a, b) => {
        const dateA = new Date(a.timestamp || 0);
        const dateB = new Date(b.timestamp || 0);
        return dateA - dateB;
    });
    
    sortedMessages.forEach((msg, index) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message-block';
        
        // Format timestamp
        const timestamp = msg.timestamp ? new Date(msg.timestamp).toLocaleString() : 'Unknown time';
        
        // Determine role display
        const roleDisplay = msg.role === 'user' ? '👤 USER' : '🤖 AI ASSISTANT';
        const roleClass = msg.role === 'user' ? 'user' : 'assistant';
        
        messageDiv.innerHTML = `
            <div class="message-role ${roleClass}">${roleDisplay}</div>
            <div class="message-content">${escapeHtml(msg.content)}</div>
            <div class="message-time">${timestamp}</div>
        `;
        
        messagesContainer.appendChild(messageDiv);
    });
    
    // Scroll to top of messages
    messagesContainer.scrollTop = 0;
}



// Return to dashboard (conversation list)
function returnToDashboard() {
    messagesView.style.display = 'none';
    analysisView.style.display = 'none';
    conversationList.style.display = 'block';
    messagesContainer.innerHTML = '';
    analysisContainer.innerHTML = '';
}

// Analyze conversation using OpenAI API
async function analyzeConversation(sessionId) {
    try {
        console.log('🔍 Analyzing conversation:', sessionId);
        
        // Show loading state
        showSuccess('Analyzing conversation with AI... This may take a few moments.');
        
        const response = await fetch(`/api/conversation?sessionId=${sessionId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Analysis completed:', data);
        
        if (data.success) {
            showAnalysisResults(data.analysis, sessionId);
        } else {
            showError('Analysis failed. Please try again.');
        }
        
    } catch (error) {
        console.error('❌ Error analyzing conversation:', error);
        showError('Failed to analyze conversation. Please try again.');
    }
}

// Show analysis results
function showAnalysisResults(analysis, sessionId) {
    // Hide conversation list and show analysis view
    conversationList.style.display = 'none';
    messagesView.style.display = 'none';
    analysisView.style.display = 'block';
    
    // Update title
    analysisTitle.textContent = `Customer Analysis - ${sessionId}`;
    
    // Clear previous analysis
    analysisContainer.innerHTML = '';
    
    // Create analysis content
    const analysisContent = document.createElement('div');
    analysisContent.className = 'analysis-content';
    
    const fields = [
        { key: 'customer_name', label: 'Customer Name' },
        { key: 'customer_email', label: 'Email Address' },
        { key: 'customer_phone', label: 'Phone Number' },
        { key: 'customer_industry', label: 'Industry' },
        { key: 'customer_problem', label: 'Problems & Goals' },
        { key: 'customer_availability', label: 'Availability' },
        { key: 'customer_consultation', label: 'Consultation Booked' },
        { key: 'special_notes', label: 'Special Notes' },
        { key: 'lead_quality', label: 'Lead Quality' }
    ];
    
    fields.forEach(field => {
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'analysis-field';
        
        const labelDiv = document.createElement('div');
        labelDiv.className = 'analysis-label';
        labelDiv.textContent = field.label;
        
        const valueDiv = document.createElement('div');
        valueDiv.className = 'analysis-value';
        
        let value = analysis[field.key] || '';
        
        if (field.key === 'customer_consultation') {
            value = value ? 'Yes' : 'No';
        } else if (field.key === 'lead_quality') {
            valueDiv.className = `analysis-value lead-quality ${value}`;
            value = value.toUpperCase();
        }
        
        if (!value || value === '') {
            valueDiv.className += ' empty';
            value = 'Not provided';
        }
        
        valueDiv.textContent = value;
        
        fieldDiv.appendChild(labelDiv);
        fieldDiv.appendChild(valueDiv);
        analysisContent.appendChild(fieldDiv);
    });
    
    analysisContainer.appendChild(analysisContent);
    
    // Show success message
    showSuccess('Analysis completed successfully!');
}

// Delete conversation from database
async function deleteConversation(sessionId) {
    if (!confirm(`Are you sure you want to delete conversation "${sessionId}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        console.log('🗑️ Deleting conversation:', sessionId);
        
        const response = await fetch(`/api/conversation?sessionId=${sessionId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Conversation deleted:', result);
        
        // Show success message
        showSuccess(`Conversation "${sessionId}" has been deleted successfully.`);
        
        // Refresh the conversation list
        await fetchConversations();
        
    } catch (error) {
        console.error('❌ Error deleting conversation:', error);
        showError('Failed to delete conversation. Please try again.');
    }
}

// Show error message
function showError(message) {
    errorContainer.innerHTML = `
        <div class="error-message">
            <strong>Error:</strong> ${message}
        </div>
    `;
    
    // Clear error after 5 seconds
    setTimeout(() => {
        errorContainer.innerHTML = '';
    }, 5000);
}

// Show success message
function showSuccess(message) {
    errorContainer.innerHTML = `
        <div class="success-message">
            <strong>Success:</strong> ${message}
        </div>
    `;
    
    // Clear success message after 5 seconds
    setTimeout(() => {
        errorContainer.innerHTML = '';
    }, 5000);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Filter event listeners
toggleFiltersBtn.addEventListener('click', () => {
    const isVisible = filterContainer.style.display !== 'none';
    filterContainer.style.display = isVisible ? 'none' : 'block';
    toggleFiltersBtn.textContent = isVisible ? '🔍 Filters' : '🔍 Hide Filters';
});

industryFilter.addEventListener('change', () => {
    currentFilters.industry = industryFilter.value;
    updateActiveFilters();
    renderConversationList();
});

consultationFilter.addEventListener('change', () => {
    currentFilters.consultation = consultationFilter.value;
    updateActiveFilters();
    renderConversationList();
});

leadQualityFilter.addEventListener('change', () => {
    currentFilters.leadQuality = leadQualityFilter.value;
    updateActiveFilters();
    renderConversationList();
});

clearFiltersBtn.addEventListener('click', clearAllFilters);

// Event listeners
returnToDashboardBtn.addEventListener('click', returnToDashboard);
returnToDashboardFromAnalysisBtn.addEventListener('click', returnToDashboard);
refreshBtn.addEventListener('click', async () => {
    console.log('🔄 Refreshing conversations...');
    showSuccess('Refreshing conversations...');
    await fetchConversations(1); // Reset to page 1
});

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Dashboard initialized');
    fetchConversations();
}); 