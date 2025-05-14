/**
 * Message formatting and styling functionality
 */

// Format and style AI responses with highlighting, code blocks, etc.
function formatAIResponse(text) {
    // First, escape any HTML in the text
    let safeText = escapeHTML(text);
    
    // Format mathematical expressions
    safeText = formatMathExpressions(safeText);
    
    // Format code blocks
    safeText = formatCodeBlocks(safeText);
    
    // Format lists
    safeText = formatLists(safeText);
    
    // Format tables
    safeText = formatTables(safeText);
    
    // Format step-by-step solutions
    safeText = formatStepByStep(safeText);
    
    // Highlight key terms
    safeText = highlightKeyTerms(safeText);
    
    // Apply general markdown formatting
    safeText = parseMarkdown(safeText);
    
    return safeText;
}

// Format special mathematical expressions
function formatMathExpressions(text) {
    // Identify math expressions between $$...$$ delimiters
    text = text.replace(/\$\$(.*?)\$\$/g, function(match, formula) {
        return `<div class="math-block">${formula}</div>`;
    });
    
    // Identify inline math expressions between $...$ delimiters
    text = text.replace(/\$(.*?)\$/g, function(match, formula) {
        if (match.startsWith('$$')) return match; // Skip already processed block math
        return `<span class="math-inline">${formula}</span>`;
    });
    
    // Add special formatting for specific math symbols
    text = text.replace(/([^a-zA-Z0-9])([\+\-\*\/\=\(\)\[\]\{\}])([^a-zA-Z0-9])/g, function(match, before, symbol, after) {
        return `${before}<span class="math-symbol">${symbol}</span>${after}`;
    });
    
    return text;
}

// Format code blocks with syntax highlighting
function formatCodeBlocks(text) {
    // Identify code blocks between ```...``` delimiters
    text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, function(match, language, code) {
        const lang = language || 'code';
        
        return `<div class="code-block">
                    <div class="code-header">
                        <span class="code-language">${lang}</span>
                        <button class="copy-button" onclick="copyToClipboard(\`${code.replace(/`/g, '\\`')}\`, this)">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                    <div class="code-content">${code}</div>
                </div>`;
    });
    
    // Identify inline code between `...` delimiters
    text = text.replace(/`([^`]+)`/g, function(match, code) {
        return `<code class="inline-code">${code}</code>`;
    });
    
    return text;
}

// Format lists with special styling
function formatLists(text) {
    // Format numbered lists
    let inNumberedList = false;
    let numberedListContent = '';
    
    // Process text line by line for numbered lists
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const numberMatch = line.match(/^\s*(\d+)[\.\)]\s+(.*)$/);
        
        if (numberMatch) {
            if (!inNumberedList) {
                // Start a new numbered list
                inNumberedList = true;
                numberedListContent = `<ol start="${numberMatch[1]}">`;
            }
            numberedListContent += `<li>${numberMatch[2]}</li>`;
        } else if (inNumberedList) {
            // End the current numbered list
            inNumberedList = false;
            numberedListContent += '</ol>';
            text = text.replace(numberedListContent.substring(0, numberedListContent.indexOf('</ol>') + 5), numberedListContent);
        }
    }
    
    // Format bullet lists
    let inBulletList = false;
    let bulletListContent = '';
    
    // Process text line by line for bullet lists
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const bulletMatch = line.match(/^\s*[\*\-\•]\s+(.*)$/);
        
        if (bulletMatch) {
            if (!inBulletList) {
                // Start a new bullet list
                inBulletList = true;
                bulletListContent = '<ul>';
            }
            bulletListContent += `<li>${bulletMatch[1]}</li>`;
        } else if (inBulletList) {
            // End the current bullet list
            inBulletList = false;
            bulletListContent += '</ul>';
            text = text.replace(bulletListContent.substring(0, bulletListContent.indexOf('</ul>') + 5), bulletListContent);
        }
    }
    
    return text;
}

// Format tables with neon styling
function formatTables(text) {
    // Detect markdown tables
    const tableRegex = /(\|[^\n]+\|\r?\n)((?:\|:?[-]+:?)+\|)(\n(?:\|[^\n]+\|\r?\n?)*)/g;
    
    return text.replace(tableRegex, function(match, headerRow, separatorRow, bodyRows) {
        // Split header into cells
        const headers = headerRow.split('|').filter(cell => cell.trim() !== '');
        
        // Build HTML table
        let table = '<div class="table-container"><table class="data-table">';
        
        // Add header row
        table += '<thead><tr>';
        headers.forEach(header => {
            table += `<th>${header.trim()}</th>`;
        });
        table += '</tr></thead>';
        
        // Add body rows
        table += '<tbody>';
        const rows = bodyRows.trim().split('\n');
        rows.forEach(row => {
            table += '<tr>';
            const cells = row.split('|').filter(cell => cell.trim() !== '');
            cells.forEach(cell => {
                table += `<td>${cell.trim()}</td>`;
            });
            table += '</tr>';
        });
        
        table += '</tbody></table></div>';
        return table;
    });
}

// Format step-by-step solutions with special styling
function formatStepByStep(text) {
    // Detect step patterns like "Step 1:", "Step 2:", etc.
    const stepRegex = /(\*\*Step \d+:?\*\*|\bStep \d+:)/g;
    
    // Add special highlighting to steps
    text = text.replace(stepRegex, function(match) {
        return `<div class="step-marker">${match}</div>`;
    });
    
    return text;
}

// Highlight key terms in the response
function highlightKeyTerms(text) {
    // Highlight text in bold with special neon glow
    text = text.replace(/\*\*([^*]+)\*\*/g, function(match, content) {
        return `<strong class="key-term">${content}</strong>`;
    });
    
    // Highlight definitions
    const definitionPatterns = [
        /\b([A-Z][a-z]+(?: [a-z]+)*): ([^\.]+\.)/g,  // Term: Definition.
        /\b([A-Z][a-z]+(?: [a-z]+)*) - ([^\.]+\.)/g, // Term - Definition.
        /\b([A-Z][a-z]+(?: [a-z]+)*) refers to ([^\.]+\.)/g // Term refers to Definition.
    ];
    
    definitionPatterns.forEach(pattern => {
        text = text.replace(pattern, function(match, term, definition) {
            return `<span class="definition"><span class="term">${term}</span>: ${definition}</span>`;
        });
    });
    
    return text;
}

// Process search results and format them attractively
function processSearchResults(results) {
    if (!results || !results.results || results.results.length === 0) {
        return '<div class="search-results empty"><p>No relevant search results found.</p></div>';
    }
    
    let html = '<div class="search-results">';
    html += '<h3>Web References</h3>';
    
    results.results.forEach((result, index) => {
        html += `
            <div class="search-result-item">
                <div class="search-result-title">${index + 1}. ${escapeHTML(result.title)}</div>
                <div class="search-result-url">${escapeHTML(result.url)}</div>
                <div class="search-result-snippet">${escapeHTML(result.snippet)}</div>
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

// Create a properly formatted message element
function createMessageElement(text, isUser, searchResults = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'ai'}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    if (isUser) {
        // Simple text for user messages
        contentDiv.textContent = text;
    } else {
        // Format AI responses with rich formatting
        let formattedText = formatAIResponse(text);
        
        // Add search results if provided
        if (searchResults) {
            formattedText += processSearchResults(searchResults);
        }
        
        contentDiv.innerHTML = formattedText;
    }
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = getCurrentTimeFormatted();
    
    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeDiv);
    
    return messageDiv;
}