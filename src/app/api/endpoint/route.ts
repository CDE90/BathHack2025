import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { GoogleGenAI } from "@google/genai";
import type { AnalysisResults } from "@/lib/types/AnalysisResults";
import type { AnalysisRequest } from "@/lib/types/AnalysisRequest";

const client = new OpenAI({
    apiKey: process.env.OPENAIKEY,
});

const geminiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
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

        if (body.isUrl) {
            const data = await fetch(body.value);
            // articleBody = (await data.body?.getReader().read())?.value as string;
            articleBody = await data.text();
            console.log(articleBody);
        } else {
        }
        articleBody = body.value;

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

        return NextResponse.json({
            message: "Data received!",
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            data: resp.text,
        });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        return NextResponse.json(
            { error: `Failed to parse request body ${error as string}` },
            { status: 400 },
        );
    }
}
