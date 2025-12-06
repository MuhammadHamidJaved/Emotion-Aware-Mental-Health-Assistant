"""
Helper functions for RAG chat bot
"""
from sentence_transformers import SentenceTransformer
import os

# Global variable to cache the model
_embedding_model = None

def download_hugging_face_embeddings():
    """
    Download and return Hugging Face embeddings model
    Uses sentence-transformers for efficient embeddings
    """
    global _embedding_model
    
    if _embedding_model is None:
        # Using a lightweight, efficient model for embeddings
        # sentence-transformers/all-MiniLM-L6-v2 is a good balance of quality and speed
        model_name = "sentence-transformers/all-MiniLM-L6-v2"
        print(f"Loading embedding model: {model_name}")
        _embedding_model = SentenceTransformer(model_name)
        print("Embedding model loaded successfully")
    
    return _embedding_model


