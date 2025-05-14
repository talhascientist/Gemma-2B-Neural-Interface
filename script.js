// DOM Elements
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const clearChatButton = document.getElementById('clear-chat');
const toggleThemeButton = document.getElementById('toggle-theme');
const statusElement = document.getElementById('status');
const searchIndicator = document.getElementById('search-indicator');

// Settings elements
const temperatureInput = document.getElementById('temperature');
const temperatureValue = document.getElementById('temperature-value');
const topPInput = document.getElementById('top-p');
const topPValue = document.getElementById('top-p-value');
const maxTokensInput = document.getElementById('max-tokens');
const maxTokensValue = document.getElementById('max-tokens-value');
const webSearchCheckbox = document.getElementById('web-search');
const deepSearchCheckbox = document.getElementById('deep-search');
const promptTemplateSelect = document.getElementById('prompt-template');

// API URLs
const API_URL = 'http://localhost:5000';
const STATUS_URL = `${API_URL}/status`;
const GENERATE_URL = `${API_URL}/generate`;
const SEARCH_URL = `${API_URL}/search`;

// State variables
let isProcessing = false;

// Prompt templates
const SYSTEM_PROMPTS = {
    standard: "You are Gemma 2B, a helpful AI assistant. You provide accurate, factual, and helpful information while being conversational and friendly.",
    expert: "You are Gemma 2B, an AI expert with deep knowledge across various fields. Provide detailed, nuanced, technical responses with expert-level analysis. Use formal language, cite specific concepts, and explain complex topics thoroughly.",
    creative: "You are Gemma 2B, a creative AI writer. Craft engaging, imaginative responses with rich descriptive language. Use metaphors, storytelling techniques, and expressive language that captivates the reader's imagination.",
    researcher: "You are Gemma 2B, a meticulous research assistant. Your responses should be thorough, balanced, and evidence-based. Analyze multiple perspectives, cite sources when possible, evaluate credibility of information, and maintain academic rigor.",
    educational: "You are Gemma 2B, an educational assistant. Present information in a structured, step-by-step format that's easy to understand. For math and science questions, show detailed working steps. For complex topics, use clear examples and visual descriptions. For code, provide well-commented solutions with explanations."
};

// Initialize the interface
document.addEventListener('DOMContentLoaded', () => {
    // Check server status
    checkServerStatus();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load settings from local storage
    loadSettings();
    
    // Set up auto-resize for textarea
    setupAutoResize();
    
    // Set up 30 second status check interval
    setInterval(checkServerStatus, 30000);
});

// Set up event listeners
function setupEventListeners() {
    // Send message when button is clicked
    sendButton.addEventListener('click', handleSendMessage);
    
    // Send message when Enter key is pressed (without Shift)
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
    
    // Clear chat history
    clearChatButton.addEventListener('click', () => {
        // Keep only the first message
        while (chatContainer.children.length > 1) {
            chatContainer.removeChild(chatContainer.lastChild);
        }
        showToast('Chat cleared');
    });
    
    // Toggle light/dark theme
    toggleThemeButton.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const isDark = !document.body.classList.contains('light-theme');
        toggleThemeButton.innerHTML = isDark ? 
            '<i class="fas fa-moon"></i> Toggle Theme' : 
            '<i class="fas fa-sun"></i> Toggle Theme';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
    
    // Update slider value displays
    temperatureInput.addEventListener('input', () => {
        temperatureValue.textContent = temperatureInput.value;
        saveSettings();
    });
    
    topPInput.addEventListener('input', () => {
        topPValue.textContent = topPInput.value;
        saveSettings();
    });
    
    maxTokensInput.addEventListener('input', () => {
        maxTokensValue.textContent = maxTokensInput.value;
        saveSettings();
    });
    
    // Save settings when changed
    webSearchCheckbox.addEventListener('change', saveSettings);
    deepSearchCheckbox.addEventListener('change', saveSettings);
    promptTemplateSelect.addEventListener('change', saveSettings);
}

// Set up auto-resize for textarea
function setupAutoResize() {
    userInput.addEventListener('input', () => {
        userInput.style.height = 'auto';
        userInput.style.height = (userInput.scrollHeight) + 'px';
        
        // Cap the height
        if (userInput.scrollHeight > 150) {
            userInput.style.height = '150px';
            userInput.style.overflowY = 'auto';
        } else {
            userInput.style.overflowY = 'hidden';
        }
    });
}

// Check server status
async function checkServerStatus() {
    try {
        const response = await fetch(STATUS_URL);
        if (!response.ok) throw new Error('Server not responding');
        
        const data = await response.json();
        
        if (data.status === 'running') {
            statusElement.textContent = 'Neural Network Connected';
            statusElement.className = 'status connected';
            
            if (!data.has_gemma) {
                statusElement.textContent = 'Neural Model Missing';
                statusElement.className = 'status disconnected';
                showToast('Gemma 2B model not found. Run "ollama pull gemma2:2b" first.', 'error');
            }
        } else {
            statusElement.textContent = 'Neural Network Offline';
            statusElement.className = 'status disconnected';
        }
        
        return data;
    } catch (error) {
        console.error('Error checking server status:', error);
        statusElement.textContent = 'Neural Network Disconnected';
        statusElement.className = 'status disconnected';
        return { status: 'error' };
    }
}

async function handleSendMessage() {
    const message = userInput.value.trim();
    if (message === '' || isProcessing) return;
    
    isProcessing = true;
    
    // Clear input and reset height
    userInput.value = '';
    userInput.style.height = 'auto';
    
    // Add user message to chat
    addMessage(message, true);
    
    // Show typing indicator
    const typingIndicator = addTypingIndicator();
    
    try {
        // Get current settings
        const webSearchEnabled = webSearchCheckbox.checked;
        const deepSearchEnabled = deepSearchCheckbox.checked;
        
        // Show search indicator if search is enabled
        if (webSearchEnabled) {
            searchIndicator.classList.remove('hidden');
            searchIndicator.querySelector('span').textContent = 
                deepSearchEnabled ? 'Performing deep neural search...' : 'Searching neural pathways...';
        }
        
        // Generate response with the correct parameters
        const response = await generateResponse(message, webSearchEnabled, deepSearchEnabled);
        
        // Hide search indicator
        searchIndicator.classList.add('hidden');
        
        // Remove typing indicator
        typingIndicator.remove();
        
        // Add AI response to chat
        addMessage(response.response, false, response.search_used);
        
    } catch (error) {
        console.error('Error in message handling:', error);
        
        // Hide search indicator
        searchIndicator.classList.add('hidden');
        
        // Remove typing indicator
        typingIndicator.remove();
        
        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message ai';
        errorDiv.innerHTML = `
            <div class="message-content">
                <p>Neural connection error: ${error.message}</p>
                <p>Please check if the server is running and try again.</p>
            </div>
            <div class="message-time">${getCurrentTime()}</div>
        `;
        chatContainer.appendChild(errorDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        
        showToast('Error connecting to neural network', 'error');
    } finally {
        isProcessing = false;
        userInput.focus();
    }
}


// Perform web search
async function performWebSearch(query, isDeep = false) {
    try {
        const response = await fetch(SEARCH_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query,
                deep: isDeep
            })
        });
        
        if (!response.ok) throw new Error('Search failed');
        
        return await response.json();
    } catch (error) {
        console.error('Search error:', error);
        return { results: [] };
    }
}
// Modify these key functions in script.js to ensure web search is being performed

// Handle sending a message
async function handleSendMessage() {
    const message = userInput.value.trim();
    if (message === '' || isProcessing) return;
    
    isProcessing = true;
    
    // Clear input and reset height
    userInput.value = '';
    userInput.style.height = 'auto';
    
    // Add user message to chat
    addMessage(message, true);
    
    // Show typing indicator
    const typingIndicator = addTypingIndicator();
    
    try {
        // Get current settings
        const webSearchEnabled = webSearchCheckbox.checked;
        const deepSearchEnabled = deepSearchCheckbox.checked;
        
        // Show search indicator if search is enabled
        if (webSearchEnabled) {
            searchIndicator.classList.remove('hidden');
            searchIndicator.querySelector('span').textContent = 
                deepSearchEnabled ? 'Performing deep neural search...' : 'Searching neural pathways...';
        }
        
        // Generate response with the correct parameters
        const response = await generateResponse(message, webSearchEnabled, deepSearchEnabled);
        
        // Hide search indicator
        searchIndicator.classList.add('hidden');
        
        // Remove typing indicator
        typingIndicator.remove();
        
        // Add AI response to chat
        addMessage(response.response, false, response.search_used);
        
    } catch (error) {
        console.error('Error in message handling:', error);
        
        // Hide search indicator
        searchIndicator.classList.add('hidden');
        
        // Remove typing indicator
        typingIndicator.remove();
        
        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message ai';
        errorDiv.innerHTML = `
            <div class="message-content">
                <p>Neural connection error: ${error.message}</p>
                <p>Please check if the server is running and try again.</p>
            </div>
            <div class="message-time">${getCurrentTime()}</div>
        `;
        chatContainer.appendChild(errorDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        
        showToast('Error connecting to neural network', 'error');
    } finally {
        isProcessing = false;
        userInput.focus();
    }
}

// Generate AI response with search if enabled
async function generateResponse(message, useSearch = true, deepSearch = false) {
    // Get current settings
    const temperature = parseFloat(temperatureInput.value);
    const topP = parseFloat(topPInput.value);
    const maxTokens = parseInt(maxTokensInput.value);
    const templateKey = promptTemplateSelect.value;
    
    // Get conversation history
    const history = getConversationHistory();
    
    try {
        console.log(`Generating response with search: ${useSearch}, deep: ${deepSearch}`);
        
        const response = await fetch(`${API_URL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: message,
                system_prompt: SYSTEM_PROMPTS[templateKey] || SYSTEM_PROMPTS.standard,
                conversation_history: history,
                temperature,
                top_p: topP,
                max_tokens: maxTokens,
                web_search: useSearch,
                deep_search: deepSearch
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error('Failed to generate response');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error generating response:', error);
        throw error;
    }
}

// Get conversation history
function getConversationHistory() {
    const messages = Array.from(chatContainer.children).filter(
        msg => !msg.classList.contains('typing-indicator')
    );
    
    return messages.map(message => {
        const isUser = message.classList.contains('user');
        const content = message.querySelector('.message-content').textContent;
        return {
            role: isUser ? 'user' : 'assistant',
            content
        };
    });
}

// Add message to chat
function addMessage(content, isUser, searchResults = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'ai'}`;
    
    let messageContent = content;
    
    // Format AI messages with markdown
    if (!isUser) {
        // Use the marked library to render markdown
        messageContent = marked.parse(content);
        
        // Add search results if available
        if (searchResults && searchResults.results && searchResults.results.length > 0) {
            let searchResultsHTML = `
                <div class="search-results">
                    <div class="search-results-title">
                        <i class="fas fa-search"></i> Web Search Results
                    </div>
            `;
            
            searchResults.results.forEach((result, index) => {
                searchResultsHTML += `
                    <div class="search-result-item">
                        <div class="search-result-title">${index + 1}. ${result.title}</div>
                        <div class="search-result-url">${result.url}</div>
                        <div class="search-result-snippet">${result.snippet}</div>
                    </div>
                `;
            });
            
            searchResultsHTML += '</div>';
            messageContent += searchResultsHTML;
        }
    }
    
    messageDiv.innerHTML = `
        <div class="message-content">${messageContent}</div>
        <div class="message-time">${getCurrentTime()}</div>
    `;
    
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    // Highlight code blocks in AI responses
    if (!isUser) {
        setTimeout(() => {
            Prism.highlightAllUnder(messageDiv);
            
            // Add copy button to code blocks
            const codeBlocks = messageDiv.querySelectorAll('pre code');
            codeBlocks.forEach(block => {
                const pre = block.parentNode;
                const language = block.className.match(/language-(\w+)/)?.[1] || 'code';
                
                // Create header
                const header = document.createElement('div');
                header.className = 'code-block-header';
                header.innerHTML = `
                    <span>${language}</span>
                    <button class="copy-btn" title="Copy to clipboard">
                        <i class="fas fa-copy"></i>
                    </button>
                `;
                
                // Insert header before pre
                pre.parentNode.insertBefore(header, pre);
                
                // Add click handler to copy button
                header.querySelector('.copy-btn').addEventListener('click', () => {
                    navigator.clipboard.writeText(block.textContent)
                        .then(() => {
                            const icon = header.querySelector('.copy-btn i');
                            icon.className = 'fas fa-check';
                            setTimeout(() => {
                                icon.className = 'fas fa-copy';
                            }, 2000);
                        })
                        .catch(err => console.error('Could not copy text: ', err));
                });
                
                // Style the pre element
                pre.style.borderRadius = '0 0 5px 5px';
                pre.style.marginTop = '0';
                
                // Wrap in a div for styling
                const wrapper = document.createElement('div');
                wrapper.className = 'code-block';
                pre.parentNode.insertBefore(wrapper, header);
                wrapper.appendChild(header);
                wrapper.appendChild(pre);
            });
            
            // Format step-by-step solutions
            const stepMatches = messageContent.match(/\*\*Step \d+:?\*\*|\bStep \d+:/g);
            if (stepMatches) {
                const contentDiv = messageDiv.querySelector('.message-content');
                let html = contentDiv.innerHTML;
                
                stepMatches.forEach(step => {
                    const number = step.match(/\d+/)[0];
                    html = html.replace(
                        step,
                        `<div class="step"><span class="step-number">${number}</span><strong>Step ${number}:</strong>`
                    );
                    
                    // Close the first div after the next step or at the end
                    const nextStep = `<div class="step"><span class="step-number">${parseInt(number) + 1}</span>`;
                    if (html.includes(nextStep)) {
                        html = html.replace(
                            new RegExp(`(.*?)${nextStep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
                            '$1</div>' + nextStep
                        );
                    }
                });
                
                // Close the last step
                if (!html.endsWith('</div>')) {
                    html += '</div>';
                }
                
                contentDiv.innerHTML = html;
            }
        }, 10);
    }
    
    return messageDiv;
}

// Add typing indicator
function addTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai typing-indicator';
    
    typingDiv.innerHTML = `
        <div class="message-content">
            <div class="typing">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    
    chatContainer.appendChild(typingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    return typingDiv;
}

// Get current time for message timestamp
function getCurrentTime() {
    const now = new Date();
    const hours = now.getHours() % 12 || 12;
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    return `${hours}:${minutes} ${ampm}`;
}

// Show toast notification
function showToast(message, type = 'info') {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());
    
    // Create new toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('visible'), 10);
    
    // Remove after delay
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Save settings to local storage
function saveSettings() {
    const settings = {
        temperature: temperatureInput.value,
        topP: topPInput.value,
        maxTokens: maxTokensInput.value,
        webSearch: webSearchCheckbox.checked,
        deepSearch: deepSearchCheckbox.checked,
        promptTemplate: promptTemplateSelect.value,
        theme: document.body.classList.contains('light-theme') ? 'light' : 'dark'
    };
    
    localStorage.setItem('gemma-settings', JSON.stringify(settings));
}

// Load settings from local storage
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('gemma-settings') || '{}');
    
    if (settings.temperature) temperatureInput.value = settings.temperature;
    if (settings.topP) topPInput.value = settings.topP;
    if (settings.maxTokens) maxTokensInput.value = settings.maxTokens;
    if (settings.webSearch !== undefined) webSearchCheckbox.checked = settings.webSearch;
    if (settings.deepSearch !== undefined) deepSearchCheckbox.checked = settings.deepSearch;
    if (settings.promptTemplate) promptTemplateSelect.value = settings.promptTemplate;
    
    // Update displayed values
    temperatureValue.textContent = temperatureInput.value;
    topPValue.textContent = topPInput.value;
    maxTokensValue.textContent = maxTokensInput.value;
    
    // Apply theme
    if (settings.theme === 'light') {
        document.body.classList.add('light-theme');
        toggleThemeButton.innerHTML = '<i class="fas fa-sun"></i> Toggle Theme';
    }
}

// Add some CSS for toast notifications
const style = document.createElement('style');
style.textContent = `
.toast {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 10px 20px;
    border-radius: 5px;
    background-color: rgba(20, 20, 50, 0.9);
    color: white;
    font-size: 14px;
    z-index: 1000;
    transform: translateX(120%);
    transition: transform 0.3s ease;
    border-left: 3px solid var(--accent-primary);
    box-shadow: var(--shadow-neon);
}

.toast.visible {
    transform: translateX(0);
}

.toast.error {
    border-left-color: var(--status-offline);
}

.toast.success {
    border-left-color: var(--status-online);
}
`;
document.head.appendChild(style);