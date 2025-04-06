export interface AnalysisRequest {
    content: string;
    isHtml: boolean;
    isUrl?: boolean;  // Flag to indicate if content is a URL
    url?: string;     // The URL to analyze (if applicable)
}
