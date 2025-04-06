import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import type { AnalysisResults } from "@/lib/types/AnalysisResults";
import type { AnalysisRequest } from "@/lib/types/AnalysisRequest";
import {
    htmlToMarkdown,
    getFactualityData,
    getSentimentData,
    getPoliticalLeaningData,
} from "./prompting";

// Initialize the Gemini API client
const geminiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export async function GET() {
    return NextResponse.json({ message: "News analysis API endpoint" });
}

export async function POST(request: Request) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const body: AnalysisRequest = await request.json();
        let articleContent: string;
        let articleMarkdown: string | undefined;

        // Process based on content type
        if (body.isHtml) {
            try {
                // Handle URL input, fetch the content server-side
                if (body.isUrl && body.url) {
                    console.log("Server-side fetching URL:", body.url);
                    try {
                        // Fetch content server-side
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                        const response = await fetch(body.url, {
                            headers: {
                                "User-Agent":
                                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                                "Accept-Language": "en-US,en;q=0.5",
                            },
                        });

                        if (!response.ok) {
                            throw new Error(
                                `Failed to fetch URL: ${response.status} ${response.statusText}`,
                            );
                        }

                        const htmlContent = await response.text();
                        console.log(
                            `Fetched ${htmlContent.length} bytes from ${body.url}`,
                        );
                        body.content = htmlContent;
                    } catch (error) {
                        const fetchError = error as Error;
                        console.error("Error fetching URL:", fetchError);
                        return NextResponse.json(
                            {
                                error: `Failed to fetch content from URL: ${fetchError.message || "Unknown error"}`,
                            },
                            { status: 400 },
                        );
                    }
                }

                // Process HTML content
                articleMarkdown = await htmlToMarkdown(
                    geminiClient,
                    body.content,
                );

                if (!articleMarkdown) {
                    return NextResponse.json(
                        { error: "Failed to convert HTML to Markdown" },
                        { status: 400 },
                    );
                }

                articleContent = articleMarkdown;
            } catch (error) {
                console.error("HTML to Markdown conversion error:", error);
                return NextResponse.json(
                    { error: "Failed to process HTML content" },
                    { status: 400 },
                );
            }
        } else {
            articleContent = body.content;
            articleMarkdown = body.content; // If plain text, consider it already as markdown
        }

        console.log("Article content:", articleContent);

        try {
            // Get sentiment analysis data
            const sentimentDataRaw = await getSentimentData(
                geminiClient,
                articleContent,
            );

            if (!sentimentDataRaw) {
                return NextResponse.json(
                    { error: "Failed to analyze sentiment" },
                    { status: 500 },
                );
            }

            type SentimentData = {
                overall_score: number;
                entities: Array<{
                    name: string;
                    score: number;
                }>;
            };
            const sentimentData = JSON.parse(sentimentDataRaw) as SentimentData;

            // Get factuality analysis data
            const factualityDataRaw = await getFactualityData(
                geminiClient,
                articleContent,
            );

            if (!factualityDataRaw) {
                return NextResponse.json(
                    { error: "Failed to analyze factuality" },
                    { status: 500 },
                );
            }

            type FactualityData = {
                rating: number;
                ratingLabel: string;
                sources: string[];
            };
            const factualityData = JSON.parse(
                factualityDataRaw,
            ) as FactualityData;

            // Extract the domain from content if it's a URL
            let sourceDomain = "unknown-source.com";
            let sourceName = "Unknown Source";

            // Check for direct URL input first
            if (body.isUrl && body.url) {
                try {
                    // Use the provided URL directly
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    const url = new URL(body.url);
                    sourceDomain = url.hostname;
                    sourceName = sourceDomain
                        .replace(/^www\./i, "")
                        .split(".")[0]!;
                    // Capitalize the first letter of each word in the name
                    sourceName = sourceName
                        .split("-")
                        .map(
                            (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1),
                        )
                        .join(" ");
                } catch (e) {
                    console.error("URL parsing error:", e);
                }
            } else if (body.isHtml) {
                // Try to extract the domain from meta tags or other elements in the HTML
                const urlMatch =
                    /<meta[^>]*property=["']og:url["'][^>]*content=["']([^"']+)["']/i.exec(
                        body.content,
                    );
                if (urlMatch?.[1]) {
                    try {
                        const url = new URL(urlMatch[1]);
                        sourceDomain = url.hostname;
                        sourceName = sourceDomain
                            .replace(/^www\./i, "")
                            .split(".")[0]!;
                        // Capitalize the first letter of each word in the name
                        sourceName = sourceName
                            .split("-")
                            .map(
                                (word) =>
                                    word.charAt(0).toUpperCase() +
                                    word.slice(1),
                            )
                            .join(" ");
                    } catch (e) {
                        console.error("URL parsing error:", e);
                    }
                }
            }

            // Get political leaning analysis from AI
            let politicalScore = 50; // Default to center
            let politicalCategory = "Centrist";
            let politicalReasoning = "";

            try {
                const politicalDataRaw = await getPoliticalLeaningData(
                    geminiClient,
                    articleContent,
                );

                if (politicalDataRaw) {
                    type PoliticalData = {
                        score: number;
                        category: string;
                        reasoning: string;
                    };
                    const politicalData = JSON.parse(
                        politicalDataRaw,
                    ) as PoliticalData;
                    politicalScore = politicalData.score ?? 50;
                    politicalCategory = politicalData.category ?? "Centrist";
                    politicalReasoning = politicalData.reasoning ?? "";
                }
            } catch (error) {
                console.error("Political leaning analysis error:", error);
                // Continue with default values if political analysis fails
            }

            // Format the complete analysis results
            const analysisResults: AnalysisResults = {
                factuality: {
                    confidence: factualityData.rating ?? 0.75,
                    sources: factualityData.sources ?? [],
                    rating:
                        factualityData.ratingLabel ??
                        getReliabilityRating(factualityData.rating ?? 0.75),
                },
                source: {
                    name: sourceName,
                    url: sourceDomain,
                    reliability: getReliabilityRating(
                        factualityData.rating ?? 0.75,
                    ),
                },
                politicalLeaning: {
                    score: politicalScore,
                    category: politicalCategory,
                    reasoning: politicalReasoning,
                },
                sentiment: {
                    overall: {
                        score: sentimentData.overall_score ?? 0,
                    },
                    entities: sentimentData.entities ?? [],
                },
            };

            // Add the article content to the response
            const fullResponse = {
                ...analysisResults,
                article: {
                    title: extractTitle(body.content, body.isHtml),
                    content: articleMarkdown,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    url: body.isUrl
                        ? body.url
                        : body.isHtml
                          ? sourceDomain
                          : undefined,
                },
            };

            return NextResponse.json(fullResponse);
        } catch (error) {
            console.error("Analysis error:", error);
            return NextResponse.json(
                { error: "Failed to analyze the content" },
                { status: 500 },
            );
        }
    } catch (error) {
        console.error("Request processing error:", error);
        return NextResponse.json(
            { error: "Failed to process request" },
            { status: 400 },
        );
    }
}

// Helper function to convert factuality rating to a text reliability rating
function getReliabilityRating(factualityScore: number): string {
    if (factualityScore >= 0.9) return "Very Reliable";
    if (factualityScore >= 0.75) return "Reliable";
    if (factualityScore >= 0.6) return "Mostly Reliable";
    if (factualityScore >= 0.4) return "Mixed Reliability";
    if (factualityScore >= 0.25) return "Somewhat Unreliable";
    return "Unreliable";
}

// Helper function to extract a title from content
function extractTitle(content: string, isHtml: boolean): string {
    if (isHtml) {
        // Try to extract title from HTML
        const titleMatch =
            /<title[^>]*>(.*?)<\/title>/i.exec(content) ??
            /<h1[^>]*>(.*?)<\/h1>/i.exec(content) ??
            /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i.exec(
                content,
            );

        if (titleMatch?.[1]) {
            return titleMatch[1].trim();
        }
    }

    // If not HTML or no title found, extract first line or create a generic title
    const firstLine = content.split("\n")[0]!.trim();
    if (firstLine && firstLine.length < 100) {
        return firstLine;
    }

    return "Untitled Article";
}
