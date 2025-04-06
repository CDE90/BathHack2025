"use client";

import type React from "react";

import { useState } from "react";
import {
    AlertCircle,
    Check,
    ExternalLink,
    Info,
    Loader2,
    Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import type { AnalysisResults } from "@/lib/types/AnalysisResults";
import { ArticleRenderer } from "@/app/article-renderer";

interface ExtendedAnalysisResults extends AnalysisResults {
    article?: {
        title: string;
        content: string;
        url?: string;
    };
}

export default function NewsAnalyzer() {
    const [inputType, setInputType] = useState<"url" | "text">("url");
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<ExtendedAnalysisResults | null>(
        null,
    );
    const [activeTab, setActiveTab] = useState<"analysis" | "article">(
        "analysis",
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!inputValue.trim()) {
            setError("Please enter a URL or text to analyze");
            return;
        }

        setIsLoading(true);

        // Make the API call directly, sending either the URL or text content
        try {
            let analysisRequest;

            if (inputType === "url") {
                // For URLs, send the URL directly
                analysisRequest = {
                    content: inputValue, // Send the URL itself
                    isHtml: true,
                    isUrl: true,
                    url: inputValue,
                };
                console.log("Sending URL for analysis:", inputValue);
            } else {
                // For plain text
                analysisRequest = {
                    content: inputValue,
                    isHtml: false,
                };
            }

            // Make the API call
            const response = await fetch("/api/endpoint", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(analysisRequest),
            });

            if (!response.ok) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const errorData = await response.json();
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                throw new Error(errorData.error ?? "Failed to analyze content");
            }

            const data = (await response.json()) as ExtendedAnalysisResults;
            console.log("Analysis results received");

            setResults(data);
        } catch (error: unknown) {
            console.error(error);
            setError("Failed to analyze the article. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="container mx-auto max-w-6xl space-y-6 px-4 py-6">
            <header className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <h1 className="text-4xl font-bold tracking-tight">
                    News Article Analyzer
                </h1>

                <div className="flex items-center">
                    <span className="text-muted-foreground mr-2 text-sm">
                        Powered by AI
                    </span>
                    <span className="inline-block rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-1">
                        <span className="bg-background block rounded-full px-2 py-1 text-xs font-medium">
                            BETA
                        </span>
                    </span>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Input Section */}
                <Card className="h-fit lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Enter News Article</CardTitle>
                        <CardDescription>
                            Paste a URL or the full text of a news article to
                            analyze its factuality, bias, and sentiment.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Tabs
                                defaultValue="url"
                                onValueChange={(value) =>
                                    setInputType(value as "url" | "text")
                                }
                            >
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="url">URL</TabsTrigger>
                                    <TabsTrigger value="text">Text</TabsTrigger>
                                </TabsList>
                                <TabsContent value="url" className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="article-url">
                                            Article URL
                                        </Label>
                                        <Input
                                            id="article-url"
                                            placeholder="https://example.com/news/article"
                                            value={inputValue}
                                            onChange={(e) =>
                                                setInputValue(e.target.value)
                                            }
                                            className="w-full"
                                        />
                                    </div>
                                </TabsContent>
                                <TabsContent value="text" className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="article-text">
                                            Article Text
                                        </Label>
                                        <Textarea
                                            id="article-text"
                                            placeholder="Paste the full text of the article here..."
                                            className="min-h-[150px]"
                                            value={inputValue}
                                            onChange={(e) =>
                                                setInputValue(e.target.value)
                                            }
                                        />
                                    </div>
                                </TabsContent>
                            </Tabs>

                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading}
                                variant="default"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    "Analyze Article"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="text-muted-foreground text-xs">
                        This tool analyzes news articles for factuality,
                        political bias, and sentiment. Results are provided for
                        educational purposes.
                    </CardFooter>
                </Card>

                {/* Results Section */}
                {isLoading ? (
                    <Card className="lg:col-span-2">
                        <CardContent className="flex min-h-[300px] flex-col items-center justify-center">
                            <div className="space-y-6 text-center">
                                <Loader2 className="text-primary mx-auto h-10 w-10 animate-spin" />
                                <div className="space-y-2">
                                    <p className="text-lg">
                                        Analyzing article content...
                                    </p>
                                    <p className="text-muted-foreground text-sm">
                                        This may take a few moments
                                    </p>
                                </div>
                                <Progress
                                    value={45}
                                    className="h-2 w-[250px]"
                                />
                            </div>
                        </CardContent>
                    </Card>
                ) : results ? (
                    <div className="space-y-6 lg:col-span-2">
                        <Tabs
                            value={activeTab}
                            className="w-full"
                            onValueChange={(value) =>
                                setActiveTab(value as "analysis" | "article")
                            }
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <TabsList>
                                    <TabsTrigger value="analysis">
                                        Analysis
                                    </TabsTrigger>
                                    <TabsTrigger value="article">
                                        Article
                                    </TabsTrigger>
                                </TabsList>

                                {results.article?.url && (
                                    <a
                                        href={
                                            results.article.url.startsWith(
                                                "http",
                                            )
                                                ? results.article.url
                                                : `https://${results.article.url}`
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary flex items-center gap-1 text-sm hover:underline"
                                    >
                                        Source{" "}
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                )}
                            </div>

                            <TabsContent
                                value="analysis"
                                className="mt-0 space-y-6"
                            >
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    {/* Factuality Section */}
                                    <Card className="overflow-hidden">
                                        <CardHeader className="bg-muted/30 pb-2">
                                            <div className="flex items-center">
                                                <Check className="mr-2 h-5 w-5 text-green-500" />
                                                <CardTitle className="text-base">
                                                    Factuality
                                                </CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-4">
                                            <div className="flex flex-col gap-4">
                                                <span className="text-xl font-semibold">
                                                    {results.factuality.rating}
                                                </span>
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span>Confidence</span>
                                                        <span className="font-medium">
                                                            {results.factuality
                                                                .confidence *
                                                                100}
                                                            %
                                                        </span>
                                                    </div>
                                                    <Progress
                                                        value={
                                                            results.factuality
                                                                .confidence *
                                                            100
                                                        }
                                                        className="h-2"
                                                    />
                                                </div>
                                                {results.factuality.sources &&
                                                    results.factuality.sources
                                                        .length > 0 && (
                                                        <div className="mt-2">
                                                            <h4 className="mb-1 text-sm font-medium">
                                                                Sources:
                                                            </h4>
                                                            <ul className="text-muted-foreground space-y-1 text-xs">
                                                                {results.factuality.sources.map(
                                                                    (
                                                                        source,
                                                                        index,
                                                                    ) => (
                                                                        <li
                                                                            key={
                                                                                index
                                                                            }
                                                                            className="flex items-center"
                                                                        >
                                                                            <span className="mr-1">
                                                                                •
                                                                            </span>
                                                                            {source.startsWith(
                                                                                "http",
                                                                            ) ? (
                                                                                <a
                                                                                    href={
                                                                                        source
                                                                                    }
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="text-primary truncate hover:underline"
                                                                                >
                                                                                    {
                                                                                        new URL(
                                                                                            source,
                                                                                        )
                                                                                            .hostname
                                                                                    }
                                                                                </a>
                                                                            ) : (
                                                                                <span className="truncate">
                                                                                    {
                                                                                        source
                                                                                    }
                                                                                </span>
                                                                            )}
                                                                        </li>
                                                                    ),
                                                                )}
                                                            </ul>
                                                        </div>
                                                    )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Source Section */}
                                    <Card className="overflow-hidden">
                                        <CardHeader className="bg-muted/30 pb-2">
                                            <div className="flex items-center">
                                                <Info className="mr-2 h-5 w-5 text-blue-500" />
                                                <CardTitle className="text-base">
                                                    Source
                                                </CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-4">
                                            <div className="flex flex-col gap-4">
                                                <div>
                                                    <span className="text-xl font-semibold">
                                                        {results.source.name}
                                                    </span>
                                                    <div className="text-muted-foreground text-sm">
                                                        {results.source.url}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                                        {
                                                            results.source
                                                                .reliability
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Political Leaning Section */}
                                <Card className="overflow-hidden">
                                    <CardHeader className="bg-muted/30 pb-2">
                                        <div className="flex items-center">
                                            <Scale className="mr-2 h-5 w-5 text-purple-500" />
                                            <CardTitle className="text-base">
                                                Political Leaning
                                            </CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <div className="space-y-4">
                                            <div className="text-xl font-semibold">
                                                {results.politicalLeaning
                                                    .category ??
                                                    (results.politicalLeaning
                                                        .score < 21
                                                        ? "Far Left"
                                                        : results
                                                                .politicalLeaning
                                                                .score < 41
                                                          ? "Center-Left"
                                                          : results
                                                                  .politicalLeaning
                                                                  .score < 61
                                                            ? "Centrist"
                                                            : results
                                                                    .politicalLeaning
                                                                    .score < 81
                                                              ? "Center-Right"
                                                              : "Far Right")}
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-muted-foreground flex justify-between text-xs">
                                                    <span>Left</span>
                                                    <span>Center</span>
                                                    <span>Right</span>
                                                </div>
                                                <div className="bg-muted relative h-3 rounded-full">
                                                    <div
                                                        className="bg-primary absolute top-0 h-3 w-1 -translate-x-1/2 transform rounded-full"
                                                        style={{
                                                            left: `${results.politicalLeaning.score}%`,
                                                        }}
                                                    ></div>
                                                    <div className="bg-border absolute top-0 left-1/2 h-3 w-[1px]"></div>
                                                </div>
                                            </div>

                                            {results.politicalLeaning
                                                .reasoning && (
                                                <div className="text-muted-foreground mt-4 text-sm">
                                                    <h4 className="mb-1 font-medium">
                                                        Analysis:
                                                    </h4>
                                                    <p>
                                                        {
                                                            results
                                                                .politicalLeaning
                                                                .reasoning
                                                        }
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Sentiment Analysis Section */}
                                <Card className="overflow-hidden">
                                    <CardHeader className="bg-muted/30 pb-2">
                                        <CardTitle className="text-base">
                                            Sentiment Analysis
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <div className="space-y-6">
                                            {/* Overall Sentiment */}
                                            <div>
                                                <h3 className="text-muted-foreground mb-3 text-sm font-medium">
                                                    Overall Sentiment
                                                </h3>
                                                <div className="mb-1.5 flex items-center justify-between">
                                                    <span className="text-base">
                                                        {results.sentiment
                                                            .overall.score > 0.2
                                                            ? "Positive"
                                                            : results.sentiment
                                                                    .overall
                                                                    .score <
                                                                -0.2
                                                              ? "Negative"
                                                              : "Neutral"}
                                                    </span>
                                                    <span className="text-muted-foreground text-sm">
                                                        Score:{" "}
                                                        {results.sentiment.overall.score.toFixed(
                                                            1,
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="bg-muted relative h-2 w-full overflow-hidden rounded-full">
                                                    {/* Center line */}
                                                    <div className="absolute left-1/2 h-full w-0.5 -translate-x-1/2 transform bg-gray-300 dark:bg-gray-700"></div>

                                                    {/* Sentiment indicator */}
                                                    <div
                                                        className={`absolute h-full rounded-full ${
                                                            results.sentiment
                                                                .overall.score >
                                                            0.2
                                                                ? "bg-green-500"
                                                                : results
                                                                        .sentiment
                                                                        .overall
                                                                        .score <
                                                                    -0.2
                                                                  ? "bg-red-500"
                                                                  : "bg-gray-500"
                                                        }`}
                                                        style={{
                                                            width: "20%", // Constant width of 0.2 units
                                                            left: `${(results.sentiment.overall.score + 1) * 50 - 10}%`, // Center on score (-1 to 1 scale mapped to 0-100%)
                                                        }}
                                                    ></div>
                                                </div>
                                                <div className="text-muted-foreground mt-1 flex justify-between text-xs">
                                                    <span>Negative</span>
                                                    <span>Neutral</span>
                                                    <span>Positive</span>
                                                </div>
                                            </div>

                                            {/* Entity Sentiment */}
                                            <div>
                                                <h3 className="text-muted-foreground mb-3 text-sm font-medium">
                                                    Entity Sentiment
                                                </h3>
                                                <div className="space-y-3">
                                                    {results.sentiment.entities.map(
                                                        (entity, index) => (
                                                            <div key={index}>
                                                                <div className="mb-1 flex items-center justify-between">
                                                                    <span className="text-sm font-medium">
                                                                        {
                                                                            entity.name
                                                                        }
                                                                    </span>
                                                                    <span className="text-muted-foreground text-xs">
                                                                        {entity.score.toFixed(
                                                                            1,
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <div className="bg-muted relative h-2 w-full overflow-hidden rounded-full">
                                                                    {/* Center line */}
                                                                    <div className="absolute left-1/2 h-full w-0.5 -translate-x-1/2 transform bg-gray-300 dark:bg-gray-700"></div>

                                                                    {/* Entity sentiment indicator */}
                                                                    <div
                                                                        className={`absolute h-full rounded-full ${entity.score > 0 ? "bg-green-500" : "bg-red-500"}`}
                                                                        style={{
                                                                            width: "20%", // Constant width of 0.2 units
                                                                            left: `${(entity.score + 1) * 50 - 10}%`, // Center on score (-1 to 1 scale mapped to 0-100%)
                                                                        }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="article" className="mt-0">
                                <Card>
                                    <CardHeader className="bg-muted/30">
                                        <CardTitle>
                                            {results.article?.title ??
                                                "Article Content"}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        {results.article?.content ? (
                                            <ArticleRenderer
                                                content={
                                                    results.article.content
                                                }
                                                entities={
                                                    results.sentiment.entities
                                                }
                                            />
                                        ) : (
                                            <p className="text-muted-foreground">
                                                No article content available.
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                ) : null}
            </div>
        </main>
    );
}
