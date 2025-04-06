export interface AnalysisResults {
    factuality: {
        confidence: number;
        sources: string[];
        rating?: string; // Text label for the factuality rating
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
        score: number;
        category?: string;
        reasoning?: string;
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
