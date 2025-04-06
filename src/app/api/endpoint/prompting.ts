import type { GoogleGenAI } from "@google/genai";

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
    console.log("Sanitized HTML:", sanitizedHtml);

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

    return resp.text;
}

export async function getSentimentData(
    apiClient: GoogleGenAI,
    article: string,
) {
    const prompt = `You have been tasked with analyzing the following article for sentiment.
    Your job is to analyse the article, and provide a sentiment score between 0 and 1.

    You should provide a sentiment score for the entire article, as well as individual scores for any relevant entities.
    The sentiment score should be a float between 0 and 1, with higher scores indicating more positive sentiment.

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

    ${article}

    Only return the JSON, do not include any additional text or explanation. If you return additional text, you will be punished.
    Do not even include \`\`\` (code blocks) in your response.
    `;

    const resp = await apiClient.models.generateContent({
        model: "gemini-2.0-flash-001",
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    console.log("Sentiment data:", resp.text);

    return resp.text?.replace(/```json/g, "").replace(/```/g, "");
}

export async function getFactualityData(
    apiClient: GoogleGenAI,
    article: string,
) {
    const prompt = `You have been tasked with analyzing the following article for factuality.
    Your job is to analyze the article and provide a factuality assessment.

    Please examine the article for:
    1. Verifiable claims and statements
    2. Referenced sources or citations 
    3. Consistency with known facts
    4. Presence of misleading or incorrect information
    5. Use of reliable primary sources

    You should return the data in the following json format:
    {
        "rating": a number between 0 and 1 representing the factuality score, with higher values indicating more factual content,
        "ratingLabel": a text label representing the rating (choose one from: "Very Factual", "Mostly Factual", "Mixed Factuality", "Somewhat Unfactual", "Not Factual"),
        "sources": an array of URLs or citations that support the factual claims in the article - find at least 3-5 sources if possible
    }

    ${article}

    Only return the JSON, do not include any additional text or explanation. If you return additional text, you will be punished.
    Do not even include \`\`\` (code blocks) in your response.
    `;

    const resp = await apiClient.models.generateContent({
        model: "gemini-2.0-flash-001",
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    console.log("Factuality data:", resp.text);

    return resp.text?.replace(/```json/g, "").replace(/```/g, "");
}

export async function getPoliticalLeaningData(
    apiClient: GoogleGenAI,
    article: string,
) {
    const prompt = `You have been tasked with analyzing the following article for political leaning.
    Your job is to carefully and objectively analyze the article's content, language, framing of issues, 
    and overall perspective to determine its position on the political spectrum.

    Please analyze the article for:
    1. Word choice and framing that indicates political perspective
    2. Which issues are emphasized and how they are presented
    3. Treatment of different political groups, policies, or figures
    4. Overall narrative and perspective on political matters
    5. Any explicit or implicit bias toward particular ideologies

    Please provide a political leaning score on a scale from 0 to 100, where:
    - 0-20: Far Left (strongly progressive/socialist perspective)
    - 21-40: Center-Left (liberal/progressive perspective)
    - 41-60: Centrist (balanced perspective with minimal bias)
    - 61-80: Center-Right (conservative perspective)
    - 81-100: Far Right (strongly conservative/nationalist perspective)

    Return your analysis in the following JSON format:
    {
        "score": a number between 0 and 100 indicating the political leaning,
        "category": one of ["Far Left", "Center-Left", "Centrist", "Center-Right", "Far Right"],
        "reasoning": a brief explanation of why you assigned this score, highlighting key indicators in the text
    }

    ${article}

    Only return the JSON, do not include any additional text or explanation. If you return additional text, you will be punished.
    Do not even include \`\`\` (code blocks) in your response.
    `;

    const resp = await apiClient.models.generateContent({
        model: "gemini-2.0-flash-001",
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    console.log("Political leaning data:", resp.text);

    return resp.text?.replace(/```json/g, "").replace(/```/g, "");
}
