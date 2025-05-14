from flask import Flask, request, jsonify, send_from_directory
import requests
from flask_cors import CORS
import os
import json
import time
import re
from urllib.parse import quote

app = Flask(__name__, static_folder='.')
CORS(app)  # Enable CORS for all routes

# Ollama API URL
OLLAMA_URL = "http://localhost:11434/api"

@app.route('/status', methods=['GET'])
def check_status():
    """Check if Ollama is running and if Gemma 2B model is available"""
    try:
        response = requests.get(f"{OLLAMA_URL}/tags")
        
        if response.status_code == 200:
            models = response.json().get('models', [])
            has_gemma = any(("gemma" in model['name'].lower()) for model in models)
            
            return jsonify({
                "status": "running",
                "has_gemma": has_gemma
            })
        else:
            return jsonify({
                "status": "error",
                "message": "Ollama server returned an error"
            })
    except requests.exceptions.RequestException:
        return jsonify({
            "status": "error",
            "message": "Could not connect to Ollama server"
        })

@app.route('/search', methods=['POST'])
def search():
    """Perform an actual web search - this is the key function that needs to work"""
    data = request.json
    query = data.get('query', '')
    deep = data.get('deep', False)
    
    if not query:
        return jsonify({"results": []})
    
    # Perform actual search
    results = perform_real_search(query, deep)
    return jsonify(results)

def perform_real_search(query, deep=False):
    """Perform a real web search using regex patterns instead of BeautifulSoup"""
    try:
        # Use requests with proper headers to avoid being blocked
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Referer": "https://www.google.com/",
            "DNT": "1",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1"
        }
        
        # Properly encode the query
        encoded_query = quote(query)
        search_url = f"https://www.google.com/search?q={encoded_query}"
        
        print(f"Searching with URL: {search_url}")
        response = requests.get(search_url, headers=headers)
        
        if response.status_code != 200:
            print(f"Search request failed with status: {response.status_code}")
            return {"results": []}
        
        # Use regex to extract search results
        html_content = response.text
        results = []
        
        # Extract search result blocks
        # Look for title and URL patterns
        title_pattern = re.compile(r'<h3[^>]*>(.*?)</h3>', re.DOTALL)
        title_matches = title_pattern.findall(html_content)
        
        # Extract URLs
        url_pattern = re.compile(r'<a href="(/url\?q=|http[s]?://)(.*?)"', re.DOTALL)
        url_matches = url_pattern.findall(html_content)
        
        # Extract snippets
        snippet_pattern = re.compile(r'<div class="[^"]*VwiC3b[^"]*"[^>]*>(.*?)</div>', re.DOTALL)
        snippet_matches = snippet_pattern.findall(html_content)
        
        print(f"Found {len(title_matches)} titles, {len(url_matches)} urls, {len(snippet_matches)} snippets")
        
        # Clean up extracted data and combine
        clean_titles = []
        for title in title_matches:
            # Remove HTML tags
            clean_title = re.sub(r'<[^>]*>', '', title)
            clean_titles.append(clean_title.strip())
        
        clean_urls = []
        for prefix, url in url_matches:
            if prefix == '/url?q=':
                # Clean Google redirect URLs
                clean_url = url.split('&sa=')[0]
            else:
                clean_url = prefix + url
                
            # Skip Google-specific URLs
            if 'google.com' not in clean_url and clean_url not in clean_urls:
                clean_urls.append(clean_url)
        
        clean_snippets = []
        for snippet in snippet_matches:
            # Remove HTML tags
            clean_snippet = re.sub(r'<[^>]*>', '', snippet)
            clean_snippets.append(clean_snippet.strip())
        
        # Create result objects (up to 5)
        result_count = min(5, len(clean_titles), len(clean_urls), len(clean_snippets))
        
        for i in range(result_count):
            results.append({
                "title": clean_titles[i],
                "url": clean_urls[i],
                "snippet": clean_snippets[i]
            })
        
        # If we couldn't match titles/urls/snippets properly, try a simpler approach
        if not results:
            print("Using fallback extraction method")
            
            # Simple fallback method
            # Extract anything that looks like a search result
            result_block_pattern = re.compile(r'<div class="[^"]*g[^"]*"[^>]*>(.*?)</div>\s*</div>\s*</div>', re.DOTALL)
            blocks = result_block_pattern.findall(html_content)
            
            for i, block in enumerate(blocks[:5]):
                # Try to extract title
                title_match = re.search(r'<h3[^>]*>(.*?)</h3>', block)
                title = "No title found"
                if title_match:
                    title = re.sub(r'<[^>]*>', '', title_match.group(1)).strip()
                
                # Try to extract URL
                url_match = re.search(r'<a href="(/url\?q=|http[s]?://)(.*?)"', block)
                url = "https://example.com"
                if url_match:
                    prefix, url_part = url_match.groups()
                    if prefix == '/url?q=':
                        url = url_part.split('&sa=')[0]
                    else:
                        url = prefix + url_part
                
                # Try to extract snippet
                snippet_match = re.search(r'<div class="[^"]*VwiC3b[^"]*"[^>]*>(.*?)</div>', block)
                snippet = "No description available"
                if snippet_match:
                    snippet = re.sub(r'<[^>]*>', '', snippet_match.group(1)).strip()
                
                results.append({
                    "title": title,
                    "url": url,
                    "snippet": snippet
                })
        
        # If still no results, create a minimal response to avoid errors
        if not results:
            results.append({
                "title": "Search Results",
                "url": "https://www.google.com/search?q=" + encoded_query,
                "snippet": "No detailed results could be extracted. Please click the URL to view search results directly."
            })
        
        print(f"Returning {len(results)} search results")
        return {"results": results}
    
    except Exception as e:
        print(f"Search error: {str(e)}")
        # If all else fails, return a predefined result that indicates the search was attempted
        return {
            "results": [
                {
                    "title": "Search Result",
                    "url": "https://www.example.com",
                    "snippet": f"Web search was attempted for: {query}. However, an error occurred: {str(e)}"
                }
            ]
        }

@app.route('/generate', methods=['POST'])
def generate():
    """Generate a response from Ollama using Gemma 2B model with search results"""
    try:
        data = request.json
        
        # Extract parameters
        raw_prompt = data.get('prompt', '')
        system_prompt = data.get('system_prompt', '')
        temperature = data.get('temperature', 0.7)
        top_p = data.get('top_p', 0.9)
        max_tokens = data.get('max_tokens', 1000)
        
        # Check if we need to include search results
        search_enabled = data.get('web_search', True)
        deep_search = data.get('deep_search', False)
        
        # Perform search if enabled
        search_results = None
        if search_enabled:
            try:
                search_results = perform_real_search(raw_prompt, deep_search)
                print(f"Search performed, found {len(search_results.get('results', []))} results")
            except Exception as e:
                print(f"Error during search: {e}")
        
        # Prepare prompt with search results
        enhanced_prompt = raw_prompt
        
        if search_results and search_results.get('results'):
            enhanced_prompt += "\n\nI found the following information from a web search:\n\n"
            
            for i, result in enumerate(search_results['results']):
                enhanced_prompt += f"[Source {i+1}]: {result['title']}\n"
                enhanced_prompt += f"URL: {result['url']}\n"
                enhanced_prompt += f"Summary: {result['snippet']}\n\n"
            
            enhanced_prompt += "Based on this information, please provide a comprehensive answer to my question. Include relevant details from these sources and cite them when appropriate."
        
        # Extract conversation history
        conversation_history = data.get('conversation_history', [])
        formatted_history = ""
        
        if conversation_history:
            for msg in conversation_history:
                role = msg.get('role', '')
                content = msg.get('content', '')
                if role and content:
                    formatted_history += f"<{role}>: {content}\n\n"
        
        # Construct final prompt
        final_prompt = f"{system_prompt}\n\n"
        
        if formatted_history:
            final_prompt += f"{formatted_history}\n"
        
        final_prompt += f"<user>: {enhanced_prompt}\n<assistant>:"
        
        print(f"Sending prompt to Ollama (length: {len(final_prompt)})")
        
        # Make request to Ollama
        response = requests.post(
            f"{OLLAMA_URL}/generate",
            json={
                "model": "gemma2:2b",
                "prompt": final_prompt,
                "stream": False,
                "options": {
                    "temperature": temperature,
                    "top_p": top_p,
                    "num_predict": max_tokens
                }
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            return jsonify({
                "response": result.get("response", "No response from model"),
                "search_used": search_results is not None and len(search_results.get('results', [])) > 0
            })
        else:
            print(f"Ollama API error: {response.status_code} - {response.text}")
            return jsonify({
                "error": "Error from Ollama API",
                "details": response.text
            }), 500
    except Exception as e:
        print(f"Error in generate: {str(e)}")
        return jsonify({
            "error": str(e)
        }), 500

@app.route('/', defaults={'path': 'index.html'})
@app.route('/<path:path>')
def serve_static(path):
    """Serve static files"""
    return send_from_directory('.', path)

if __name__ == '__main__':
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("  🧠 Gemma 2B Neural Interface Server")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("  • Starting server...")
    print("  • Make sure Ollama is running with Gemma 2B model")
    print("  • Web search is active (regex-based implementation)")
    print("  • Server running at http://localhost:5000")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    
    app.run(debug=True)