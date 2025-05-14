/**
 * Utility functions for the Gemma 2B Neural Interface
 */

// Format current time to display in messages
function getCurrentTimeFormatted() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12
    
    return `${hours}:${minutes} ${ampm}`;
}

// Escape HTML special characters to prevent XSS
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Auto-resize textarea based on content
function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight) + 'px';
    
    // Set a maximum height
    const maxHeight = 150;
    if (textarea.scrollHeight > maxHeight) {
        textarea.style.height = maxHeight + 'px';
        textarea.style.overflowY = 'auto';
    } else {
        textarea.style.overflowY = 'hidden';
    }
}

// Simple debounce function to avoid excessive calls
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Copy text to clipboard with visual feedback
function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i>';
        button.disabled = true;
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.disabled = false;
        }, 2000);
    }).catch(err => {
        console.error('Could not copy text: ', err);
        button.innerHTML = '<i class="fas fa-times"></i>';
        
        setTimeout(() => {
            button.innerHTML = '<i class="fas fa-copy"></i>';
        }, 2000);
    });
}

// Parse and convert markdown to HTML
function parseMarkdown(text) {
    // This is a simple implementation - for production use a full markdown parser
    
    // Convert code blocks
    text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
        const lang = language || 'text';
        return `<div class="code-block">
                    <div class="code-header">
                        <span class="code-language">${lang}</span>
                        <button class="copy-button" onclick="copyToClipboard('${escapeHTML(code.trim())}', this)">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                    <div class="code-content">${escapeHTML(code.trim())}</div>
                </div>`;
    });
    
    // Convert inline code
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Convert headers
    text = text.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    text = text.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    text = text.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    
    // Convert bold and italic
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    text = text.replace(/\_\_([^_]+)\_\_/g, '<strong>$1</strong>');
    text = text.replace(/\_([^_]+)\_/g, '<em>$1</em>');
    
    // Convert bullet lists
    text = text.replace(/^\s*[\*\-]\s(.*)/gm, '<li>$1</li>');
    text = text.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Convert numbered lists
    text = text.replace(/^\s*(\d+)\.\s(.*)/gm, '<li>$2</li>');
    
    // Convert paragraphs
    text = text.replace(/^(?!<[a-z])/gm, '<p>');
    text = text.replace(/^<p>(.*)/gm, function(match, p1) {
        if (p1.trim() === '') return '';
        if (p1.startsWith('<')) return p1;
        return match + '</p>';
    });
    
    // Handle special math formatting
    text = text.replace(/\$\$(.*?)\$\$/g, '<div class="math-block">$1</div>');
    
    // Highlight important information
    text = text.replace(/\*\*\*([^*]+)\*\*\*/g, '<span class="highlight">$1</span>');
    
    return text;
}

// Format search results in a clean, attractive way
function formatSearchResults(results) {
    if (!results || results.length === 0) {
        return '<div class="search-results"><p>No search results found.</p></div>';
    }
    
    let html = '<div class="search-results">';
    html += '<h3>Search Results</h3>';
    
    results.forEach(result => {
        html += `
            <div class="search-result-item">
                <div class="search-result-title">${escapeHTML(result.title)}</div>
                <div class="search-result-url">${escapeHTML(result.url)}</div>
                <div class="search-result-snippet">${escapeHTML(result.snippet)}</div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

// Save settings to local storage
function saveSettings() {
    const settings = {
        temperature: document.getElementById('temperature').value,
        topP: document.getElementById('top-p').value,
        maxTokens: document.getElementById('max-tokens').value,
        webSearch: document.getElementById('web-search').checked,
        deepSearch: document.getElementById('deep-search').checked,
        promptTemplate: document.getElementById('prompt-template').value,
        customPrompt: document.getElementById('custom-prompt').value,
        theme: document.body.classList.contains('light-mode') ? 'light' : 'dark'
    };
    
    localStorage.setItem('gemma2b-settings', JSON.stringify(settings));
}

// Load settings from local storage
function loadSettings() {
    const savedSettings = localStorage.getItem('gemma2b-settings');
    if (!savedSettings) return;
    
    try {
        const settings = JSON.parse(savedSettings);
        
        document.getElementById('temperature').value = settings.temperature || 0.7;
        document.getElementById('top-p').value = settings.topP || 0.9;
        document.getElementById('max-tokens').value = settings.maxTokens || 1000;
        document.getElementById('web-search').checked = settings.webSearch !== undefined ? settings.webSearch : true;
        document.getElementById('deep-search').checked = settings.deepSearch || false;
        document.getElementById('prompt-template').value = settings.promptTemplate || 'standard';
        document.getElementById('custom-prompt').value = settings.customPrompt || '';
        
        // Update slider display values
        document.getElementById('temperature-value').textContent = settings.temperature || 0.7;
        document.getElementById('top-p-value').textContent = settings.topP || 0.9;
        document.getElementById('max-tokens-value').textContent = settings.maxTokens || 1000;
        
        // Apply theme
        if (settings.theme === 'light') {
            document.body.classList.add('light-mode');
            document.getElementById('toggle-theme').innerHTML = '<i class="fas fa-sun"></i> Toggle Theme';
        }
        
        // Show/hide custom prompt container
        document.getElementById('custom-prompt-container').style.display = 
            settings.promptTemplate === 'custom' ? 'block' : 'none';
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}