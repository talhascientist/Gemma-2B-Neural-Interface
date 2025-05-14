/**
 * UI Effects and Animations for the Gemma 2B Neural Interface
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI elements
    initializeUI();
    
    // Handle settings panel toggle on mobile
    const toggleSettingsBtn = document.getElementById('toggle-settings');
    const settingsPanel = document.querySelector('.settings-panel');
    
    toggleSettingsBtn.addEventListener('click', function() {
        settingsPanel.classList.toggle('active');
        this.classList.toggle('active');
    });
    
    // Auto-expand textarea as user types
    const userInput = document.getElementById('user-input');
    userInput.addEventListener('input', function() {
        autoResizeTextarea(this);
    });
    
    // Add event listener for theme toggle
    const themeToggleBtn = document.getElementById('toggle-theme');
    themeToggleBtn.addEventListener('click', toggleTheme);
    
    // Add listener for prompt template changes
    const promptTemplateSelect = document.getElementById('prompt-template');
    const customPromptContainer = document.getElementById('custom-prompt-container');
    
    promptTemplateSelect.addEventListener('change', function() {
        customPromptContainer.style.display = 
            this.value === 'custom' ? 'block' : 'none';
        saveSettings();
    });
    
    // Add listeners for slider value display updates
    const sliders = document.querySelectorAll('input[type="range"]');
    sliders.forEach(slider => {
        const valueDisplay = document.getElementById(`${slider.id}-value`);
        slider.addEventListener('input', function() {
            valueDisplay.textContent = this.value;
            saveSettings();
        });
    });
    
    // Save settings when toggles change
    const toggles = document.querySelectorAll('input[type="checkbox"]');
    toggles.forEach(toggle => {
        toggle.addEventListener('change', saveSettings);
    });
    
    // Save custom prompt when changed
    const customPrompt = document.getElementById('custom-prompt');
    customPrompt.addEventListener('input', debounce(saveSettings, 500));
    
    // Load settings from local storage
    loadSettings();
});

// Initialize UI elements and apply starting animations
function initializeUI() {
    // Add initial animations to header
    const header = document.querySelector('header');
    header.classList.add('fade-in');
    
    // Initialize auto-resize for textarea
    const userInput = document.getElementById('user-input');
    autoResizeTextarea(userInput);
    
    // Focus input field
    userInput.focus();
    
    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('click', createRipple);
    });
}

// Create ripple effect on button click
function createRipple(event) {
    const button = event.currentTarget;
    
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
    circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
    circle.classList.add('ripple');
    
    const ripple = button.querySelector('.ripple');
    if (ripple) {
        ripple.remove();
    }
    
    button.appendChild(circle);
}

// Toggle between dark and light themes
function toggleTheme() {
    document.body.classList.toggle('light-mode');
    
    const themeToggleBtn = document.getElementById('toggle-theme');
    if (document.body.classList.contains('light-mode')) {
        themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i> Toggle Theme';
    } else {
        themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i> Toggle Theme';
    }
    
    saveSettings();
}

// Show search indicator
function showSearchIndicator() {
    const searchIndicator = document.getElementById('search-indicator');
    searchIndicator.classList.remove('hidden');
    return searchIndicator;
}

// Hide search indicator
function hideSearchIndicator() {
    const searchIndicator = document.getElementById('search-indicator');
    searchIndicator.classList.add('hidden');
}

// Show typing indicator in chat
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('message', 'ai', 'typing-message');
    
    typingDiv.innerHTML = `
        <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    
    const chatContainer = document.getElementById('chat-container');
    chatContainer.appendChild(typingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    return typingDiv;
}

// Remove typing indicator
function removeTypingIndicator(indicator) {
    if (indicator && indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
    }
}

// Add attention-grabbing effect to an element
function pulseAttention(element) {
    element.classList.add('attention');
    setTimeout(() => {
        element.classList.remove('attention');
    }, 500);
}

// Show a temporary toast message
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.classList.add('toast', `toast-${type}`);
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Add loading bar to an element
function addLoadingBar(element) {
    const loadingBar = document.createElement('div');
    loadingBar.classList.add('loading-bar');
    element.appendChild(loadingBar);
    return loadingBar;
}

// Remove loading bar
function removeLoadingBar(loadingBar) {
    if (loadingBar && loadingBar.parentNode) {
        loadingBar.parentNode.removeChild(loadingBar);
    }
}