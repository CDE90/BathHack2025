import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { GoogleGenAI } from "@google/genai";
import type { AnalysisResults } from "@/lib/types/AnalysisResults";
import type { AnalysisRequest } from "@/lib/types/AnalysisRequest";
import { htmlToMarkdown, getSentimentData } from "./prompting";

const client = new OpenAI({
    apiKey: process.env.OPENAIKEY,
});

const geminiClient = new GoogleGenAI({
    apiKey: process.env.GeMiNi_kEy_ApI,
});

const factualityPrompt = `please search for similar articles,
and rate it between 0 and 1 on factuality. The response should be only json, in the format: 
{
    "rating":a number between 0 and 1,
    "sources":an array of the links to sources
}`;

export async function GET() {
    return NextResponse.json({ message: "Hello from the API!" });
}

export async function POST(request: Request) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const body: AnalysisRequest = await request.json();

        let articleBody: string;

        if (body.isHtml) {
            const markdownContent = await htmlToMarkdown(
                geminiClient,
                body.content,
            );

            if (!markdownContent) {
                return NextResponse.json({
                    error: "Failed to convert HTML to Markdown",
                });
            }
            articleBody = markdownContent;
        } else {
            articleBody = body.content;
        }

        //        const resp = await client.responses.create({
        //            model: "gpt-4o",
        //            instructions: body.isUrl ? "" : "",
        //            input: articleBody,
        //        });

        const resp = await geminiClient.models.generateContent({
            model: "gemini-2.0-flash-001",
            contents: factualityPrompt + articleBody,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        console.log(resp.text);

        const response: AnalysisResults = {
            factuality: {
                rating: "Mostly Factual",
                confidence: 0.85,
            },
            source: {
                name: "Example News",
                url: "example.com",
                reliability: "Reliable",
            },
            politicalLeaning: {
                rating: "Center-Left",
                score: 0.35, // 0-100 scale where 0 is far left, 50 is center, 100 is far right
            },
            sentiment: {
                overall: {
                    rating: "Neutral",
                    score: 0.2, // -1 to 1 scale
                },
                entities: [
                    { name: "President Smith", score: 0.7 },
                    { name: "New Policy", score: -0.5 },
                    { name: "Economic Reform", score: 0.3 },
                    { name: "Opposition Party", score: -0.6 },
                ],
            },
        };

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        response.sentiment = JSON.parse(
            await getSentimentData(geminiClient, articleBody),
        );

        return NextResponse.json(response);
    } catch (error) {
        return NextResponse.json(
            { error: `Failed to parse request body ${error as string}` },
            { status: 400 },
        );
    }
}
