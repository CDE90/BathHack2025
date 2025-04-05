"use client";

import type React from "react";

import { useState } from "react";
import { AlertCircle, Check, Info, Loader2, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function NewsAnalyzer() {
    const [inputType, setInputType] = useState<"url" | "text">("url");
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<AnalysisResults | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!inputValue.trim()) {
            setError("Please enter a URL or text to analyze");
            return;
        }

        setIsLoading(true);

        // Simulate API call with timeout
        try {
            // In a real application, this would be an API call
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Example data - in a real app, this would come from the API
            setResults({
                factuality: {
                    rating: "Mostly Factual",
                    confidence: 85,
                },
                source: {
                    name: "Example News",
                    url: "example.com",
                    reliability: "Reliable",
                },
                politicalLeaning: {
                    rating: "Center-Left",
                    score: 35, // 0-100 scale where 0 is far left, 50 is center, 100 is far right
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
            });
        } catch (err) {
            setError("Failed to analyze the article. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="container mx-auto max-w-4xl px-4 py-8">
            <h1 className="mb-8 text-center text-3xl font-bold">
                News Article Analyzer
            </h1>

            <Card>
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
            </Card>

            {isLoading && (
                <Card className="mt-8">
                    <CardContent className="pt-6">
                        <div className="space-y-4 text-center">
                            <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                            <p>Analyzing article content...</p>
                            <Progress value={45} className="h-2" />
                        </div>
                    </CardContent>
                </Card>
            )}

            {results && !isLoading && (
                <div className="mt-8 space-y-6">
                    <h2 className="text-2xl font-bold">Analysis Results</h2>

                    {/* Factuality Section */}
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center">
                                <Check className="mr-2 h-5 w-5 text-green-500" />
                                <CardTitle>Factuality</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-medium">
                                    {results.factuality.rating}
                                </span>
                                <div className="flex items-center">
                                    <span className="mr-2">Confidence:</span>
                                    <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-200">
                                        <div
                                            className="h-full rounded-full bg-green-500"
                                            style={{
                                                width: `${results.factuality.confidence}%`,
                                            }}
                                        ></div>
                                    </div>
                                    <span className="ml-2">
                                        {results.factuality.confidence}%
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Source Section */}
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center">
                                <Info className="mr-2 h-5 w-5 text-blue-500" />
                                <CardTitle>Source</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <a
                                        href={`https://${results.source.url}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-lg font-medium text-blue-600 hover:underline"
                                    >
                                        {results.source.name} (
                                        {results.source.url})
                                    </a>
                                </div>
                                <div className="mt-2 sm:mt-0">
                                    <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-800">
                                        Rated: {results.source.reliability}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Political Leaning Section */}
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center">
                                <Scale className="mr-2 h-5 w-5 text-purple-500" />
                                <CardTitle>Political Leaning</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between text-sm text-gray-500">
                                    <span>Left</span>
                                    <span>Center</span>
                                    <span>Right</span>
                                </div>
                                <div className="relative h-2 rounded-full bg-gray-200">
                                    <div
                                        className="absolute top-0 -mt-1 h-4 w-4 -translate-x-1/2 transform rounded-full bg-purple-500"
                                        style={{
                                            left: `${results.politicalLeaning.score}%`,
                                        }}
                                    ></div>
                                    <div className="absolute top-0 left-1/2 h-2 w-[1px] bg-gray-400"></div>
                                </div>
                                <div className="text-center font-medium">
                                    {results.politicalLeaning.rating}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sentiment Analysis Section */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle>Sentiment Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {/* Overall Sentiment */}
                                <div>
                                    <h3 className="mb-3 text-lg font-medium">
                                        Overall Sentiment
                                    </h3>
                                    <div className="flex items-center">
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                                            <div
                                                className={`h-full rounded-full ${
                                                    results.sentiment.overall
                                                        .score > 0.2
                                                        ? "bg-green-500"
                                                        : results.sentiment
                                                                .overall.score <
                                                            -0.2
                                                          ? "bg-red-500"
                                                          : "bg-gray-500"
                                                }`}
                                                style={{
                                                    width: `${Math.abs(results.sentiment.overall.score) * 100}%`,
                                                    marginLeft:
                                                        results.sentiment
                                                            .overall.score >= 0
                                                            ? "50%"
                                                            : `${50 - Math.abs(results.sentiment.overall.score) * 50}%`,
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="mt-1 flex justify-between text-sm">
                                        <span>Negative</span>
                                        <span>
                                            {results.sentiment.overall.rating}{" "}
                                            (Score:{" "}
                                            {results.sentiment.overall.score})
                                        </span>
                                        <span>Positive</span>
                                    </div>
                                </div>

                                {/* Entity Sentiment */}
                                <div>
                                    <h3 className="mb-3 text-lg font-medium">
                                        Entity Sentiment
                                    </h3>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Entity</TableHead>
                                                <TableHead>
                                                    Sentiment Score
                                                </TableHead>
                                                <TableHead>
                                                    Visualization
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {results.sentiment.entities.map(
                                                (entity, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell className="font-medium">
                                                            {entity.name}
                                                        </TableCell>
                                                        <TableCell>
                                                            {entity.score.toFixed(
                                                                1,
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                                                                <div
                                                                    className={`h-full rounded-full ${entity.score > 0 ? "bg-green-500" : "bg-red-500"}`}
                                                                    style={{
                                                                        width: `${Math.abs(entity.score) * 100}%`,
                                                                        marginLeft:
                                                                            entity.score >=
                                                                            0
                                                                                ? "50%"
                                                                                : `${50 - Math.abs(entity.score) * 50}%`,
                                                                    }}
                                                                ></div>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ),
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </main>
    );
}

// Types
interface AnalysisResults {
    factuality: {
        rating: string;
        confidence: number;
    };
    source: {
        name: string;
        url: string;
        reliability: string;
    };
    politicalLeaning: {
        rating: string;
        score: number;
    };
    sentiment: {
        overall: {
            rating: string;
            score: number;
        };
        entities: Array<{
            name: string;
            score: number;
        }>;
    };
}
