"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface ArticleRendererProps {
    content: string;
    entities?: Array<{ name: string; score: number }>;
    sourceDomain?: string;
}

export function ArticleRenderer({
    content,
    entities = [],
    sourceDomain,
}: ArticleRendererProps) {
    // Process the content to add sentiment links
    const processedContent = React.useMemo(() => {
        if (!entities || entities.length === 0) {
            return content;
        }

        let modifiedContent = content;

        // Sort entities by name length (descending) to avoid replacing parts of longer entities first
        const sortedEntities = [...entities].sort(
            (a, b) => b.name.length - a.name.length,
        );

        // Replace each entity with a markdown link that includes sentiment data
        sortedEntities.forEach((entity) => {
            const { name, score } = entity;

            // Create a markdown format sentiment link: [entity name](sentiment:score)
            const sentimentLink = `[${name}](https://sentiment-link/${score})`;

            // Replace all occurrences using word boundaries
            const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const regex = new RegExp(`\\b${escapedName}\\b`, "gi");
            modifiedContent = modifiedContent.replace(regex, sentimentLink);
        });

        return modifiedContent;
    }, [content, entities]);

    // Get color based on sentiment score
    function getSentimentColor(score: number): string {
        if (score > 0.7)
            return "bg-green-300 dark:bg-green-950 text-green-800 dark:text-green-300";
        if (score > 0.3)
            return "bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-300";
        if (score > 0.1)
            return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
        if (score < -0.7)
            return "bg-red-300 dark:bg-red-950 text-red-800 dark:text-red-300";
        if (score < -0.3)
            return "bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-300";
        if (score < -0.1)
            return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300";
    }

    // Get sentiment text based on score
    function getSentimentText(score: number): string {
        if (score > 0.7) return "Very Positive";
        if (score > 0.3) return "Positive";
        if (score > -0.3 && score < 0.3) return "Neutral";
        if (score < -0.7) return "Very Negative";
        if (score < -0.3) return "Negative";
        return "Neutral";
    }

    return (
        <div className="article-content">
            <ReactMarkdown
                components={{
                    a: ({ href, children }) => {
                        // Check if this is a sentiment-tagged link
                        if (href?.startsWith("https://sentiment-link/")) {
                            const score = parseFloat(
                                href.replace("https://sentiment-link/", ""),
                            );
                            const sentimentColor = getSentimentColor(score);
                            const sentimentText = getSentimentText(score);

                            return (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span
                                                className={`rounded px-1 py-0.5 font-medium ${sentimentColor}`}
                                            >
                                                {children}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent
                                            side="top"
                                            align="center"
                                        >
                                            <div className="flex flex-col gap-1">
                                                <span className="font-medium">
                                                    {children}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs">
                                                        {sentimentText}
                                                    </span>
                                                    <span className="text-xs">
                                                        ({score.toFixed(1)})
                                                    </span>
                                                </div>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            );
                        }

                        // Regular links - handle relative and absolute URLs
                        let fullHref = href;
                        
                        // Check if it's a relative URL (starts with / but not //) and we have a source domain
                        if (href && href.startsWith('/') && !href.startsWith('//') && sourceDomain) {
                            // Clean domain - remove protocol if exists, and ensure no trailing slash
                            let domain = sourceDomain;
                            if (domain.startsWith('http://') || domain.startsWith('https://')) {
                                domain = domain.replace(/^https?:\/\//, '');
                            }
                            domain = domain.replace(/\/$/, '');
                            
                            // Construct full URL
                            fullHref = `https://${domain}${href}`;
                        }
                        
                        return (
                            <a
                                href={fullHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:text-primary/80 font-medium underline underline-offset-4"
                            >
                                {children}
                            </a>
                        );
                    },
                    h1: ({ children }) => (
                        <h1 className="mb-6 scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
                            {children}
                        </h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className="mt-8 mb-4 scroll-m-20 text-3xl font-semibold tracking-tight">
                            {children}
                        </h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="mt-6 mb-3 scroll-m-20 text-2xl font-semibold tracking-tight">
                            {children}
                        </h3>
                    ),
                    h4: ({ children }) => (
                        <h4 className="mt-4 mb-2 scroll-m-20 text-xl font-semibold tracking-tight">
                            {children}
                        </h4>
                    ),
                    p: ({ children }) => (
                        <p className="mb-4 leading-7 [&:not(:first-child)]:mt-4">
                            {children}
                        </p>
                    ),
                    ul: ({ children }) => (
                        <ul className="my-4 ml-6 list-disc [&>li]:mt-1">
                            {children}
                        </ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="my-4 ml-6 list-decimal [&>li]:mt-1">
                            {children}
                        </ol>
                    ),
                    li: ({ children }) => <li>{children}</li>,
                    blockquote: ({ children }) => (
                        <blockquote className="border-muted text-muted-foreground mt-4 mb-4 border-l-4 pl-4 italic">
                            {children}
                        </blockquote>
                    ),
                    img: ({ src, alt }) => (
                        <div className="relative my-6">
                            <div className="border-border relative w-full overflow-hidden rounded-md border">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={src ?? ""}
                                    alt={alt ?? ""}
                                    className="h-auto w-full"
                                    style={{ maxWidth: "100%" }}
                                />
                            </div>
                            {alt && (
                                <p className="text-muted-foreground mt-1 text-center text-sm">
                                    {alt}
                                </p>
                            )}
                        </div>
                    ),
                    strong: ({ children }) => (
                        <strong className="font-semibold">{children}</strong>
                    ),
                    code: ({ children }) => (
                        <code className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm">
                            {children}
                        </code>
                    ),
                    pre: ({ children }) => (
                        <pre className="bg-muted mt-4 mb-4 overflow-auto rounded-lg border p-4">
                            {children}
                        </pre>
                    ),
                }}
            >
                {processedContent}
            </ReactMarkdown>
        </div>
    );
}
