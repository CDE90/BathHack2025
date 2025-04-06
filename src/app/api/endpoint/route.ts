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

        // Process the content based on whether it's HTML or plain text
        if (body.isHtml) {
            try {
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

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const sentimentData = JSON.parse(sentimentDataRaw);

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

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const factualityData = JSON.parse(factualityDataRaw);

            // Extract the domain from content if it's a URL
            let sourceDomain = "unknown-source.com";
            let sourceName = "Unknown Source";

            if (body.isHtml) {
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
                    const politicalData = JSON.parse(politicalDataRaw);
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
                    confidence: factualityData.rating || 0.75,
                    sources: factualityData.sources || [],
                    rating: factualityData.ratingLabel || getReliabilityRating(factualityData.rating || 0.75),
                },
                source: {
                    name: sourceName,
                    url: sourceDomain,
                    reliability: getReliabilityRating(
                        factualityData.rating || 0.75,
                    ),
                },
                politicalLeaning: {
                    score: politicalScore,
                    category: politicalCategory,
                    reasoning: politicalReasoning,
                },
                sentiment: {
                    overall: {
                        score: sentimentData.overall_score || 0,
                    },
                    entities: sentimentData.entities || [],
                },
            };

            // Add the article content to the response
            const fullResponse = {
                ...analysisResults,
                article: {
                    title: extractTitle(body.content, body.isHtml),
                    content: articleMarkdown,
                    url: body.isHtml ? sourceDomain : undefined,
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
