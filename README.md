# The Credibility Compass

A news credibility analysis tool developed for Bath Hack 2025 that evaluates news articles for factual accuracy, political bias, source reliability, and sentiment.

## 🌟 Inspiration

In an era of information overload and increasing concerns about misinformation, we were inspired to create a tool that helps people navigate the complex media landscape. The Credibility Compass was born from our desire to empower readers with AI-assisted insights into the credibility and bias of the news they consume.

Our goal was to build a solution that:

- Promotes media literacy and critical thinking
- Provides transparent assessments of news content
- Helps users recognize political bias and sentiment in reporting
- Reduces the spread of misinformation by highlighting factual inaccuracies

## 🔍 What It Does

The Credibility Compass allows users to:

1. **Enter any news article URL** for comprehensive analysis
2. **View factuality assessments** with confidence scores, ratings, and supporting sources
3. **Understand the reliability** of the news source with detailed reasoning
4. **Identify political leaning** of both the article and its source on a spectrum from Far Left to Far Right
5. **Analyze sentiment patterns** throughout the article, with entity-specific sentiment highlighting

## 🛠️ How We Built It

This project is built with a modern web stack:

- **Frontend**: Next.js with the App Router, Tailwind CSS, and shadcn/ui components
- **Backend**: Next.js API routes handling content processing and analysis
- **AI Integration**:
    - Google's Gemini API for comprehensive content analysis
    - Perplexity API for search-based factual verification and source credibility assessment
- **Data Processing**: Custom algorithms for entity extraction, sentiment analysis, and bias detection

## 🧠 Challenges We Faced

Building The Credibility Compass came with several challenges:

- **Content Extraction**: Developing robust methods to extract clean article text from diverse news websites
- **Bias Detection**: Creating a nuanced system for identifying political bias without introducing our own biases
- **Performance Optimization**: Balancing comprehensive analysis with reasonable response times
- **Source Credibility**: Establishing reliable metrics to evaluate the trustworthiness of news sources
- **UI/UX Design**: Creating an intuitive interface that presents complex information clearly

## 🏆 Accomplishments

We're proud of creating:

- A fully functional tool that provides multi-faceted analysis of news content
- An intuitive user interface that makes complex information accessible
- A system that balances detailed analysis with user-friendly presentation
- Integration with advanced AI models to provide sophisticated insights

## 📚 What We Learned

Through this project, we gained expertise in:

- Prompt engineering for specialized AI analysis
- Content extraction techniques for web articles
- Political bias detection methodologies
- Sentiment analysis implementation
- Building responsive UIs for data-heavy applications
- Optimizing API calls to external AI services

## 🔮 What's Next

Future enhancements we're considering:

- Browser extension for instant analysis while browsing
- Expanded historical context for news sources
- Comparison feature to analyze multiple articles on the same topic
- Community feedback integration to improve analysis accuracy
- Mobile application development

## 🚀 Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/CDE90/BathHack2025.git
cd BathHack2025

# Install dependencies
pnpm install
```

### Development

```bash
# Start the development server
pnpm dev
```

### Building for Production

```bash
# Build the application
pnpm build

# Start the production server
pnpm start
```

## 🧪 Testing and Quality Assurance

```bash
# Run linting
pnpm lint

# Fix linting issues
pnpm lint:fix

# Run type checking
pnpm typecheck

# Check formatting
pnpm format:check

# Fix formatting
pnpm format:write
```

## 👥 Contributors

- [Ethan Coward](https://github.com/CDE90)
- [Tom Watts](https://github.com/Tom9470)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
