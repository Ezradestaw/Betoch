// ==============================================================================
// BETOCH AI INTELLIGENCE LAYER — CONVERSATIONAL RENTAL ASSISTANT
// Tool-based conversational agent with restricted capabilities and strict authorization
// ==============================================================================

import { query } from '../../../database/db.js';
import { PropertySearchService } from './property-search.service.js';
import { PropertyComparisonService } from './property-comparison.service.js';
import { SupportAssistantService } from './support-assistant.service.js';
import { AIObservabilityService } from './ai-observability.service.js';
import { AIFeatureKey } from '@betoch/shared';

export interface AssistantResponse {
  reply: string;
  toolUsed?: string;
  data?: any;
  suggestions?: string[];
}

export class RentalAssistantService {
  static async handleMessage(
    userMessage: string,
    userId?: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<AssistantResponse> {
    const startTime = Date.now();
    const cleanMsg = userMessage.trim();
    const lower = cleanMsg.toLowerCase();

    // 1. Prompt Injection & Jailbreak Defense
    const isMalicious =
      /(ignore|disregard|forget|bypass).*(instruction|prompt|rule|constraint)/i.test(cleanMsg) ||
      /(system\s+prompt|drop\s+table|drop\s+all\s+table|select\s+.*\s+from|delete\s+from|api_?key|secret\s+key)/i.test(cleanMsg);

    if (isMalicious) {
      return {
        reply: 'I am Betoch AI Assistant. I can only assist with property searches, applications, viewing bookings, and marketplace regulations.',
        suggestions: ['Search 2-bedroom in Bole', 'Check my rental applications', 'How does deposit law work?']
      };
    }

    // 2. Intent Detection & Tool Dispatch

    // TOOL A: View Rental Applications Status (Requires Authentication)
    if (lower.includes('my application') || lower.includes('application status') || lower.includes('did owner accept')) {
      if (!userId) {
        return {
          reply: 'Please sign in to your Betoch account so I can retrieve your active rental applications.',
          suggestions: ['Log In', 'Search listings instead']
        };
      }

      const appsRes = await query(
        `SELECT ra.id, ra.status, ra.proposed_start_date, ra.created_at,
                p.title, p.sub_city, p.monthly_rent
         FROM rental_applications ra
         JOIN properties p ON p.id = ra.property_id
         WHERE ra.renter_id = $1
         ORDER BY ra.created_at DESC
         LIMIT 3`,
        [userId]
      );

      if (appsRes.rows.length === 0) {
        return {
          reply: "You don't have any submitted rental applications yet. When you find a property you like, click 'Apply to Rent' to send an application to the owner.",
          toolUsed: 'getApplicationStatus',
          suggestions: ['Browse homes in Bole', 'Browse homes in Kazanchis']
        };
      }

      const app = appsRes.rows[0];
      let statusExplanation = '';
      if (app.status === 'SUBMITTED') {
        statusExplanation = 'The homeowner has received your application and it is currently awaiting their initial review.';
      } else if (app.status === 'UNDER_REVIEW') {
        statusExplanation = 'The homeowner is currently verifying your profile and introductory details.';
      } else if (app.status === 'ACCEPTED') {
        statusExplanation = 'Great news! Your application was ACCEPTED by the owner. Next step: review the standard lease agreement and proceed to secure deposit checkout via Telebirr.';
      } else if (app.status === 'REJECTED') {
        statusExplanation = 'The homeowner was unable to accept this application. You can explore similar alternative listings.';
      }

      return {
        reply: `You have an active application for "${app.title}" (${app.sub_city}):\n\n• Current Status: ${app.status}\n• Proposed Move-in: ${new Date(app.proposed_start_date).toLocaleDateString()}\n• Monthly Rent: ${Number(app.monthly_rent).toLocaleString()} ETB\n\n${statusExplanation}`,
        toolUsed: 'getApplicationStatus',
        data: appsRes.rows,
        suggestions: ['View application details', 'Browse more listings']
      };
    }

    // TOOL B: View Saved Favorites (Requires Authentication)
    if (lower.includes('saved') || lower.includes('favorite')) {
      if (!userId) {
        return {
          reply: 'Please sign in to view properties you have saved to your favorites.',
          suggestions: ['Log In']
        };
      }

      const favsRes = await query(
        `SELECT p.id, p.title, p.sub_city, p.monthly_rent, p.slug
         FROM favorites f
         JOIN properties p ON p.id = f.property_id
         WHERE f.user_id = $1
         LIMIT 5`,
        [userId]
      );

      return {
        reply: `You have ${favsRes.rows.length} saved properties in your favorites.`,
        toolUsed: 'getUserFavorites',
        data: favsRes.rows,
        suggestions: ['Browse more homes', 'Compare saved properties']
      };
    }

    // TOOL C: Policy / Legal / Regulatory Questions (RAG Tool)
    if (
      lower.includes('proclamation') ||
      lower.includes('deposit') ||
      lower.includes('law') ||
      lower.includes('commission') ||
      lower.includes('telebirr') ||
      lower.includes('fayda') ||
      lower.includes('verify') ||
      lower.includes('rule') ||
      lower.includes('how to list')
    ) {
      const rag = await SupportAssistantService.answerQuestion(cleanMsg);
      return {
        reply: rag.answer,
        toolUsed: 'getBetochPolicy',
        data: { sources: rag.sourceDocuments },
        suggestions: ['Find apartments in Bole', 'Check deposit calculator']
      };
    }

    // TOOL D: Property Search (Natural Language Search Tool)
    if (
      lower.includes('find') ||
      lower.includes('search') ||
      lower.includes('looking for') ||
      lower.includes('apartment') ||
      lower.includes('house') ||
      lower.includes('bedroom') ||
      lower.includes('bole') ||
      lower.includes('kazanchis') ||
      lower.includes('cmc') ||
      lower.includes('under')
    ) {
      const searchRes = await PropertySearchService.searchWithNaturalLanguage(cleanMsg, userId);
      return {
        reply: `Found ${searchRes.totalMatches} listings matching your criteria (${searchRes.interpretationSummary}). Here are the top matches:`,
        toolUsed: 'searchProperties',
        data: searchRes.properties.slice(0, 3),
        suggestions: [
          'Filter under 30,000 ETB',
          'Only show verified properties',
          'Properties with backup generator'
        ]
      };
    }

    // TOOL E: Default Conversational Guide
    await AIObservabilityService.recordRequest({
      feature: AIFeatureKey.AI_SUPPORT_ASSISTANT,
      userId,
      provider: 'local-rules-engine',
      model: 'betoch-assistant-v1',
      latencyMs: Date.now() - startTime,
      tokensUsed: 80,
      estimatedCostUsd: 0,
      success: true
    });

    return {
      reply: `Hello! I am your Betoch Rental Assistant. How can I help you today? You can ask me to find homes in Addis Ababa, explain Ethiopian rental laws, track your rental applications, or check Telebirr payment security.`,
      suggestions: [
        'Find 2-bedroom apartment in Bole under 35k',
        'What is the maximum security deposit allowed by law?',
        'How does Fayda ID verification work?',
        'Check my rental applications'
      ]
    };
  }

  static async createViewingRequest(
    userId: string,
    propertyId: string,
    proposedDate: string,
    timeSlot: 'MORNING_9_12' | 'AFTERNOON_12_3' | 'EVENING_3_6',
    notes?: string
  ): Promise<any> {
    const res = await query(
      `INSERT INTO property_viewing_requests (property_id, renter_id, proposed_date, time_slot, status, notes)
       VALUES ($1, $2, $3, $4, 'PENDING', $5)
       RETURNING id, property_id, renter_id, proposed_date, time_slot, status, created_at`,
      [propertyId, userId, proposedDate, timeSlot, notes || null]
    );

    return res.rows[0];
  }

  static async getPropertyViewingRequests(propertyId: string): Promise<any[]> {
    const res = await query(
      `SELECT vr.id, vr.proposed_date, vr.time_slot, vr.status, vr.notes, vr.created_at,
              u.email AS renter_email, u.phone AS renter_phone,
              up.first_name AS renter_first_name, up.last_name AS renter_last_name
       FROM property_viewing_requests vr
       JOIN users u ON u.id = vr.renter_id
       JOIN user_profiles up ON up.user_id = vr.renter_id
       WHERE vr.property_id = $1
       ORDER BY vr.proposed_date ASC, vr.created_at DESC`,
      [propertyId]
    );
    return res.rows;
  }
}
