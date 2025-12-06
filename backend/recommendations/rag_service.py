"""
RAG-based Mental Health Bot Service for Django
Adapted from the shared mental_health_bot.py
"""
from langchain_pinecone import PineconeVectorStore
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_huggingface import HuggingFaceEmbeddings
import google.generativeai as genai
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from decouple import config
import os
import time

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
        model_name: str = "gemini-2.5-flash"  # Latest Gemini model
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
        self.pinecone_api_key = pinecone_api_key or config('PINECONE_API_KEY', default='')
        self.gemini_api_key = gemini_api_key or config('GEMINI_API_KEY', default='')
        self.index_name = index_name
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.model_name = model_name
        
        if not self.pinecone_api_key:
            raise ValueError("PINECONE_API_KEY is required")
        if not self.gemini_api_key:
            raise ValueError("GEMINI_API_KEY is required")
        
        # Set environment variables for LangChain
        os.environ["PINECONE_API_KEY"] = self.pinecone_api_key
        os.environ["GEMINI_API_KEY"] = self.gemini_api_key
        
        # Initialize the RAG chain
        self.rag_chain = None
        self._initialize_rag_chain()
    
    def _initialize_rag_chain(self):
        """Initialize the RAG chain with embeddings, retriever, and LLM"""
        try:
            print("🔧 Initializing RAG chain...")
            start_time = time.time()
            
            # Initialize embeddings using HuggingFaceEmbeddings wrapper
            # This uses sentence-transformers/all-MiniLM-L6-v2 by default
            print("   📊 Loading embeddings model (sentence-transformers/all-MiniLM-L6-v2)...")
            embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2",
                model_kwargs={'device': 'cpu'},
                encode_kwargs={'normalize_embeddings': True}
            )
            print(f"   ✅ Embeddings model loaded ({time.time() - start_time:.2f}s)")
            
            # Connect to Pinecone index
            print(f"   🔌 Connecting to Pinecone index: {self.index_name}...")
            docsearch = PineconeVectorStore.from_existing_index(
                index_name=self.index_name,
                embedding=embeddings
            )
            print(f"   ✅ Connected to Pinecone ({time.time() - start_time:.2f}s)")
            
            # Create retriever
            retriever = docsearch.as_retriever(
                search_type="similarity",
                search_kwargs={"k": 5}
            )
            print("   ✅ Retriever configured (k=5)")
            
            # Configure Gemini
            print(f"   🤖 Configuring Gemini AI ({self.model_name})...")
            genai.configure(api_key=self.gemini_api_key)
            
            # Initialize Gemini chat model
            llm = ChatGoogleGenerativeAI(
                model=self.model_name,
                google_api_key=self.gemini_api_key,
                temperature=self.temperature,
                max_output_tokens=self.max_tokens,
            )
            print(f"   ✅ Gemini configured (temp={self.temperature}, max_tokens={self.max_tokens})")
            
            # Create prompt template
            print("   📝 Creating prompt template...")
            prompt = ChatPromptTemplate.from_messages(
                [
                    ("system", SYSTEM_PROMPT),
                    ("human", "{input}"),
                ]
            )
            
            # Create RAG chain
            print("   ⚙️ Assembling RAG chain...")
            question_answer_chain = create_stuff_documents_chain(llm, prompt)
            self.rag_chain = create_retrieval_chain(retriever, question_answer_chain)
            
            print(f"✅ RAG chain initialized successfully! (Total time: {time.time() - start_time:.2f}s)\n")
            
        except Exception as e:
            print(f"❌ Error initializing RAG chain: {str(e)}\n")
            raise
    
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
        if self.rag_chain is None:
            print("❌ RAG chain not initialized!")
            return {
                "answer": "I'm sorry, the AI service is not properly initialized. Please contact support.",
                "sources": [],
                "error": "RAG chain not initialized"
            }
        
        try:
            print(f"   🔍 Searching Pinecone for relevant context...")
            start_time = time.time()
            response = self.rag_chain.invoke({"input": user_message})
            print(f"   ✅ Retrieved and processed context ({time.time() - start_time:.2f}s)")
            
            # Extract answer
            print("   💭 Generating response with Gemini...")
            answer = self._extract_answer(response)
            print(f"   ✅ Response generated ({time.time() - start_time:.2f}s)")
            
            # Extract source documents
            sources = []
            if "context" in response:
                context_docs = response.get("context", [])
                print(f"   📚 Found {len(context_docs)} relevant source documents")
                for doc in context_docs:
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
            print(f"   ❌ Error in get_response: {str(e)}")
            return {
                "answer": "I'm sorry, I encountered an error processing your message. Please try again or rephrase your question.",
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
        print("\n" + "🚀 Creating new RAG bot instance (first time initialization)...")
        try:
            _bot_instance = MentalHealthBot(**kwargs)
        except Exception as e:
            print(f"❌ Failed to initialize RAG bot: {str(e)}")
            _bot_instance = None  # Reset so we can try again
            raise
    else:
        print("♻️ Using existing RAG bot instance (already initialized)")
    return _bot_instance

