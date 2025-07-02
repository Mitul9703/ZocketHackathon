// For Node.js versions < 18, you might need to install node-fetch
// But Node.js 18+ has fetch built-in


interface RAGResult {
    content: string;
}

interface RAGResponse {
    results: RAGResult[];
    query: string;

}

class RAGService {
    private baseUrl: string;

    constructor(baseUrl: string = 'http://localhost:8001') {
        this.baseUrl = baseUrl;
    }

    async searchDocuments(
        query: string,
        maxResults: number = 3,
        documentType?: string,
        collectionName: string = 'zocket_collectionV2'
    ): Promise<string> {
        try {
            console.log(`🔍 Searching RAG for: "${query}"`);

            const response = await fetch(`${this.baseUrl}/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query,
                    max_results: maxResults,
                    collection_name: collectionName,
                    document_type: documentType
                }),
            });

            if (!response.ok) {
                throw new Error(`RAG service error: ${response.status} ${response.statusText}`);
            }

            const data: RAGResponse = await response.json();

            if (data.results.length === 0) {
                console.log('⚠️ No relevant documents found');
                return '';
            }

            // Format context for OpenAI
            const context = data.results
                .map((result, index) => {
                    return `[Document ${index + 1}]\n${result.content}`;
                })
                .join('\n\n---\n\n');

            console.log('RAG found ${data.results.length} relevant document(s)`);
            return context;

        } catch (error) {
            console.error('RAG service error:', error);
            return ''; 
        }
    }

    async healthCheck(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            return response.ok;
        } catch (error) {
            console.error('RAG service health check failed:', error);
            return false;
        }
    }
}

export const ragService = new RAGService(); 
