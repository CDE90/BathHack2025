"use client";

import type React from "react";

import { ArticleRenderer } from "@/app/article-renderer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AnalysisResults } from "@/lib/types/AnalysisResults";
import {
    AlertCircle,
    Check,
    ExternalLink,
    Info,
    Loader2,
    Scale,
} from "lucide-react";
import { useState, useEffect } from "react";

interface ExtendedAnalysisResults extends AnalysisResults {
    article?: {
        title: string;
        content: string;
        url?: string;
    };
}

// Component for realistic progress bar animation
function AnimatedProgress() {
    const [progress, setProgress] = useState(15);
    
    useEffect(() => {
        // Initial jumps to simulate fast initial processing
        const timer1 = setTimeout(() => setProgress(35), 800);
        const timer2 = setTimeout(() => setProgress(42), 1600);
        
        // Slower increments to simulate real processing work
        const interval = setInterval(() => {
            setProgress(prev => {
                // Gradually slow down as we approach higher percentages
                if (prev < 50) return prev + 3;
                if (prev < 70) return prev + 2;
                if (prev < 85) return prev + 0.8;
                if (prev < 95) return prev + 0.3;
                // Cap at 95% - the last 5% happens when actual results arrive
                return 95;
            });
        }, 900);
        
        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearInterval(interval);
        };
    }, []);
    
    return <Progress value={progress} className="h-2 w-[250px]" />;
}

export default function NewsAnalyzer() {
    // Always use URL input type
    const inputType = "url";
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isValidUrl, setIsValidUrl] = useState(true);
    const [results, setResults] = useState<ExtendedAnalysisResults | null>(
        null,
    );
    const [activeTab, setActiveTab] = useState<"analysis" | "article">(
        "analysis",
    );

    // URL validation function
    const validateUrl = (url: string) => {
        if (!url.trim()) return true; // Empty is OK, we'll check before submit
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!inputValue.trim()) {
            setError("Please enter a URL to evaluate");
            return;
        }

        if (!validateUrl(inputValue)) {
            setError(
                "Please enter a valid URL that starts with http:// or https://",
            );
            setIsValidUrl(false);
            return;
        }

        setIsLoading(true);

        // Make the API call with the URL
        try {
            const analysisRequest = {
                content: inputValue, // Send the URL itself
                isHtml: true,
                isUrl: true,
                url: inputValue,
            };
            console.log("Sending URL for evaluation:", inputValue);

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
            setError(
                "Failed to evaluate the article. Please check the URL and try again.",
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="container mx-auto max-w-6xl space-y-6 px-4 py-6">
            <header className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <h1 className="text-4xl font-bold tracking-tight">
                    The Credibility Compass{" "}
                    <span className="text-muted-foreground text-lg font-normal">
                        News Evaluation Tool
                    </span>
                </h1>

                <div className="flex items-center gap-3">
                    <span className="text-muted-foreground mr-2 text-sm">
                        Powered by AI
                    </span>
                    <span className="inline-block rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-1">
                        <span className="bg-background block rounded-full px-2 py-1 text-xs font-medium">
                            BETA
                        </span>
                    </span>
                    <ModeToggle />
                </div>
            </header>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Input Section */}
                <Card className="h-fit lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Navigate the News</CardTitle>
                        <CardDescription>
                            Enter a news article URL to evaluate its
                            credibility, factual accuracy, bias, and political
                            orientation.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="article-url">Article URL</Label>
                                <Input
                                    id="article-url"
                                    type="url"
                                    placeholder="Enter a news article URL (e.g., https://news-site.com/article)"
                                    value={inputValue}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setInputValue(value);
                                        setIsValidUrl(validateUrl(value));
                                    }}
                                    className={`w-full ${!isValidUrl ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                                    required
                                />
                                {!isValidUrl && (
                                    <p className="mt-1 text-xs text-red-500">
                                        Please enter a valid URL (must start
                                        with http:// or https://)
                                    </p>
                                )}
                            </div>

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
                                        Evaluating...
                                    </>
                                ) : (
                                    "Evaluate Article"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="text-muted-foreground text-xs">
                        The Credibility Compass evaluates news articles from
                        URLs for factual accuracy, political leaning, source
                        credibility, and sentiment. Results are provided for
                        educational purposes.
                    </CardFooter>
                </Card>

                {/* Guidance Card - Only visible on large screens when no results */}
                {!results && !isLoading && (
                    <Card className="flex-col lg:col-span-2 lg:flex">
                        <CardHeader className="bg-muted/30">
                            <CardTitle>The Credibility Compass</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-1 flex-col justify-center p-8">
                            <div className="space-y-6 text-center">
                                <div className="bg-muted mx-auto flex h-20 w-20 items-center justify-center rounded-full">
                                    <Scale className="text-primary h-10 w-10" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-semibold">
                                        Analyze Any News Article
                                    </h3>
                                    <p className="text-muted-foreground">
                                        Enter a URL in the form to the left to
                                        get started. We&apos;ll analyze the
                                        article for:
                                    </p>
                                    <ul className="text-muted-foreground mx-auto mt-4 max-w-xs space-y-2 text-left">
                                        <li className="flex items-start">
                                            <Check className="mt-0.5 mr-2 h-5 w-5 text-green-500" />
                                            <span>
                                                Factual accuracy and supporting
                                                evidence
                                            </span>
                                        </li>
                                        <li className="flex items-start">
                                            <Info className="mt-0.5 mr-2 h-5 w-5 text-blue-500" />
                                            <span>
                                                Source reliability and
                                                credibility
                                            </span>
                                        </li>
                                        <li className="flex items-start">
                                            <Scale className="mt-0.5 mr-2 h-5 w-5 text-purple-500" />
                                            <span>
                                                Political bias and orientation
                                            </span>
                                        </li>
                                        <li className="flex items-start">
                                            <AlertCircle className="mt-0.5 mr-2 h-5 w-5 text-yellow-500" />
                                            <span>
                                                Sentiment analysis of key
                                                entities
                                            </span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/10 justify-center p-6">
                            <p className="text-muted-foreground text-center text-sm">
                                Paste any news article URL to get a
                                comprehensive analysis of its credibility and
                                learn how to navigate today&apos;s complex media
                                landscape.
                            </p>
                        </CardFooter>
                    </Card>
                )}

                {/* Results Section */}
                {isLoading ? (
                    <Card className="lg:col-span-2">
                        <CardContent className="flex min-h-[300px] flex-col items-center justify-center">
                            <div className="space-y-6 text-center">
                                <Loader2 className="text-primary mx-auto h-10 w-10 animate-spin" />
                                <div className="space-y-2">
                                    <p className="text-lg">
                                        Evaluating article credibility...
                                    </p>
                                    <p className="text-muted-foreground text-sm">
                                        This may take a few moments
                                    </p>
                                </div>
                                <AnimatedProgress />
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
                                                {/* Article Factuality */}
                                                <div className="space-y-3">
                                                    <h3 className="text-base font-medium">
                                                        Article:
                                                    </h3>
                                                    <span
                                                        className={`inline-block rounded-md px-2 py-1 text-base font-medium ${
                                                            results.factuality
                                                                .article
                                                                .rating ===
                                                                "Very Factual" ||
                                                            results.factuality
                                                                .article
                                                                .rating ===
                                                                "Mostly Factual"
                                                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                                                : results
                                                                        .factuality
                                                                        .article
                                                                        .rating ===
                                                                    "Mixed Factuality"
                                                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
                                                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                                        }`}
                                                    >
                                                        {
                                                            results.factuality
                                                                .article.rating
                                                        }
                                                    </span>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span>
                                                                Confidence
                                                            </span>
                                                            <span className="font-medium">
                                                                {Math.round(
                                                                    results
                                                                        .factuality
                                                                        .article
                                                                        .confidence *
                                                                        100,
                                                                )}
                                                                %
                                                            </span>
                                                        </div>
                                                        <Progress
                                                            value={
                                                                results
                                                                    .factuality
                                                                    .article
                                                                    .confidence *
                                                                100
                                                            }
                                                            className="h-2"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Source Factuality */}
                                                <div className="space-y-3 border-t pt-2">
                                                    <h3 className="text-base font-medium">
                                                        Source:
                                                    </h3>
                                                    <span
                                                        className={`inline-block rounded-md px-2 py-1 text-base font-medium ${
                                                            results.factuality
                                                                .source
                                                                .rating ===
                                                                "Very Factual" ||
                                                            results.factuality
                                                                .source
                                                                .rating ===
                                                                "Mostly Factual"
                                                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                                                : results
                                                                        .factuality
                                                                        .source
                                                                        .rating ===
                                                                    "Mixed Factuality"
                                                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
                                                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                                        }`}
                                                    >
                                                        {
                                                            results.factuality
                                                                .source.rating
                                                        }
                                                    </span>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span>
                                                                Confidence
                                                            </span>
                                                            <span className="font-medium">
                                                                {Math.round(
                                                                    results
                                                                        .factuality
                                                                        .source
                                                                        .confidence *
                                                                        100,
                                                                )}
                                                                %
                                                            </span>
                                                        </div>
                                                        <Progress
                                                            value={
                                                                results
                                                                    .factuality
                                                                    .source
                                                                    .confidence *
                                                                100
                                                            }
                                                            className="h-2"
                                                        />
                                                    </div>
                                                </div>

                                                {results.factuality.article
                                                    .sources &&
                                                    results.factuality.article
                                                        .sources.length > 0 && (
                                                        <div className="mt-2 border-t pt-2">
                                                            <h4 className="mb-1 text-sm font-medium">
                                                                Supporting
                                                                Sources:
                                                            </h4>
                                                            <ul className="text-muted-foreground space-y-1 text-xs">
                                                                {results.factuality.article.sources.map(
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
                                            <div className="flex flex-col gap-2">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">
                                                            Name:
                                                        </span>
                                                        <span className="text-sm">
                                                            {
                                                                results.source
                                                                    .name
                                                            }
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">
                                                            URL:
                                                        </span>
                                                        <a
                                                            href={
                                                                inputType ===
                                                                "url"
                                                                    ? inputValue
                                                                    : results
                                                                          .source
                                                                          .url
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm hover:underline"
                                                        >
                                                            {
                                                                new URL(
                                                                    inputType ===
                                                                    "url"
                                                                        ? inputValue
                                                                        : results.source.url.startsWith(
                                                                                "http",
                                                                            )
                                                                          ? results
                                                                                .source
                                                                                .url
                                                                          : inputValue,
                                                                ).hostname
                                                            }
                                                        </a>
                                                    </div>
                                                </div>

                                                {/* Reliability Section */}
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">
                                                            Reliability:
                                                        </span>
                                                        <span
                                                            className={`flex items-center justify-center gap-1 rounded-md px-2 py-1 text-sm font-medium ${
                                                                results.source
                                                                    .reliability ===
                                                                "Very Reliable"
                                                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                                                    : results
                                                                            .source
                                                                            .reliability ===
                                                                        "Reliable"
                                                                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                                                      : results
                                                                              .source
                                                                              .reliability ===
                                                                          "Mostly Reliable"
                                                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                                                        : results
                                                                                .source
                                                                                .reliability ===
                                                                            "Mixed Reliability"
                                                                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
                                                                          : results
                                                                                  .source
                                                                                  .reliability ===
                                                                              "Somewhat Unreliable"
                                                                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
                                                                            : results
                                                                                    .source
                                                                                    .reliability ===
                                                                                "Unreliable"
                                                                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                                                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                                                            }`}
                                                        >
                                                            {
                                                                results.source
                                                                    .reliability
                                                            }
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">
                                                            Bias:
                                                        </span>
                                                        <span
                                                            className={`flex items-center justify-center gap-1 rounded-md px-2 py-1 text-sm font-medium ${
                                                                results.source
                                                                    .bias ===
                                                                "None"
                                                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                                                    : results
                                                                            .source
                                                                            .bias ===
                                                                        "Biased"
                                                                      ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                                                                      : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                                                            }`}
                                                        >
                                                            {
                                                                results.source
                                                                    .bias
                                                            }
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Credibility Section */}
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">
                                                            Credibility:
                                                        </span>
                                                        <span className="text-sm">
                                                            {/* {results.source.credibility.toFixed(
                                                                2,
                                                            )} */}
                                                            {new Number(
                                                                results.source.credibility,
                                                            ).toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div className="bg-muted relative h-2 w-full overflow-hidden rounded-full">
                                                        {/* Center line */}
                                                        <div className="absolute left-1/2 h-full w-0.5 -translate-x-1/2 transform bg-gray-300 dark:bg-gray-700"></div>

                                                        {/* Credibility indicator */}
                                                        <div
                                                            className={`absolute h-full rounded-full ${
                                                                results.source
                                                                    .credibility >
                                                                0.5
                                                                    ? "bg-green-400 dark:bg-green-600"
                                                                    : results
                                                                            .source
                                                                            .credibility >
                                                                        0.25
                                                                      ? "bg-amber-400 dark:bg-amber-600"
                                                                      : "bg-red-400 dark:bg-red-600"
                                                            }`}
                                                            style={{
                                                                width: "20%", // Constant width of 0.2 units
                                                                left: `${results.source.credibility * 100 - 10}%`, // Center on score (-1 to 1 scale mapped to 0-100%)
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>

                                                {results.source.reasoning && (
                                                    <div className="mt-4 border-t pt-3">
                                                        <h4 className="text-muted-foreground mb-1 text-sm font-medium">
                                                            Source Analysis:
                                                        </h4>
                                                        <p className="text-muted-foreground text-xs">
                                                            {
                                                                results.source
                                                                    .reasoning
                                                            }
                                                        </p>
                                                    </div>
                                                )}
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
                                        <div className="space-y-6">
                                            {/* Article Political Leaning */}
                                            <div className="space-y-4">
                                                <h3 className="text-base font-medium">
                                                    Article:
                                                </h3>
                                                <div>
                                                    {(() => {
                                                        const category =
                                                            results
                                                                .politicalLeaning
                                                                .article
                                                                .category ??
                                                            (results
                                                                .politicalLeaning
                                                                .article.score <
                                                            21
                                                                ? "Far Left"
                                                                : results
                                                                        .politicalLeaning
                                                                        .article
                                                                        .score <
                                                                    41
                                                                  ? "Center-Left"
                                                                  : results
                                                                          .politicalLeaning
                                                                          .article
                                                                          .score <
                                                                      61
                                                                    ? "Centrist"
                                                                    : results
                                                                            .politicalLeaning
                                                                            .article
                                                                            .score <
                                                                        81
                                                                      ? "Center-Right"
                                                                      : "Far Right");

                                                        let bgClass = "";
                                                        if (
                                                            category ===
                                                            "Far Left"
                                                        ) {
                                                            bgClass =
                                                                "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300";
                                                        } else if (
                                                            category ===
                                                            "Center-Left"
                                                        ) {
                                                            bgClass =
                                                                "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
                                                        } else if (
                                                            category ===
                                                            "Centrist"
                                                        ) {
                                                            bgClass =
                                                                "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
                                                        } else if (
                                                            category ===
                                                            "Center-Right"
                                                        ) {
                                                            bgClass =
                                                                "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
                                                        } else if (
                                                            category ===
                                                            "Far Right"
                                                        ) {
                                                            bgClass =
                                                                "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
                                                        }

                                                        return (
                                                            <span
                                                                className={`inline-block rounded-md px-3 py-1 text-base font-medium ${bgClass}`}
                                                            >
                                                                {category}
                                                            </span>
                                                        );
                                                    })()}
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
                                                                left: `${results.politicalLeaning.article.score}%`,
                                                            }}
                                                        ></div>
                                                        <div className="bg-border absolute top-0 left-1/2 h-3 w-[1px]"></div>
                                                    </div>
                                                </div>

                                                {results.politicalLeaning
                                                    .article.reasoning && (
                                                    <div className="text-muted-foreground mt-2 text-sm">
                                                        <h4 className="mb-1 font-medium">
                                                            Analysis:
                                                        </h4>
                                                        <p>
                                                            {
                                                                results
                                                                    .politicalLeaning
                                                                    .article
                                                                    .reasoning
                                                            }
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Source Political Leaning */}
                                            <div className="space-y-4 border-t pt-4">
                                                <h3 className="text-base font-medium">
                                                    Source:
                                                </h3>
                                                <div>
                                                    {(() => {
                                                        const category =
                                                            results
                                                                .politicalLeaning
                                                                .source
                                                                .category ??
                                                            (results
                                                                .politicalLeaning
                                                                .source.score <
                                                            21
                                                                ? "Far Left"
                                                                : results
                                                                        .politicalLeaning
                                                                        .source
                                                                        .score <
                                                                    41
                                                                  ? "Center-Left"
                                                                  : results
                                                                          .politicalLeaning
                                                                          .source
                                                                          .score <
                                                                      61
                                                                    ? "Centrist"
                                                                    : results
                                                                            .politicalLeaning
                                                                            .source
                                                                            .score <
                                                                        81
                                                                      ? "Center-Right"
                                                                      : "Far Right");

                                                        let bgClass = "";
                                                        if (
                                                            category ===
                                                            "Far Left"
                                                        ) {
                                                            bgClass =
                                                                "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300";
                                                        } else if (
                                                            category ===
                                                            "Center-Left"
                                                        ) {
                                                            bgClass =
                                                                "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
                                                        } else if (
                                                            category ===
                                                            "Centrist"
                                                        ) {
                                                            bgClass =
                                                                "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
                                                        } else if (
                                                            category ===
                                                            "Center-Right"
                                                        ) {
                                                            bgClass =
                                                                "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
                                                        } else if (
                                                            category ===
                                                            "Far Right"
                                                        ) {
                                                            bgClass =
                                                                "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
                                                        }

                                                        return (
                                                            <span
                                                                className={`inline-block rounded-md px-3 py-1 text-base font-medium ${bgClass}`}
                                                            >
                                                                {category}
                                                            </span>
                                                        );
                                                    })()}
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
                                                                left: `${results.politicalLeaning.source.score}%`,
                                                            }}
                                                        ></div>
                                                        <div className="bg-border absolute top-0 left-1/2 h-3 w-[1px]"></div>
                                                    </div>
                                                </div>

                                                {results.politicalLeaning.source
                                                    .reasoning && (
                                                    <div className="text-muted-foreground mt-2 text-sm">
                                                        <h4 className="mb-1 font-medium">
                                                            Analysis:
                                                        </h4>
                                                        <p>
                                                            {
                                                                results
                                                                    .politicalLeaning
                                                                    .source
                                                                    .reasoning
                                                            }
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Sentiment Analysis Section */}
                                <Card className="overflow-hidden">
                                    <CardHeader className="bg-muted/30 pb-2">
                                        <div className="flex items-center">
                                            <AlertCircle className="mr-2 h-5 w-5 text-yellow-500" />
                                            <CardTitle className="text-base">
                                                Sentiment Analysis
                                            </CardTitle>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <div className="space-y-6">
                                            {/* Overall Sentiment */}
                                            <div>
                                                <h3 className="text-muted-foreground mb-3 text-sm font-medium">
                                                    Overall Sentiment
                                                </h3>
                                                <div className="mb-1.5 flex items-center justify-between">
                                                    <span
                                                        className={`inline-block rounded-md px-2 py-1 text-sm font-medium ${
                                                            results.sentiment
                                                                .overall.score >
                                                            0.2
                                                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                                                : results
                                                                        .sentiment
                                                                        .overall
                                                                        .score <
                                                                    -0.2
                                                                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                                                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                                                        }`}
                                                    >
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
                                                                ? "bg-green-400 dark:bg-green-600"
                                                                : results
                                                                        .sentiment
                                                                        .overall
                                                                        .score <
                                                                    -0.2
                                                                  ? "bg-red-400 dark:bg-red-600"
                                                                  : "bg-gray-400 dark:bg-gray-600"
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
                                                                        className={`absolute h-full rounded-full ${entity.score > 0.2 ? "bg-green-500" : entity.score < -0.2 ? "bg-red-500" : "bg-gray-500"}`}
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
                                                sourceDomain={
                                                    results.source.url
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
