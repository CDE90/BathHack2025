import type { GoogleGenAI } from "@google/genai";

export async function htmlToMarkdown(apiClient: GoogleGenAI, html: string) {
    const prompt = `You have been tasked with converting the following HTML document to Markdown.
    Your job is to convert the HTML to Markdown, preserving the original formatting and structure.
    You should not add any additional content or formatting to the Markdown, but also remember to remove
    any unnecessary or redundant content, such as navigation menus or footers.
    You should only extract the main content of the article, and not include any additional information.

    You should return the Markdown as a string.

    ${html}

    Only return the Markdown, do not include any additional text or explanation. If you return additional text, you will be punished.
    `;

    const resp = await apiClient.models.generateContent({
        model: "gemini-2.0-flash-001",
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

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
