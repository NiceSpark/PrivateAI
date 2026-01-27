from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("reranker-proxy")

app = FastAPI()

# Environment variables
RERANKER_URL = os.getenv("RERANKER_URL", "http://reranker:80")
TEI_RERANK_ENDPOINT = f"{RERANKER_URL}/rerank"

class OpenWebUIRequest(BaseModel):
    model: str
    query: str
    documents: list[str]
    top_n: int | None = None

@app.post("/rerank")
async def rerank(request: OpenWebUIRequest):
    logger.info(f"Received request for model: {request.model}, query: {request.query[:50]}...")
    
    # Construct payload for TEI
    # TEI expects: {"query": "...", "texts": [...], "raw_scores": False, "return_text": False}
    tei_payload = {
        "query": request.query,
        "texts": request.documents,
        "raw_scores": False, 
        "return_text": False
    }

    if request.top_n:
        tei_payload["top_n"] = request.top_n

    async with httpx.AsyncClient() as client:
        try:
            logger.info(f"Forwarding to TEI at {TEI_RERANK_ENDPOINT}")
            response = await client.post(TEI_RERANK_ENDPOINT, json=tei_payload)
            
            if response.status_code != 200:
                logger.error(f"TEI Error: {response.text}")
                raise HTTPException(status_code=response.status_code, detail=f"Upstream error: {response.text}")
            
            tei_results = response.json()
            # TEI returns: [{"index": 0, "score": 0.99}, ...]
            
            # Open WebUI expects: {"results": [{"index": 0, "relevance_score": 0.99}, ...]}
            # Note: We need to map 'score' to 'relevance_score'
            
            formatted_results = []
            for item in tei_results:
                formatted_results.append({
                    "index": item["index"],
                    "relevance_score": item["score"]
                })
            
            # Sort by score descending just in case, though TEI usually does it
            formatted_results.sort(key=lambda x: x["relevance_score"], reverse=True)
            
            return {"results": formatted_results}

        except httpx.RequestError as e:
            logger.error(f"Connection error: {e}")
            raise HTTPException(status_code=503, detail=f"Could not connect to reranker: {e}")
