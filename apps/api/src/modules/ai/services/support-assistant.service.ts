// ==============================================================================
// BETOCH AI INTELLIGENCE LAYER — SUPPORT ASSISTANT & RAG SERVICE
// Official knowledge retrieval with strict hallucination defense
// ==============================================================================

import { query } from '../../../database/db.js';

export interface SupportAnswer {
  answer: string;
  sourceDocuments: string[];
  isConfident: boolean;
  requiresEscalation: boolean;
}

export class SupportAssistantService {
  static async answerQuestion(userQuestion: string): Promise<SupportAnswer> {
    const cleanQuestion = userQuestion.trim();

    // Query official knowledge chunks using PostgreSQL tsvector
    const chunksRes = await query(
      `SELECT kc.content, kd.title, kd.category,
              ts_rank(kc.search_vector, plainto_tsquery('english', $1)) AS rank
       FROM knowledge_chunks kc
       JOIN knowledge_documents kd ON kd.id = kc.document_id
       WHERE kc.search_vector @@ plainto_tsquery('english', $1)
       ORDER BY rank DESC
       LIMIT 3`,
      [cleanQuestion]
    );

    // If no direct tsvector match, try broad keyword search
    let matchingChunks = chunksRes.rows;
    if (matchingChunks.length === 0) {
      const lower = cleanQuestion.toLowerCase();
      let fallbackTopic = '';
      if (lower.includes('deposit') || lower.includes('law') || lower.includes('proclamation') || lower.includes('month')) {
        fallbackTopic = 'proclamation-1320-2024-guide';
      } else if (lower.includes('fayda') || lower.includes('verify') || lower.includes('id') || lower.includes('carta')) {
        fallbackTopic = 'fayda-id-and-carta-verification';
      } else if (lower.includes('telebirr') || lower.includes('commission') || lower.includes('pay')) {
        fallbackTopic = 'telebirr-payment-and-commission-policy';
      } else if (lower.includes('scam') || lower.includes('safety') || lower.includes('report')) {
        fallbackTopic = 'safety-and-scam-prevention';
      }

      if (fallbackTopic) {
        const fallbackRes = await query(
          `SELECT kc.content, kd.title, kd.category
           FROM knowledge_chunks kc
           JOIN knowledge_documents kd ON kd.id = kc.document_id
           WHERE kd.slug = $1
           LIMIT 2`,
          [fallbackTopic]
        );
        matchingChunks = fallbackRes.rows;
      }
    }

    // Safety guardrail: If question is completely outside knowledge scope
    if (matchingChunks.length === 0) {
      return {
        answer: "I don't have enough official information in the Betoch knowledge base to answer that accurately. Please reach out to our team at support@betoch.et or open a support inquiry.",
        sourceDocuments: [],
        isConfident: false,
        requiresEscalation: true
      };
    }

    const citations = [...new Set(matchingChunks.map((c) => c.title))];
    const contextText = matchingChunks.map((c) => c.content).join('\n\n');

    const answer = `Based on official Betoch documentation:\n\n${contextText}\n\n*Reference: ${citations.join(' | ')}*`;

    return {
      answer,
      sourceDocuments: citations,
      isConfident: true,
      requiresEscalation: false
    };
  }
}
