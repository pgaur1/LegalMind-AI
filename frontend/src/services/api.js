/**
 * API Service - Connects React UI to FastAPI Backend
 * Backend: http://localhost:8002
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002';

/**
 * Research API - Legal Research with RAG
 */
export const researchAPI = {
  /**
   * Send research query to backend
   * @param {string} query - User's legal research question
   * @param {Array} chatHistory - Previous chat messages
   * @param {string} userId - User identifier
   */
  async chat(query, chatHistory = [], userId = 'user_001') {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/research/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          chat_history: chatHistory,
          user_id: userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Research API Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

/**
 * Drafts API - Legal Document Generation
 */
export const draftsAPI = {
  /**
   * Generate legal draft
   * @param {Object} params - Draft parameters
   * @param {string} params.draft_type - Type of document (legal_notice, petition, etc)
   * @param {string} params.client_name - Client's name
   * @param {string} params.opponent_name - Opponent's name
   * @param {string} params.case_description - Case description
   * @param {string} params.legal_context - Legal context and provisions
   */
  async generate(params) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/drafts/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Draft API Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Get all drafts
   */
  async getAll(userId = 'user_001') {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/drafts/?user_id=${userId}`);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Get Drafts Error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get specific draft
   */
  async getOne(draftId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/drafts/${draftId}`);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Get Draft Error:', error);
      return { success: false, error: error.message };
    }
  },
};

/**
 * Precedents API - Legal Precedent Search
 */
export const precedentsAPI = {
  /**
   * Search precedents
   */
  async search(query, filters = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/precedents/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          limit: filters.limit || 5,
          filters: filters,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Precedents API Error:', error);
      return { success: false, error: error.message };
    }
  },
};

/**
 * Health Check
 */
export const healthAPI = {
  async check() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      return { success: response.ok, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
};

export default {
  research: researchAPI,
  drafts: draftsAPI,
  precedents: precedentsAPI,
  health: healthAPI,
};
