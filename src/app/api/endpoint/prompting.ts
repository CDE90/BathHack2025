import type { GoogleGenAI } from "@google/genai";

export async function htmlToMarkdown(apiClient: GoogleGenAI, html: string) {
    const prompt = `You have been tasked with converting the following HTML document to Markdown.
    Your job is to convert the HTML to Markdown, preserving the original formatting and structure.
    You should not add any additional content or formatting to the Markdown, but also remember to remove
    any unnecessary or redundant content, such as navigation menus or footers.
    You should only extract the main content of the article, and not include any additional information.

    You should return the Markdown as a string.

    ${html}
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

    You should provide a sentiment score for the entire article, as well as individual scores for each identified entity.
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
