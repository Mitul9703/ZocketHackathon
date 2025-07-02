import os
import chromadb
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
import uvicorn
import logging


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Zocket RAG Service", version="1.0.0")

embeddings = OpenAIEmbeddings(model="text-embedding-3-small", api_key=os.getenv("OPENAI_API_KEY"))

chroma_client = Chroma(
    collection_name="zocket_collectionV3",
    embedding_function=embeddings,
    persist_directory="../chroma_langchain_dbV3", 
)

class RAGQuery(BaseModel):
    query: str
    max_results: int = 3
    collection_name: str = "zocket_collectionV3"
    document_type: Optional[str] = None 

class RAGResult(BaseModel):
    content: str

class RAGResponse(BaseModel):
    results: List[RAGResult]
    query: str



@app.post("/search", response_model=RAGResponse)
async def search_documents(query: RAGQuery):
    """Search for relevant documents using vector similarity"""
    try:
        
        
        
        if query.document_type:
            logger.info(f"Filtering by document_type: {query.document_type}")
            results = chroma_client.similarity_search(
                query.query,
                k=query.max_results,
                filter={"document_type": query.document_type}
            )
        else:
            logger.info("Searching across all document types")
            results = chroma_client.similarity_search(
                query.query,
                k=query.max_results
            )
        rag_results = []
        for result in results:
            rag_results.append(RAGResult(
                content=result.page_content,
            ))
        
        
        
        logger.info(f"Found {len(rag_results)} results for query: '{query.query}'")
        
        return RAGResponse(
            results=rag_results,
            query=query.query,
        )
        
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        return {
            "status": "healthy",
            "message": "RAG service is running"
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info") 