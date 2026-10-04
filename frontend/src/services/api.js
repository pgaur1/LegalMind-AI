/**
 * API Service - Connects React UI to FastAPI Backend
 * Set VITE_API_BASE_URL when the backend is on a different origin. Otherwise,
 * requests use the current origin (and the Vite dev proxy in local development).
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || '';

async function readEventStream(response, onEvent) {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `API Error: ${response.status} ${response.statusText}`);
  }
  if (!response.body) throw new Error('Streaming response body is unavailable.');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const dispatchEvents = () => {
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() || '';
    for (const block of blocks) {
      const data = block
        .split(/\r?\n/)
        .filter(line => line.startsWith('data:'))
        .map(line => line.slice(5).trim())
        .join('\n');
      if (data) onEvent(JSON.parse(data));
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    dispatchEvents();
    if (done) break;
  }

  if (buffer.trim()) {
    const data = buffer.split(/\r?\n/).find(line => line.startsWith('data:'))?.slice(5).trim();
    if (data) onEvent(JSON.parse(data));
  }
}

async function postEventStream(path, params, { signal, onToken, onStatus } = {}) {
  let result;
  await readEventStream(
    await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal,
    }),
    event => {
      if (event.type === 'delta') onToken?.(event.content);
      else if (event.type === 'status') onStatus?.(event.message);
      else if (event.type === 'complete') result = event.data;
      else if (event.type === 'error') throw new Error(event.message || 'Generation failed.');
    },
  );
  if (!result) throw new Error('Generation ended before a completed response was received.');
  return result;
}

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

  async streamChat(query, chatHistory = [], userId = 'user_001', options = {}) {
    try {
      const data = await postEventStream('/api/v1/research/chat/stream', {
        query,
        chat_history: chatHistory,
        user_id: userId,
      }, options);
      return { success: true, data };
    } catch (error) {
      console.error('Research streaming API Error:', error);
      return { success: false, error: error.message };
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
  async generate(params, { signal } = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/drafts/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
        signal,
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

  async generateStream(params, options = {}) {
    try {
      const data = await postEventStream('/api/v1/drafts/generate/stream', params, options);
      return { success: true, data };
    } catch (error) {
      console.error('Draft streaming API Error:', error);
      return { success: false, error: error.message };
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
