# 🤖 Ollama Local AI Chatbot Integration

## Overview

TradeLab now features a **local AI chatbot** that connects directly to your Ollama instance, giving you complete control over your AI models and data privacy. No API keys required!

## ✨ Features

### 🔒 **Privacy-First Design**
- All AI processing happens on your local machine
- No data sent to external AI services
- Complete control over your models and conversations

### 🧠 **Smart Context Integration**
- Automatically fetches your portfolio data for AI analysis
- Enhances prompts with trading context
- Provides structured data for better AI responses

### ⚙️ **Flexible Configuration**
- Choose your preferred Ollama host (default: localhost:11434)
- Select from any installed models (llama3, mistral, etc.)
- Settings persist across browser sessions

### 📊 **Trading-Focused AI**
- Portfolio analysis and recommendations
- Backtest result interpretation
- Market trend analysis
- Financial term explanations

## 🚀 Getting Started

### Step 1: Install Ollama

1. **Download Ollama**
   ```bash
   # Visit https://ollama.ai and download for your OS
   # Or install via package manager:
   
   # macOS
   brew install ollama
   
   # Linux
   curl -fsSL https://ollama.ai/install.sh | sh
   ```

2. **Start Ollama Service**
   ```bash
   ollama serve
   # Ollama will start on http://localhost:11434
   ```

### Step 2: Download AI Models

```bash
# Download recommended models
ollama pull llama3          # Best general-purpose model
ollama pull mistral         # Fast and capable
ollama pull codellama       # Great for code generation
ollama pull phi3           # Lightweight option

# View available models
ollama list
```

### Step 3: Configure TradeLab

1. **Open the chatbot** in TradeLab (purple brain icon)
2. **Click the settings gear** in the chat header
3. **Configure your setup**:
   - **Host**: `http://localhost:11434` (default)
   - **Model**: Choose from your installed models
4. **Test connection** and save settings

## 🎯 Usage Examples

### Portfolio Analysis
```
User: "Analyze my portfolio diversification"
AI: [Gets your portfolio data and provides detailed analysis]
```

### Backtest Interpretation
```
User: "Explain my latest backtest results"
AI: [Fetches backtest data and explains performance metrics]
```

### Financial Education
```
User: "What is the Sharpe ratio and why does it matter?"
AI: [Provides detailed explanation with examples]
```

### Strategy Generation
```
User: "Generate a momentum trading strategy using RSI"
AI: [Creates Python code using Backtrader framework]
```

## 🔧 Advanced Configuration

### Custom Ollama Host
If running Ollama on a different machine or port:
```
Host: http://192.168.1.100:11434
```

### Model Selection Tips
- **llama3**: Best for complex analysis and explanations
- **mistral**: Fast responses, good for quick questions
- **codellama**: Excellent for strategy code generation
- **phi3**: Lightweight, good for simple queries

### Performance Optimization
```bash
# Increase context window for long conversations
ollama run llama3 --num-ctx 4096

# Adjust temperature for more creative responses
# (Configure in model settings when available)
```

## 🛠️ Technical Details

### Architecture
```
Frontend (React) → Ollama API (Local) → Your AI Models
     ↓
Backend (FastAPI) → Database Context → Enhanced Prompts
```

### Data Flow
1. **User asks question** in TradeLab chat
2. **Context detection** identifies relevant data type
3. **Backend provides context** (portfolio, trades, etc.)
4. **Enhanced prompt** sent to local Ollama
5. **AI response** streamed back to user

### API Endpoints
- `POST /api/v1/ai/context` - Get trading data context
- `GET /api/v1/ai/financial-terms` - List financial terms
- `GET /api/v1/ai/database-schema` - Database schema for SQL generation

## 🔍 Troubleshooting

### Common Issues

#### "Ollama not detected"
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama if not running
ollama serve
```

#### "Model not found"
```bash
# List installed models
ollama list

# Pull the model you want
ollama pull llama3
```

#### Connection timeout
1. Check firewall settings
2. Verify Ollama host URL
3. Try different port (if custom setup)

#### Slow responses
1. Use smaller models (phi3, mistral)
2. Reduce context window
3. Check system resources (RAM, CPU)

### Performance Tips

#### Optimal Models by Use Case
- **Quick questions**: `phi3` or `mistral`
- **Detailed analysis**: `llama3` or `llama3:70b`
- **Code generation**: `codellama`
- **Financial analysis**: `llama3` (best reasoning)

#### System Requirements
- **Minimum**: 8GB RAM, 4GB free disk space
- **Recommended**: 16GB+ RAM, 10GB+ free disk
- **Optimal**: 32GB+ RAM, NVIDIA GPU (optional)

## 🚀 Advanced Features

### Custom Models
```bash
# Import custom financial models
ollama create finbert -f Modelfile

# Use specialized models for trading
ollama pull finance-llm  # If available
```

### Batch Processing
```bash
# Process multiple queries
echo "Analyze AAPL stock trends" | ollama run llama3
echo "Calculate portfolio risk" | ollama run llama3
```

### Model Comparison
```javascript
// Test different models for the same query
const models = ['llama3', 'mistral', 'phi3']
models.forEach(model => {
  // Switch model in settings and compare responses
})
```

## 🔐 Security & Privacy

### Data Privacy Benefits
- **No external API calls** - all processing local
- **No data logging** - Ollama doesn't store conversations
- **Complete control** - you own the models and data
- **Offline capable** - works without internet

### Security Considerations
- Ollama runs on localhost by default (secure)
- No authentication required for local connections
- Models are stored locally on your machine
- No data transmitted to external services

## 🎨 Customization

### Custom Prompts
The system automatically enhances prompts with relevant context:

```javascript
// Example enhanced prompt
const enhancedPrompt = `
Context: ${JSON.stringify(portfolioData)}

User Question: ${userInput}

You are a portfolio analysis expert. Based on the portfolio data above, provide insights on:
1. Diversification and risk
2. Asset allocation recommendations
3. Performance analysis
4. Specific improvement suggestions
`
```

### UI Customization
- Chat interface fully integrated with TradeLab design
- Settings panel for easy configuration
- Real-time connection status
- Streaming response display

## 📚 Model Recommendations

### For Trading Analysis
1. **llama3** - Best overall for financial analysis
2. **mistral** - Fast and accurate for general queries
3. **codellama** - Excellent for strategy code generation

### For Learning
1. **llama3** - Detailed explanations of complex concepts
2. **phi3** - Quick definitions and simple explanations

### For Development
1. **codellama** - Trading strategy development
2. **llama3** - Code review and optimization

## 🔄 Updates & Maintenance

### Keeping Models Updated
```bash
# Update existing models
ollama pull llama3

# Check for new models
ollama list --remote

# Remove unused models
ollama rm old-model
```

### TradeLab Integration Updates
- Settings sync automatically with localStorage
- Context integration improves with platform updates
- New prompt templates added regularly

## 🌟 Best Practices

### Effective Prompting
1. **Be specific**: "Analyze my tech stock allocation" vs "analyze portfolio"
2. **Ask follow-ups**: Build on previous responses
3. **Use context**: Mention specific portfolios or trades
4. **Request formats**: Ask for tables, bullet points, or code

### Model Selection
1. **Start with llama3** for best results
2. **Try mistral** for faster responses
3. **Use codellama** for strategy development
4. **Test phi3** for lightweight queries

### Performance Optimization
1. **Close other applications** for better model performance
2. **Use specific contexts** rather than general questions
3. **Break complex questions** into smaller parts
4. **Monitor system resources** during heavy usage

---

## 🎯 Next Steps

1. **Install Ollama** and download your first model
2. **Configure TradeLab** with your preferred settings
3. **Start with simple questions** to test the integration
4. **Explore advanced features** like context-aware analysis
5. **Experiment with different models** to find your favorites

The local AI chatbot gives you the power of advanced AI while maintaining complete privacy and control. Start exploring and enhance your trading analysis with personalized AI assistance!
