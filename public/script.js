// Generate a unique session ID for this conversation
let sessionId = localStorage.getItem('chatbot_session_id');
if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('chatbot_session_id', sessionId);
}
console.log('📝 Using session ID:', sessionId);

// DOM elements
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const clearButton = document.getElementById('clearButton');

// Add event listeners
sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
clearButton.addEventListener('click', clearConversation);

// Function to add a message to the chat
function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = content;
    
    const messageTime = document.createElement('div');
    messageTime.className = 'message-time';
    messageTime.textContent = new Date().toLocaleTimeString();
    
    messageDiv.appendChild(messageContent);
    messageDiv.appendChild(messageTime);
    
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Function to send message to backend
async function sendMessage() {
    const message = userInput.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addMessage(message, true);
    
    // Clear input
    userInput.value = '';
    
    // Disable input while processing
    userInput.disabled = true;
    sendButton.disabled = true;
    
    try {
        // Show typing indicator
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing';
        typingDiv.innerHTML = '<div class="message-content">🤖 AI is typing...</div>';
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Get the current URL to determine the API base URL
        const currentUrl = window.location.origin;
        const apiUrl = `${currentUrl}/api/chat`;
        
        console.log('🌐 Sending request to:', apiUrl);
        
        // Send message to backend
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                sessionId: sessionId
            })
        });
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Server error:', errorText);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('✅ Response data:', data);
        
        // Remove typing indicator
        chatMessages.removeChild(typingDiv);
        
        // Add AI response to chat
        if (data.response) {
            addMessage(data.response);
        } else {
            throw new Error('No response from AI');
        }
        
    } catch (error) {
        console.error('❌ Error in sendMessage:', error);
        
        // Remove typing indicator
        const typingDiv = document.querySelector('.typing');
        if (typingDiv) {
            chatMessages.removeChild(typingDiv);
        }
        
        // Show specific error message
        let errorMessage = 'Sorry, I encountered an error. Please try again.';
        
        if (error.message.includes('401')) {
            errorMessage = 'OpenAI API key is invalid. Please check your configuration.';
        } else if (error.message.includes('429')) {
            errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('fetch')) {
            errorMessage = 'Network error. Please check your internet connection.';
        }
        
        addMessage(errorMessage);
    } finally {
        // Re-enable input
        userInput.disabled = false;
        sendButton.disabled = false;
        userInput.focus();
    }
}

// Function to clear conversation
async function clearConversation() {
    if (confirm('Are you sure you want to start a new conversation? The current conversation will be saved.')) {
        try {
            console.log('🔄 Starting new conversation...');
            
            // Clear the chat display
            chatMessages.innerHTML = '';
            
            // Add welcome message
            addMessage('Hello! I\'m your MindTek AI assistant. How can I help you today?', false);
            
            // Generate new session ID for new conversation
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('chatbot_session_id', sessionId);
            console.log('📝 New session ID:', sessionId);
            
            // Clear local memory for new conversation
            // Note: Previous conversation remains in database
            console.log('✅ New conversation started - previous conversation saved in database');
            
        } catch (error) {
            console.error('❌ Error starting new conversation:', error);
        }
    }
}

// Add some CSS for typing indicator
const style = document.createElement('style');
style.textContent = `
    .typing .message-content {
        font-style: italic;
        color: #666;
    }
`;
document.head.appendChild(style);

// Test connection on page load
async function testConnection() {
    try {
        const currentUrl = window.location.origin;
        const healthUrl = `${currentUrl}/api/health`;
        
        console.log('🔍 Testing connection to:', healthUrl);
        
        const response = await fetch(healthUrl);
        const data = await response.json();
        
        console.log('✅ Connection test successful:', data);
        
        if (!data.openaiKeySet) {
            console.warn('⚠️ OpenAI API key not set on server');
            addMessage('⚠️ Warning: OpenAI API key not configured on server', false);
        }
        
    } catch (error) {
        console.error('❌ Connection test failed:', error);
        addMessage('⚠️ Warning: Cannot connect to server', false);
    }
}

// Run connection test when page loads
document.addEventListener('DOMContentLoaded', async () => {
    await testConnection();
    await loadPreviousConversation();
});

// Function to load previous conversation
async function loadPreviousConversation() {
    try {
        const currentUrl = window.location.origin;
        const conversationUrl = `${currentUrl}/api/conversation?sessionId=${sessionId}`;
        
        console.log('📖 Loading previous conversation from:', conversationUrl);
        
        const response = await fetch(conversationUrl);
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.conversation && data.conversation.length > 0) {
                console.log('✅ Loaded previous conversation:', data.conversation.length, 'messages');
                
                // Clear existing messages
                chatMessages.innerHTML = '';
                
                // Add all previous messages
                data.conversation.forEach(msg => {
                    addMessage(msg.content, msg.role === 'user');
                });
                
                addMessage('🔄 Conversation loaded from previous session', false);
            } else {
                console.log('📝 No previous conversation found');
            }
        } else {
            console.log('📝 No previous conversation available');
        }
        
    } catch (error) {
        console.error('❌ Error loading previous conversation:', error);
    }
} 