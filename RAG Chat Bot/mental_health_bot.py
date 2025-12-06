from langchain_pinecone import PineconeVectorStore
from langchain_google_genai import ChatGoogleGenerativeAI
import google.generativeai as genai
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv
import os
import sys

# Add parent directory to path to import helper
parent_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, parent_dir)

from src.helper import download_hugging_face_embeddings

# Load environment variables
load_dotenv()

# System prompt for the mental health assistant
SYSTEM_PROMPT = (
    "You are a compassionate and empathetic mental health support assistant. "
    "Your role is to provide emotional support, validate feelings, and offer evidence-based guidance. "
    "\n\n"
    "IMPORTANT GUIDELINES:\n"
    "1. Be warm, empathetic, and non-judgmental in all responses\n"
    "2. Recognize and validate the user's emotions\n"
    "3. If relevant context is provided below, use it to give evidence-based guidance\n"
    "4. If no relevant context is found, still provide empathetic support using your general knowledge of mental health best practices\n"
    "5. Encourage professional help when appropriate\n"
    "6. Never diagnose or prescribe - only provide supportive guidance\n"
    "7. Keep responses supportive yet concise (3-5 sentences)\n"
    "8. If discussing crisis situations, immediately provide crisis resources\n"
    "\n\n"
    "Context from mental health resources (may be limited or empty):\n"
    "{context}"
    "\n\n"
    "Even if the context is limited, respond with empathy, understanding, and helpful guidance. "
    "Validate the user's feelings and provide compassionate support."
)


class MentalHealthBot:
    """Mental Health Assistant with RAG capabilities"""
    
    def __init__(
        self,
        pinecone_api_key: str = None,
        gemini_api_key: str = None,
        index_name: str = "mentalhealthbot",
        temperature: float = 0.6,
        max_tokens: int = 700,
        model_name: str = "gemini-2.5-flash"
    ):
        """
        Initialize the Mental Health Bot
        
        Args:
            pinecone_api_key: Pinecone API key (if None, reads from env)
            gemini_api_key: Gemini API key (if None, reads from env)
            index_name: Pinecone index name
            temperature: Model temperature (0.0-1.0)
            max_tokens: Maximum tokens in response
            model_name: Gemini model to use
        """
        self.pinecone_api_key = pinecone_api_key or os.environ.get('PINECONE_API_KEY')
        self.gemini_api_key = gemini_api_key or os.environ.get('GEMINI_API_KEY')
        self.index_name = index_name
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.model_name = model_name
        
        # Set environment variables
        os.environ["PINECONE_API_KEY"] = self.pinecone_api_key
        os.environ["GEMINI_API_KEY"] = self.gemini_api_key
        
        # Initialize the RAG chain
        self.rag_chain = self._initialize_rag_chain()
    
    def _initialize_rag_chain(self):
        """Initialize the RAG chain with embeddings, retriever, and LLM"""
        # Initialize embeddings
        embeddings = download_hugging_face_embeddings()
        
        # Connect to Pinecone index
        docsearch = PineconeVectorStore.from_existing_index(
            index_name=self.index_name,
            embedding=embeddings
        )
        
        # Create retriever
        retriever = docsearch.as_retriever(
            search_type="similarity",
            search_kwargs={"k": 5}
        )
        
        # Configure Gemini
        genai.configure(api_key=self.gemini_api_key)
        
        # Initialize Gemini chat model
        llm = ChatGoogleGenerativeAI(
            model=self.model_name,
            google_api_key=self.gemini_api_key,
            temperature=self.temperature,
            max_tokens=self.max_tokens,
        )
        
        # Create prompt template
        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", SYSTEM_PROMPT),
                ("human", "{input}"),
            ]
        )
        
        # Create RAG chain
        question_answer_chain = create_stuff_documents_chain(llm, prompt)
        rag_chain = create_retrieval_chain(retriever, question_answer_chain)
        
        return rag_chain
    
    def get_response(self, user_message: str) -> dict:
        """
        Get a response from the mental health assistant
        
        Args:
            user_message: The user's message/question
            
        Returns:
            dict with keys:
                - answer: The assistant's response
                - sources: List of source documents used (optional)
                - error: Error message if any (optional)
        """
        try:
            response = self.rag_chain.invoke({"input": user_message})
            
            # Extract answer
            answer = self._extract_answer(response)
            
            # Extract source documents
            sources = []
            if "context" in response:
                for doc in response.get("context", []):
                    sources.append({
                        "content": doc.page_content[:300] + "..." if len(doc.page_content) > 300 else doc.page_content,
                        "metadata": doc.metadata if hasattr(doc, 'metadata') else {}
                    })
            
            return {
                "answer": answer,
                "sources": sources,
                "error": None
            }
        except Exception as e:
            return {
                "answer": "",
                "sources": [],
                "error": str(e)
            }
    
    def _extract_answer(self, response: object) -> str:
        """Best-effort extraction of the answer string from a LangChain response."""
        try:
            if isinstance(response, dict):
                # Common keys used by chains
                for key in ("answer", "output_text", "result", "text", "response"):
                    val = response.get(key)
                    if isinstance(val, str) and val.strip():
                        return val
                # Fallback: first non-empty string value or message content
                for val in response.values():
                    if isinstance(val, str) and val.strip():
                        return val
                    content = getattr(val, "content", None)
                    if isinstance(content, str) and content.strip():
                        return content
            # Message-like objects
            content = getattr(response, "content", None)
            if isinstance(content, str) and content.strip():
                return content
            # Last resort
            return str(response)
        except Exception:
            return ""


# Singleton instance for reuse
_bot_instance = None

def get_bot_instance(**kwargs):
    """Get or create a singleton bot instance"""
    global _bot_instance
    if _bot_instance is None:
        _bot_instance = MentalHealthBot(**kwargs)
    return _bot_instance
