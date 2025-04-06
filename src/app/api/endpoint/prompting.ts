import type { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

// Initialize the Perplexity API client for search-based tasks
const perplexityClient = new OpenAI({
    apiKey: process.env.PERPLEXITY_API_KEY,
    baseURL: "https://api.perplexity.ai",
});

// Function to sanitize HTML before sending to AI
function sanitizeHtml(html: string): string {
    // Remove script tags and their contents
    let sanitized = html.replace(
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        "",
    );

    // Remove inline event handlers (onclick, onload, etc.)
    sanitized = sanitized.replace(
        /\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^>\s]*)/gi,
        "",
    );

    // Remove iframe tags
    sanitized = sanitized.replace(
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        "",
    );

    // Remove style tags
    sanitized = sanitized.replace(
        /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
        "",
    );

    // Remove comments
    sanitized = sanitized.replace(/<!--[\s\S]*?-->/g, "");

    // Remove potentially harmful tags
    sanitized = sanitized.replace(
        /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
        "",
    );
    sanitized = sanitized.replace(
        /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
        "",
    );

    return sanitized;
}

export async function htmlToMarkdown(apiClient: GoogleGenAI, html: string) {
    // Sanitize the HTML before sending to AI
    const sanitizedHtml = sanitizeHtml(html);
    console.log("Original HTML length:", html.length);
    console.log("Sanitized HTML length:", sanitizedHtml.length);

    const prompt = `You have been tasked with extracting and converting an article from a potentially incomplete HTML document.
    Your job is to perform a comprehensive extraction of the main article content from this HTML and convert it to well-formatted Markdown.
    
    IMPORTANT INSTRUCTIONS:
    1. Focus on identifying and extracting ALL main article content, even if the HTML appears incomplete
    2. Look for content within article tags, main tags, or divs with class/id containing terms like "content", "article", "story", "body"
    3. Extract ALL text content you can find related to the main article - DO NOT STOP EARLY
    4. Include EVERY paragraph, heading, list, table, blockquote, and content element that appears to be part of the article
    5. Preserve ALL images (convert to markdown format: ![alt text](image URL)) and their captions
    6. Maintain formatting like bold, italic, underline, and links
    7. Exclude navigation elements, headers, footers, sidebars, ads, and other non-article content
    8. If the article appears to be truncated, note this at the end
    9. Pay special attention to clues in the HTML structure to identify the beginning and end of the article content
    10. Convert ALL headings to proper markdown format (# for h1, ## for h2, etc.)
    
    Your goal is to produce complete, well-structured Markdown that contains the ENTIRE article content, including ALL paragraphs, sections, images, and formatted text.

    ${sanitizedHtml}

    Return ONLY the converted Markdown with no additional text, explanation, or commentary.
    `;

    const resp = await apiClient.models.generateContent({
        model: "gemini-2.0-flash-001",
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    console.log("Markdown conversion result length:", resp.text?.length ?? 0);

    return resp.text
        ?.replace(/```md/g, "")
        .replace(/```markdown/g, "")
        .replace(/```/g, "");
}

export async function getSentimentData(
    apiClient: GoogleGenAI,
    article: string,
    sourceUrl: string,
    sourceName: string,
) {
    const prompt = `You have been tasked with analyzing the following article for sentiment.
    Your job is to analyse the article, and provide a sentiment score between -1 and 1.

    You should provide a sentiment score for the entire article, as well as individual scores for any relevant entities.
    The sentiment score should be a float between -1 and 1, with higher scores indicating more positive sentiment.

    You should analyse the sentiment of the article and any entities based solely on the perspective of the author, or any other relevant information provided in the article.

    You should return the data in the following json format:
    {
        "overall_score": 0.5,
        "entities": [
            {
                "name": "President Smith",
                "score": 0.7
            },
            {
                "name": "New Policy",
                "score": -0.5
            },
            {
                "name": "Economic Reform",
                "score": 0.3
            },
            {
                "name": "Opposition Party",
                "score": -0.6
            }
        ]
    }

    Predicted source name: ${sourceName}
    Predicted source URL: ${sourceUrl}

    ${article}

    Only return the JSON, do not include any additional text or explanation. If you return additional text, you will be punished.
    Do not even include \`\`\` (code blocks) in your response.
    `;

    // We'll continue using Gemini for sentiment analysis since it doesn't require web search
    const resp = await apiClient.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
    });

    console.log("Sentiment data:", resp.text);

    return resp.text?.replace(/```json/g, "").replace(/```/g, "");
}

export async function getFactualityData(
    apiClient: GoogleGenAI,
    article: string,
    sourceUrl: string,
    sourceName: string,
) {
    const prompt = `You have been tasked with analyzing the following article and its source for factuality.
    Your job is to provide SEPARATE factuality assessments for both the article content itself AND the publishing source.

    Please examine the article for:
    1. Verifiable claims and statements
    2. Referenced sources or citations 
    3. Consistency with known facts
    4. Presence of misleading or incorrect information
    5. Use of reliable primary sources

    Then examine the source (${sourceName} - ${sourceUrl}) for:
    1. Overall reputation for factual reporting
    2. History of corrections or retractions
    3. Transparency about ownership and funding
    4. Use of reliable primary sources in general reporting
    5. Editorial standards and fact-checking processes

    You should return the data in the following json format:
    {
        "article": {
            "rating": a number between 0 and 1 representing the article's factuality score, with higher values indicating more factual content,
            "ratingLabel": a text label representing the article's rating (choose one from: "Very Factual", "Mostly Factual", "Mixed Factuality", "Somewhat Unfactual", "Not Factual"),
            "sources": an array of URLs or citations that support the factual claims in the article - find at least 3-5 sources if possible
        },
        "source": {
            "rating": a number between 0 and 1 representing the source's general factuality score, with higher values indicating more factual reporting overall,
            "ratingLabel": a text label representing the source's rating (choose one from: "Very Factual", "Mostly Factual", "Mixed Factuality", "Somewhat Unfactual", "Not Factual")
        }
    }

    Please use search capabilities to find reliable sources for validating both the article and the source's reputation. These should be from a variety of sources, including academic journals, news outlets, and reputable news organizations.
    Avoid using the source URL itself as a source for validation, as that would be circular reasoning.
    For each source cited, please include the full URL of the source page, not just the domain.

    Predicted source name: ${sourceName}
    Predicted source URL: ${sourceUrl}

    ${article}

    Only return the JSON, do not include any additional text or explanation. If you return additional text, you will be punished.
    Do not even include \`\`\` (code blocks) in your response.
    `;

    // Use Perplexity API for factuality data (requires search capabilities)
    const response = await perplexityClient.chat.completions.create({
        model: "sonar",
        messages: [
            {
                role: "user",
                content: prompt,
            },
        ],
        web_search_options: {
            search_context_size: "medium",
        },
    });

    // Extract content and citations
    const result = response.choices[0]?.message.content;
    // @ts-expect-error - citations is not in the official type definition but exists in the response
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const citations: string[] = response.citations ?? [];

    // Log the result and citations
    console.log("Factuality data:", result);
    console.log("Citations:", citations);

    // Parse the result to add the citations as sources
    try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const parsedResult = JSON.parse(
            result?.replace(/```json/g, "").replace(/```/g, "") ?? "{}",
        );

        // Add the citations as sources to the article factuality data
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        parsedResult.article ??= {};
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        parsedResult.article.sources.push(...citations);

        return JSON.stringify(parsedResult);
    } catch (error) {
        console.error("Error parsing factuality data:", error);
        return result?.replace(/```json/g, "").replace(/```/g, "");
    }
}

export async function getPoliticalLeaningData(
    apiClient: GoogleGenAI,
    article: string,
    sourceUrl: string,
    sourceName: string,
) {
    const prompt = `You have been tasked with analyzing the following article AND its source for political leaning.
    Your job is to carefully and objectively analyze BOTH the article's content AND the source publication's overall political orientation.

    For the ARTICLE, please analyze:
    1. Word choice and framing that indicates political perspective
    2. Which issues are emphasized and how they are presented
    3. Treatment of different political groups, policies, or figures
    4. Overall narrative and perspective on political matters
    5. Any explicit or implicit bias toward particular ideologies

    For the SOURCE (${sourceName}), please research and analyze:
    1. Overall editorial stance and history
    2. Ownership structure and funding sources
    3. How the outlet portrays different political groups in general
    4. Previous political endorsements or positions
    5. General reputation for political orientation

    Please provide SEPARATE political leaning scores for BOTH the article and the source on a scale from 0 to 100, where:
    - 0-20: Far Left (strongly progressive/socialist perspective)
    - 21-40: Center-Left (liberal/progressive perspective)
    - 41-60: Centrist (balanced perspective with minimal bias)
    - 61-80: Center-Right (conservative perspective)
    - 81-100: Far Right (strongly conservative/nationalist perspective)

    Return your analysis in the following JSON format:
    {
        "article": {
            "score": a number between 0 and 100 indicating the article's political leaning,
            "category": one of ["Far Left", "Center-Left", "Centrist", "Center-Right", "Far Right"],
            "reasoning": a brief explanation of why you assigned this score, highlighting key indicators in the article text
        },
        "source": {
            "score": a number between 0 and 100 indicating the source's general political leaning,
            "category": one of ["Far Left", "Center-Left", "Centrist", "Center-Right", "Far Right"],
            "reasoning": a brief explanation of why you assigned this score, highlighting key indicators from your research
        }
    }

    Predicted source name: ${sourceName}
    Predicted source URL: ${sourceUrl}

    ${article}

    Only return the JSON, do not include any additional text or explanation. If you return additional text, you will be punished.
    Do not even include \`\`\` (code blocks) in your response.
    `;

    // Use Perplexity API for political leaning data (requires search capabilities)
    const response = await perplexityClient.chat.completions.create({
        model: "sonar",
        messages: [
            {
                role: "user",
                content: prompt,
            },
        ],
        web_search_options: {
            search_context_size: "medium",
        },
    });

    // Extract content and citations
    const result = response.choices[0]?.message.content;
    // @ts-expect-error - citations is not in the official type definition but exists in the response
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const citations: string[] = response.citations ?? [];

    // Log the result and citations
    console.log("Political leaning data:", result);
    console.log("Political leaning citations:", citations);

    // We don't need to add citations to the response format, but we'll log them for reference
    return result?.replace(/```json/g, "").replace(/```/g, "");
}

export async function getSourceData(
    apiClient: GoogleGenAI,
    article: string,
    sourceUrl: string,
    sourceName: string,
) {
    const prompt = `You have been tasked with extracting and analyzing the following article's source.
    Using the internet to assist you, please provide a comprehensive analysis of the source's credibility, reliability, and bias.

    Please provide a source analysis in the following JSON format:
    {
        "name": the name of the source,
        "url": the URL of the source,
        "reliability": a text label indicating the reliability of the source (choose one from: "Very Reliable", "Reliable", "Mostly Reliable", "Mixed Reliability", "Somewhat Unreliable", "Unreliable"),
        "bias": a text label indicating the bias of the source (choose one from: "None", "Biased", "Unbiased"),
        "credibility": a number between 0 and 1 indicating the credibility of the source, with higher values indicating more credible sources,
        "reasoning": a brief explanation of why you assigned this score, highlighting key indicators in the text
    }

    ${article}

    Predicted source name: ${sourceName}
    Predicted source URL: ${sourceUrl}

    Only return the JSON, do not include any additional text or explanation. If you return additional text, you will be punished.
    Do not even include \`\`\` (code blocks) in your response.
    `;

    // Use Perplexity API for source data analysis (requires search capabilities)
    const response = await perplexityClient.chat.completions.create({
        model: "sonar",
        messages: [
            {
                role: "user",
                content: prompt,
            },
        ],
        web_search_options: {
            search_context_size: "medium",
        },
    });

    // Extract content and citations
    const result = response.choices[0]?.message.content;
    // @ts-expect-error - citations is not in the official type definition but exists in the response
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const citations: string[] = response.citations ?? [];

    // Log the result and citations
    console.log("Source data:", result);
    console.log("Source data citations:", citations);

    // Parse the result and enhance it with citation information
    try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const parsedResult = JSON.parse(
            result?.replace(/```json/g, "").replace(/```/g, "") ?? "{}",
        );

        // Add enhanced reasoning with citations if available
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (citations.length > 0 && parsedResult.reasoning) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            parsedResult.reasoning +=
                "\n\nBased on information from: " +
                citations
                    .map((citation) =>
                        citation.replace(
                            /https?:\/\/(?:www\.)?([^\/]+).*/,
                            "$1",
                        ),
                    )
                    .join(", ");
        }

        return JSON.stringify(parsedResult);
    } catch (error) {
        console.error("Error parsing source data:", error);
        return result?.replace(/```json/g, "").replace(/```/g, "");
    }
}

export async function getImageDescriptions(
    geminiClient: GoogleGenAI,
    images: string[],
) {
    const imageBuffers: Promise<ArrayBuffer>[] = [];
    images.forEach(function (img: string) {
        imageBuffers.push(
            fetch(img).then((response) => response.arrayBuffer()),
        );
    });

    const b64Images: string[] = [];
    for (let i = 0; i < imageBuffers.length; i++) {
        const buf: ArrayBuffer = (await imageBuffers[i]) ?? new ArrayBuffer();
        b64Images.push(
            JSON.stringify({
                inlineData: {
                    data: Buffer.from(buf).toString("base64"),
                    mimeType: "image/" + (images[i] ?? ".jpeg".split(".")[-1]),
                },
            }),
        );
    }

    const prompt = `You have been tasked with analysing images which come from news articles. You must look at the images, and explain what is in them.
    please respond with an array of strings in the following format:
    [
        the description of the image,
    ]
        Only return the JSON, do not include any additional text or explanation. If you return additional text, you will be punished.
    Do not even include \`\`\` (code blocks) in your response.`;

    b64Images.push(prompt);

    const response = await geminiClient.models.generateContent({
        model: "gemini-2.0-flash-001",
        contents: b64Images,
    });

    console.log(
        (response.text ?? "[]")?.replace(/```json/g, "").replace(/```/g, ""),
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const descriptions: string[] = JSON.parse(
        (response.text ?? "[]")?.replace(/```json/g, "").replace(/```/g, ""),
    );

    return descriptions;
}
