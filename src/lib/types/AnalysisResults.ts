export interface AnalysisResults {
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
