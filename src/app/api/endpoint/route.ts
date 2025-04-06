import type { AnalysisRequest } from "@/lib/types/AnalysisRequest";
import type { AnalysisResults } from "@/lib/types/AnalysisResults";
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import {
    getFactualityData,
    getImageDescriptions,
    getPoliticalLeaningData,
    getSentimentData,
    getSourceData,
    htmlToMarkdown,
} from "./prompting";

// Initialize the Gemini API client for HTML to Markdown conversion
const geminiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

// Note: Perplexity API client is initialized in prompting.ts

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
            // Extract the domain from content if it's a URL
            let sourceDomain = "unknown-source.com";
            let sourceName = "Unknown Source";

            // Check for direct URL input first
            if (body.isUrl && body.url) {
                try {
                    // Use the provided URL directly
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

            // Run all AI analyses in parallel for better performance
            const [sourceDataRaw, sentimentDataRaw, factualityDataRaw, politicalDataRaw] = 
                await Promise.all([
                    // Get source analysis from AI using Perplexity
                    getSourceData(
                        geminiClient,
                        articleContent,
                        sourceDomain,
                        sourceName,
                    ),
                    // Get sentiment analysis data
                    getSentimentData(
                        geminiClient,
                        articleContent,
                        sourceDomain,
                        sourceName,
                    ),
                    // Get factuality analysis data using Perplexity
                    getFactualityData(
                        geminiClient,
                        articleContent,
                        sourceDomain,
                        sourceName,
                    ),
                    // Get political leaning analysis from AI
                    getPoliticalLeaningData(
                        geminiClient,
                        articleContent,
                        sourceDomain,
                        sourceName,
                    )
                ]);

            // Process source data
            if (!sourceDataRaw) {
                return NextResponse.json(
                    { error: "Failed to analyze source" },
                    { status: 500 },
                );
            }

            type SourceData = {
                name: string;
                url: string;
                reliability: string;
                bias: string;
                credibility: number;
                reasoning: string;
            };
            const sourceData = JSON.parse(sourceDataRaw) as SourceData;

            // Process sentiment data
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

            // Process factuality data
            if (!factualityDataRaw) {
                return NextResponse.json(
                    { error: "Failed to analyze factuality" },
                    { status: 500 },
                );
            }

            type FactualityData = {
                article: {
                    rating: number;
                    ratingLabel: string;
                    sources: string[];
                };
                source: {
                    rating: number;
                    ratingLabel: string;
                };
            };
            
            // Parse factuality data, ensuring we have a valid response
            let factualityData: FactualityData;
            try {
                factualityData = JSON.parse(
                    factualityDataRaw,
                ) as FactualityData;

                // Ensure sources is always an array
                if (!factualityData.article.sources) {
                    factualityData.article.sources = [];
                }
            } catch (error) {
                console.error("Error parsing factuality data:", error);
                factualityData = {
                    article: {
                        rating: 0.5,
                        ratingLabel: "Mixed Factuality",
                        sources: [],
                    },
                    source: {
                        rating: 0.5,
                        ratingLabel: "Mixed Factuality",
                    },
                };
            }

            // Process political leaning data
            let articlePoliticalScore = 50; // Default to center
            let articlePoliticalCategory = "Centrist";
            let articlePoliticalReasoning = "";
            let sourcePoliticalScore = 50; // Default to center
            let sourcePoliticalCategory = "Centrist";
            let sourcePoliticalReasoning = "";

            try {
                if (politicalDataRaw) {
                    type PoliticalData = {
                        article: {
                            score: number;
                            category: string;
                            reasoning: string;
                        };
                        source: {
                            score: number;
                            category: string;
                            reasoning: string;
                        };
                    };
                    const politicalData = JSON.parse(
                        politicalDataRaw,
                    ) as PoliticalData;

                    // Article political data
                    articlePoliticalScore = politicalData.article?.score ?? 50;
                    articlePoliticalCategory =
                        politicalData.article?.category ?? "Centrist";
                    articlePoliticalReasoning =
                        politicalData.article?.reasoning ?? "";

                    // Source political data
                    sourcePoliticalScore = politicalData.source?.score ?? 50;
                    sourcePoliticalCategory =
                        politicalData.source?.category ?? "Centrist";
                    sourcePoliticalReasoning =
                        politicalData.source?.reasoning ?? "";
                }
            } catch (error) {
                console.error("Political leaning analysis error:", error);
                // Continue with default values if political analysis fails
            }

            // Format the complete analysis results
            const analysisResults: AnalysisResults = {
                factuality: {
                    article: {
                        confidence: factualityData.article?.rating ?? 0.75,
                        sources: factualityData.article?.sources ?? [],
                        rating:
                            factualityData.article?.ratingLabel ??
                            getReliabilityRating(
                                factualityData.article?.rating ?? 0.75,
                            ),
                    },
                    source: {
                        confidence: factualityData.source?.rating ?? 0.7,
                        rating:
                            factualityData.source?.ratingLabel ??
                            getReliabilityRating(
                                factualityData.source?.rating ?? 0.7,
                            ),
                    },
                },
                source: {
                    name: sourceData.name,
                    url: sourceData.url,
                    reliability: sourceData.reliability,
                    bias: sourceData.bias,
                    credibility: sourceData.credibility,
                    reasoning: sourceData.reasoning,
                },
                politicalLeaning: {
                    article: {
                        score: articlePoliticalScore,
                        category: articlePoliticalCategory,
                        reasoning: articlePoliticalReasoning,
                    },
                    source: {
                        score: sourcePoliticalScore,
                        category: sourcePoliticalCategory,
                        reasoning: sourcePoliticalReasoning,
                    },
                },
                sentiment: {
                    overall: {
                        score: sentimentData.overall_score ?? 0,
                    },
                    entities: sentimentData.entities ?? [],
                },
            };

            //get all of the images
            const images: string[] = [];
            const markdown = /\!\[.*\]\((.*\))/;

            const matches =
                markdown.exec(articleMarkdown.replaceAll("\n", "")) ?? [];

            for (let i = 1; i < matches.length; i += 2) {
                images.push(matches[i] ?? "");
            }

            // Add the article content to the response
            const fullResponse = {
                ...analysisResults,
                article: {
                    title: extractTitle(body.content, body.isHtml),
                    content: articleMarkdown,
                    url: body.isUrl
                        ? body.url
                        : body.isHtml
                          ? sourceDomain
                          : undefined,
                },
                imageDescriptions: getImageDescriptions(geminiClient, images),
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