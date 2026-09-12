const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const defaultHeaders = {
    "Content-Type": "application/json",
  };
  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const res = await fetch(url, config);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(errorData.detail || `Request failed with status ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`API Error on [${config.method || 'GET'}] ${path}:`, err);
    throw err;
  }
}

export const api = {
  // Queue operations
  getQueue: (status) => request(`/api/queue${status ? `?status=${status}` : ''}`),
  getAllQueue: () => request('/api/queue/all'),
  getQueueEntry: (id) => request(`/api/queue/${id}`),
  addToQueue: (data) => request('/api/queue', { method: 'POST', body: JSON.stringify(data) }),
  updateQueueStatus: (id, status, tableId = null) => 
    request(`/api/queue/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, table_id: tableId }) }),
  notifyGuest: (id) => request(`/api/queue/${id}/notify`, { method: 'POST' }),
  seatParty: (waitlistId, tableId) => 
    request('/api/queue/seat', { method: 'POST', body: JSON.stringify({ waitlist_id: waitlistId, table_id: tableId }) }),

  // Table operations
  getTables: () => request('/api/tables'),
  updateTableStatus: (id, data) => 
    request(`/api/tables/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  clearTable: (id) => request(`/api/tables/${id}/clear`, { method: 'POST' }),
  markTableReady: (id) => request(`/api/tables/${id}/ready`, { method: 'POST' }),

  // AI features
  getWaitPrediction: (partySize, preference) => 
    request(`/api/ai/predict-wait?party_size=${partySize}&preference=${encodeURIComponent(preference)}`),
  getTableRecommendations: (waitlistId) => 
    request(`/api/ai/recommend-tables/${waitlistId}`),
  chatWithAI: (messages, portal = 'guest', context = {}) => 
    request('/api/ai/chat', { 
      method: 'POST', 
      body: JSON.stringify({ messages, portal, context }) 
    }),

  // Notifications (Simulated SMS)
  getNotifications: (phone = null) => 
    request(`/api/notifications${phone ? `?phone=${encodeURIComponent(phone)}` : ''}`),

  // Demo utilities
  resetDemoData: () => request('/api/demo/reset', { method: 'POST' }),
};
