/**
 * API client for interacting with the Gemma 2B backend
 */

// Base URL for API endpoints
const API_BASE_URL = 'http://localhost:5000';

// API endpoints
const API_ENDPOINTS = {
    status: `${API_BASE_URL}/status`,
    generate: `${API_BASE_URL}/generate`,
    search: `${API_BASE_URL}/search`
};

// Check server and model status
async function checkServerStatus() {
    try {
        const response = await fetch(API_ENDPOINTS.status);
        if (!response.ok) {
            throw new Error('Server is not responding');
        }
        
        const data = await response.json();
        const statusDisplay = document.getElementById('status-display');
        
        if (data.status === 'running') {
            statusDisplay.innerHTML = '<span class="status-dot"></span><span class="status-text">Neural Network Connected</span>';
            statusDisplay.className = 'status connected';
            
            if (!data.has_gemma) {
                statusDisplay.innerHTML = '<span class="status-dot"></span><span class="status-text">Neural Core Missing</span>';
                statusDisplay.className = 'status disconnected';
                showToast('Warning: Gemma 2B model not found. Run "ollama pull gemma2:2b" first.', 'warning');
            }
        } else {
            statusDisplay.innerHTML = '<span class="status-dot"></span><span class="status-text">Neural Network Offline</span>';
            statusDisplay.className = 'status disconnected';
        }
        
        return data;
    } catch (error) {
        console.error('Error checking server status:', error);
        
        const statusDisplay = document.getElementById('status-display');
        statusDisplay.innerHTML = '<span class="status-dot"></span><span class="status-text">Neural Network Disconnected</span>';
        statusDisplay.className = 'status disconnected';
        
        return { status: 'error', message: error.message };
    }
}

// Perform web search if enabled
async function performWebSearch(query, isDeepSearch = false) {
    try {
        const searchParams = {
            query,
            deep: isDeepSearch
        };
        
        const response = await fetch(API_ENDPOINTS.search, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(searchParams)
        });
        
        if (!response.ok) {
            throw new Error('Failed to get search results');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Search error:', error);
        return { results: [] };
    }
}

// Prepare the enhanced prompt with search results
function preparePrompt(userMessage, searchResults, template, conversation) {
    // Base prompt structure without search results
    let enhancedPrompt = userMessage;
    
    // Add search results if available
    if (searchResults && searchResults.results && searchResults.results.length > 0) {
        enhancedPrompt += "\n\nRelevant information from web search:";
        
        // Add each search result with its source
        searchResults.results.forEach((result, index) => {
            enhancedPrompt += `\n\nSource ${index + 1}: ${result.title} (${result.url})\n${result.snippet}`;
        });
        
        enhancedPrompt += "\n\nPlease answer the question based on this information and cite sources when appropriate.";
    }
    
    return enhancedPrompt;
}

// Get conversation history formatted for the model
function getConversationHistory() {
    const messages = document.querySelectorAll('.message');
    const history = [];
    
    messages.forEach(msg => {
        // Skip the typing indicator if present
        if (msg.classList.contains('typing-message')) return;
        
        const role = msg.classList.contains('user') ? 'user' : 'assistant';
        const content = msg.querySelector('.message-content').textContent;
        
        history.push({ role, content });
    });
    
    return history;
}

// Get system prompt based on selected template
function getSystemPrompt() {
    const selectedTemplate = document.getElementById('prompt-template').value;
    
    const promptTemplates = {
        standard: "You are Gemma 2B, a helpful AI assistant. You provide accurate, factual, and helpful information while being conversational and friendly.",
        expert: "You are Gemma 2B, an AI expert with deep knowledge across various fields. Provide detailed, nuanced, technical responses with expert-level analysis. Use formal language, cite specific concepts, and explain complex topics thoroughly.",
        creative: "You are Gemma 2B, a creative AI writer. Craft engaging, imaginative responses with rich descriptive language. Feel free to use metaphors, storytelling techniques, and expressive language that captivates the reader's imagination.",
        researcher: "You are Gemma 2B, a meticulous research assistant. Your responses should be thorough, balanced, and evidence-based. Analyze multiple perspectives, cite sources when possible, evaluate credibility of information, and maintain academic rigor.",
        educational: "You are Gemma 2B, an educational assistant. Present information in a structured, step-by-step format that's easy to understand. For math and science questions, show detailed working steps. For complex topics, use clear examples and visual descriptions. For code, provide well-commented solutions with explanations."
    };
    
    if (selectedTemplate === 'custom') {
        const customPrompt = document.getElementById('custom-prompt').value.trim();
        return customPrompt || promptTemplates.standard;
    }
    
    return promptTemplates[selectedTemplate] || promptTemplates.standard;
}

// Generate response from the model
async function generateResponse(userMessage, searchResults = null) {
    try {
        // Get settings from UI
        const temperature = parseFloat(document.getElementById('temperature').value);
        const topP = parseFloat(document.getElementById('top-p').value);
        const maxTokens = parseInt(document.getElementById('max-tokens').value);
        const isDeepSearch = document.getElementById('deep-search').checked;
        
        // Get conversation history
        const conversationHistory = getConversationHistory();
        
        // Get system prompt based on selected template
        const systemPrompt = getSystemPrompt();
        
        // Prepare enhanced prompt with search results if available
        const enhancedPrompt = preparePrompt(userMessage, searchResults, systemPrompt, conversationHistory);
        
        // Make API request
        const response = await fetch(API_ENDPOINTS.generate, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: enhancedPrompt,
                system_prompt: systemPrompt,
                conversation_history: conversationHistory,
                temperature,
                top_p: topP,
                max_tokens: maxTokens,
                include_search_results: !!searchResults,
                deep_search: isDeepSearch
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to get response from server');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error generating response:', error);
        throw error;
    }
}