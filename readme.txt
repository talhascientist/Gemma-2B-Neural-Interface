# Gemma 2B Neural Interface

A sleek, modern web interface for interacting with the Gemma 2B language model with web search capabilities.

!Gemma 2B Neural Interface
https://freeimage.host/i/3U7TK11

## Features

- 🧠 Direct integration with Ollama's Gemma 2B model
- 🔍 Real-time web search capabilities
- ⚙️ Adjustable model parameters (temperature, diversity, response length)
- 💬 Full conversation history
- 🎨 Neon-styled modern UI with dark/light mode
- 📝 Multiple response styles (Standard, Expert, Creative, Researcher, Educational)
- 📊 Code and math formatting with syntax highlighting

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Python 3.8+**
2. **Ollama** - Follow the installation instructions at [ollama.ai](https://ollama.ai)
3. **Gemma 2B model** - After installing Ollama, run: `ollama pull gemma2:2b`

## Installation

Follow these steps to set up the Gemma 2B Neural Interface on your machine:

### 1. Clone the repository

```bash
git clone https://github.com/talhascientist/Gemma-2B-Neural-Interface.git
cd gemma2b-neural-interface
```

### 2. Install required Python packages

```bash
pip install flask flask-cors requests
```

### 3. Create project files

Create the following files in your project directory:

- `index.html` - The main HTML file
- `styles.css` - The CSS styling
- `script.js` - The JavaScript code
- `server.py` - The Python server that connects to Ollama

You can copy the code for each file from the repository or create them manually based on the provided code snippets.

## Running the Application

### 1. Start Ollama

Make sure Ollama is running in the background:

```bash
ollama serve
```

### 2. Start the Flask server

In your project directory, run:

```bash
python server.py
```

You should see output similar to:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🧠 Gemma 2B Neural Interface Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  • Starting server...
  • Make sure Ollama is running with Gemma 2B model
  • Web search is active (regex-based implementation)
  • Server running at http://localhost:5000
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 3. Access the interface

Open a web browser and navigate to:

```
http://localhost:5000
```

You should now see the Gemma 2B Neural Interface running in your browser!

## Usage

- **Ask questions**: Type your question in the input field and press Enter or click the send button
- **Adjust settings**: Use the controls on the right panel to customize the model's behavior
  - **Creative Freedom**: Adjust the temperature (randomness) of responses
  - **Diversity**: Control the variety of tokens considered (top-p)
  - **Response Length**: Set the maximum length of generated responses
  - **Web Search**: Toggle web search capabilities on/off
  - **Deep Search**: Enable for more comprehensive web searches
  - **Neural Mode**: Choose different response styles based on your needs
- **Interface Controls**: Clear chat history or toggle between dark/light theme

## Understanding Web Search

The web search functionality works by:

1. Taking your query and searching Google
2. Extracting relevant information from search results
3. Including this information in the context provided to the Gemma 2B model
4. The model then uses this information to generate a more informed response

Note that web search is performed without API keys, using a regex-based approach to extract search results. This may occasionally result in imperfect extraction of search results.

## Troubleshooting

- **"Neural Network Disconnected"**: Make sure Ollama is running with `ollama serve`
- **"Neural Model Missing"**: Ensure you've pulled the Gemma 2B model with `ollama pull gemma2:2b`
- **Web search not working**: Some IP addresses might be blocked by Google. Try using a different network or VPN.
- **Error loading page**: Check that the Flask server is running on port 5000 and no other application is using this port

## Customization

You can customize the interface by:

- Modifying `styles.css` to change the appearance
- Editing the system prompts in `script.js` to alter the model's behavior
- Adjusting the web search implementation in `server.py` to use different search engines

## Project Structure

```
gemma2b-neural-interface/
│
├── index.html         # Main HTML interface
├── styles.css         # CSS styling
├── script.js          # Client-side JavaScript
├── server.py          # Python server for Ollama integration and web search
└── README.md          # Project documentation
```

## Contributing

Contributions are welcome! If you'd like to improve the Gemma 2B Neural Interface, please:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/improvement`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some improvement'`)
5. Push to the branch (`git push origin feature/improvement`)
6. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Ollama](https://ollama.ai) for providing the local model hosting capability
- [Gemma 2B](https://ai.google.dev/gemma) by Google for the base language model
- Flask, CORS, and other open-source libraries that make this project possible

---

If you encounter any issues or have suggestions for improvements, please open an issue on GitHub.
