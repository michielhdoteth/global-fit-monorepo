/**
 * Knowledge Retriever Service
 * Implements Retrieval-Augmented Generation (RAG) using PostgreSQL full-text search
 * MVP approach - simple keyword-based retrieval
 * Future: Migrate to vector database (Pinecone/Weaviate) for semantic search
 */

export class KnowledgeRetriever {
  private maxChunks: number = 5; // Return top 5 most relevant chunks
  private minRelevanceScore: number = 0.1; // Minimum relevance threshold

  /**
   * Retrieve relevant knowledge base chunks for a query
   * Uses PostgreSQL full-text search with keyword extraction
   * @param query User query text
   * @returns Array of relevant document chunks
   */
  async retrieve(query: string): Promise<string[]> {
    try {
      // Extract keywords from query
      const keywords = this.extractKeywords(query);

      if (keywords.length === 0) {
        return [];
      }

      // For MVP, return empty array
      // In production, this would query the database using raw SQL
      // Example implementation when DocumentChunk table is ready:
      /*
      const chunks = await prisma.$queryRaw<Array<{ content: string; score: number }>>`
        SELECT
          dc.content,
          ts_rank(
            to_tsvector('english', dc.content),
            plainto_tsquery('english', ${keywords.join(' ')})
          ) as score
        FROM "DocumentChunk" dc
        INNER JOIN "KnowledgeDocument" kd ON dc."documentId" = kd.id
        WHERE
          kd."isIndexed" = true
          AND to_tsvector('english', dc.content) @@ plainto_tsquery('english', ${keywords.join(' ')})
        ORDER BY score DESC
        LIMIT ${this.maxChunks}
      `;

      return chunks
        .filter(c => c.score >= this.minRelevanceScore)
        .map(c => c.content);
      */

      console.log(`[KNOWLEDGE_RETRIEVER] Query: "${query}", Keywords: ${keywords.join(', ')}`);
      return [];
    } catch (error) {
      console.error('[KNOWLEDGE_RETRIEVER] Retrieval error:', error);
      return [];
    }
  }

  /**
   * Extract keywords from query text for search
   * Removes common stopwords and normalizes text
   * @param text Query text
   * @returns Array of keywords
   */
  private extractKeywords(text: string): string[] {
    const stopwords = new Set([
      'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been',
      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'should', 'can', 'could', 'may', 'might', 'must',
      'and', 'or', 'but', 'not', 'of', 'in', 'to', 'for', 'with',
      'at', 'by', 'from', 'on', 'as', 'if', 'this', 'that',
    ]);

    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopwords.has(w));

    return Array.from(new Set(words)).slice(0, 10); // Limit to 10 keywords
  }

  /**
   * Set maximum number of chunks to retrieve
   * @param count Maximum chunks (1-10)
   */
  setMaxChunks(count: number): void {
    this.maxChunks = Math.max(1, Math.min(count, 10));
  }

  /**
   * Set minimum relevance score threshold
   * @param score Score between 0-1
   */
  setMinRelevanceScore(score: number): void {
    this.minRelevanceScore = Math.max(0, Math.min(score, 1));
  }
}
