export interface AnalysisResults {
    factuality: {
        article: {
            confidence: number;
            sources: string[];
            rating?: string; // Text label for the factuality rating
        };
        source: {
            confidence: number;
            rating?: string; // Text label for the factuality rating
        };
    };
    source: {
        name: string;
        url: string;
        reliability: string;
        bias: string;
        credibility: number;
        reasoning: string;
    };
    politicalLeaning: {
        article: {
            score: number;
            category?: string;
            reasoning?: string;
        };
        source: {
            score: number;
            category?: string;
            reasoning?: string;
        };
    };
    sentiment: {
        overall: {
            score: number;
        };
        entities: Array<{
            name: string;
            score: number;
        }>;
    };
}
