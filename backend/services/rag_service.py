"""
LegalMind AI - RAG (Retrieval Augmented Generation) Service
Handles document chunking, embedding generation, and semantic search
"""

import json
import pickle
from pathlib import Path
from typing import List, Dict, Optional, Tuple
import numpy as np
from loguru import logger

# These will be imported after installation completes
try:
    from sentence_transformers import SentenceTransformer
    import faiss
    DEPENDENCIES_AVAILABLE = True
except ImportError:
    logger.warning("RAG dependencies not yet installed (sentence-transformers, faiss-cpu)")
    DEPENDENCIES_AVAILABLE = False

from config.config import settings


class RAGService:
    """
    RAG Service for semantic search over legal documents
    Uses sentence-transformers for embeddings and FAISS for vector search
    """

    def __init__(self):
        self.model = None
        self.index = None
        self.chunk_metadata = []
        self.embedding_dimension = settings.EMBEDDING_DIMENSION
        self.model_name = settings.EMBEDDING_MODEL
        self.index_path = settings.FAISS_INDEX_PATH
        self.metadata_path = settings.FAISS_METADATA_PATH

        self.initialized = False

    def initialize(self) -> bool:
        """Initialize RAG service (load model and index)"""
        if self.initialized:
            logger.info("RAG service already initialized")
            return True

        if not DEPENDENCIES_AVAILABLE:
            logger.error("RAG dependencies not installed")
            return False

        try:
            logger.info("Initializing RAG service...")

            # Load embedding model (local or from HuggingFace)
            if settings.USE_LOCAL_EMBEDDING and Path(settings.EMBEDDING_MODEL_PATH).exists():
                logger.info(f"Loading local embedding model from: {settings.EMBEDDING_MODEL_PATH}")
                self.model = SentenceTransformer(settings.EMBEDDING_MODEL_PATH)
                logger.success(f"Local embedding model loaded (dimension: {self.embedding_dimension})")
            else:
                logger.info(f"Loading embedding model from HuggingFace: {self.model_name}")
                self.model = SentenceTransformer(self.model_name)
                logger.success(f"Embedding model loaded (dimension: {self.embedding_dimension})")

            # Try to load existing index
            if self.index_path.exists() and self.metadata_path.exists():
                logger.info("Loading existing FAISS index...")
                self.load_index()
            else:
                logger.info("No existing index found, creating new one")
                self.create_empty_index()

            self.initialized = True
            logger.success("RAG service initialized!")
            return True

        except Exception as e:
            logger.error(f"Failed to initialize RAG service: {e}")
            self.initialized = False
            return False

    def create_empty_index(self):
        """Create empty FAISS index"""
        logger.info(f"Creating empty FAISS index (dimension: {self.embedding_dimension})")
        self.index = faiss.IndexFlatL2(self.embedding_dimension)
        self.chunk_metadata = []
        logger.success("Empty index created")

    def generate_embeddings(self, texts: List[str], batch_size: int = 32) -> np.ndarray:
        """
        Generate embeddings for text chunks

        Args:
            texts: List of text strings
            batch_size: Batch size for processing

        Returns:
            Numpy array of embeddings (n_texts, embedding_dim)
        """
        if not self.initialized:
            raise RuntimeError("RAG service not initialized")

        logger.info(f"Generating embeddings for {len(texts)} texts...")
        embeddings = self.model.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=True,
            convert_to_numpy=True
        )

        logger.success(f"Generated {embeddings.shape[0]} embeddings")
        return embeddings

    def add_documents_from_chunks(self, chunks_file: Path) -> bool:
        """
        Process chunks from JSON file and add to index

        Args:
            chunks_file: Path to chunk_metadata.json from document processing

        Returns:
            Success boolean
        """
        if not self.initialized:
            logger.error("RAG service not initialized")
            return False

        try:
            logger.info(f"Loading chunks from: {chunks_file}")

            # Load chunk metadata
            with open(chunks_file, 'r', encoding='utf-8') as f:
                data = json.load(f)

            # Handle both formats: direct array or nested with 'chunks' key
            if isinstance(data, dict) and 'chunks' in data:
                chunks = data['chunks']
            elif isinstance(data, list):
                chunks = data
            else:
                raise ValueError(f"Unexpected chunk metadata format: {type(data)}")

            logger.info(f"Loaded {len(chunks)} chunks")

            # Extract texts
            texts = [chunk['text'] for chunk in chunks]

            # Generate embeddings
            embeddings = self.generate_embeddings(texts)

            # Add to FAISS index
            logger.info("Adding embeddings to FAISS index...")
            self.index.add(embeddings.astype('float32'))

            # Store metadata
            self.chunk_metadata.extend(chunks)

            logger.success(f"Added {len(chunks)} documents to index")
            logger.info(f"Total documents in index: {self.index.ntotal}")

            return True

        except Exception as e:
            logger.error(f"Failed to add documents: {e}")
            return False

    def search(
        self,
        query: str,
        top_k: int = 5,
        score_threshold: Optional[float] = None
    ) -> List[Dict]:
        """
        Semantic search for relevant chunks

        Args:
            query: Search query
            top_k: Number of results to return
            score_threshold: Optional minimum similarity score

        Returns:
            List of relevant chunks with metadata and scores
        """
        if not self.initialized:
            raise RuntimeError("RAG service not initialized")

        if self.index.ntotal == 0:
            logger.warning("Index is empty, no results to return")
            return []

        try:
            logger.info(f"Searching for: '{query}' (top_k={top_k})")

            # Generate query embedding
            query_embedding = self.model.encode([query], convert_to_numpy=True)

            # Search FAISS index
            distances, indices = self.index.search(
                query_embedding.astype('float32'),
                min(top_k, self.index.ntotal)
            )

            # Build results
            results = []
            for i, (dist, idx) in enumerate(zip(distances[0], indices[0])):
                if idx == -1:  # FAISS returns -1 for empty slots
                    continue

                # Convert L2 distance to similarity score (0-1)
                similarity = 1 / (1 + dist)

                # Apply threshold if specified
                if score_threshold and similarity < score_threshold:
                    continue

                # Get chunk metadata
                chunk = self.chunk_metadata[idx].copy()
                chunk['similarity_score'] = float(similarity)
                chunk['distance'] = float(dist)
                chunk['rank'] = i + 1

                results.append(chunk)

            logger.info(f"Found {len(results)} relevant chunks")

            return results

        except Exception as e:
            logger.error(f"Search failed: {e}")
            return []

    def get_context_for_query(
        self,
        query: str,
        max_chunks: int = 5,
        max_tokens: int = 2000
    ) -> Tuple[List[str], List[Dict]]:
        """
        Get relevant context chunks for a query

        Args:
            query: User query
            max_chunks: Maximum number of chunks
            max_tokens: Maximum total tokens (approximate)

        Returns:
            Tuple of (context_texts, metadata)
        """
        # Search for relevant chunks
        results = self.search(query, top_k=max_chunks)

        if not results:
            logger.warning("No relevant context found")
            return [], []

        # Extract texts and metadata
        context_texts = []
        metadata = []
        total_tokens = 0

        for result in results:
            chunk_text = result['text']
            chunk_tokens = result.get('token_count', len(chunk_text.split()))

            # Check token limit
            if total_tokens + chunk_tokens > max_tokens:
                logger.info(f"Reached token limit ({total_tokens}/{max_tokens})")
                break

            context_texts.append(chunk_text)
            metadata.append(result)
            total_tokens += chunk_tokens

        logger.info(f"Retrieved {len(context_texts)} chunks (~{total_tokens} tokens)")

        return context_texts, metadata

    def save_index(self) -> bool:
        """Save FAISS index and metadata to disk"""
        if not self.initialized or self.index is None:
            logger.error("Cannot save: index not initialized")
            return False

        try:
            logger.info("Saving FAISS index...")

            # Create directory if needed
            self.index_path.parent.mkdir(parents=True, exist_ok=True)

            # Save FAISS index
            faiss.write_index(self.index, str(self.index_path))
            logger.info(f"FAISS index saved to: {self.index_path}")

            # Save metadata
            with open(self.metadata_path, 'w', encoding='utf-8') as f:
                json.dump(self.chunk_metadata, f, indent=2)
            logger.info(f"Metadata saved to: {self.metadata_path}")

            logger.success("Index saved successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to save index: {e}")
            return False

    def load_index(self) -> bool:
        """Load FAISS index and metadata from disk"""
        try:
            logger.info("Loading FAISS index...")

            # Load FAISS index
            self.index = faiss.read_index(str(self.index_path))
            logger.info(f"Loaded FAISS index: {self.index.ntotal} vectors")

            # Load metadata
            with open(self.metadata_path, 'r', encoding='utf-8') as f:
                self.chunk_metadata = json.load(f)
            logger.info(f"Loaded {len(self.chunk_metadata)} metadata entries")

            logger.success("Index loaded successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to load index: {e}")
            return False

    def get_stats(self) -> Dict:
        """Get RAG service statistics"""
        return {
            "initialized": self.initialized,
            "model": self.model_name,
            "embedding_dimension": self.embedding_dimension,
            "total_vectors": self.index.ntotal if self.index else 0,
            "total_chunks": len(self.chunk_metadata),
            "index_path": str(self.index_path),
            "index_exists": self.index_path.exists(),
        }

    def rebuild_index_from_processed_data(self) -> bool:
        """
        Rebuild FAISS index from processed document chunks

        Returns:
            Success boolean
        """
        if not self.initialized:
            logger.error("RAG service not initialized")
            return False

        # Path to processed chunks
        chunks_file = settings.PROCESSED_DIR / "chunks" / "chunk_metadata.json"

        if not chunks_file.exists():
            logger.error(f"Chunks file not found: {chunks_file}")
            logger.info("Run document processing first (Task 02)")
            return False

        logger.info("Rebuilding index from processed chunks...")

        # Create fresh index
        self.create_empty_index()

        # Add documents
        success = self.add_documents_from_chunks(chunks_file)

        if success:
            # Save to disk
            self.save_index()
            logger.success("Index rebuilt and saved successfully!")

        return success


# ============================================================================
# SINGLETON INSTANCE
# ============================================================================

_rag_service: Optional[RAGService] = None


def get_rag_service() -> RAGService:
    """Get or create RAG service singleton"""
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService()
    return _rag_service


# ============================================================================
# CONVENIENCE FUNCTIONS
# ============================================================================

def search_documents(query: str, top_k: int = 5) -> List[Dict]:
    """Quick document search"""
    service = get_rag_service()
    if not service.initialized:
        service.initialize()
    return service.search(query, top_k)


def get_context(query: str, max_chunks: int = 5) -> List[str]:
    """Quick context retrieval"""
    service = get_rag_service()
    if not service.initialized:
        service.initialize()
    texts, _ = service.get_context_for_query(query, max_chunks)
    return texts


# ============================================================================
# TESTING
# ============================================================================

if __name__ == "__main__":
    """Test RAG service"""
    print("=" * 70)
    print("TESTING RAG SERVICE")
    print("=" * 70)

    # Create service
    service = RAGService()

    # Initialize
    print("\n1. Initializing service...")
    if service.initialize():
        print("SUCCESS: Service initialized!")

        # Check stats
        print("\n2. Service stats:")
        stats = service.get_stats()
        for key, value in stats.items():
            print(f"  {key}: {value}")

        # Test search (if index exists)
        if service.index.ntotal > 0:
            print("\n3. Testing search...")
            results = service.search("RERA Section 18 penalty", top_k=3)
            print(f"Found {len(results)} results")
            for i, result in enumerate(results, 1):
                print(f"\n  Result {i}:")
                print(f"    Document: {result.get('document_id')}")
                print(f"    Similarity: {result.get('similarity_score', 0):.3f}")
                print(f"    Preview: {result.get('text', '')[:100]}...")

        print("\n" + "=" * 70)
        print("SUCCESS: RAG service working!")
        print("=" * 70)
    else:
        print("FAILED: Could not initialize service")
        print("Note: Dependencies may still be installing")
