// ==============================================================================
// BETOCH API CLIENT
// ==============================================================================

const API_BASE = '/api/v1';

export function getAuthToken(): string | null {
  return localStorage.getItem('betoch_token');
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem('betoch_token', token);
  } else {
    localStorage.removeItem('betoch_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data?.error?.message || data?.message || 'An error occurred. Please try again.';
    throw new Error(errorMsg);
  }

  return data.data !== undefined ? data.data : data;
}

export const api = {
  // Auth
  login: (body: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request<any>('/auth/me'),
  logout: () => request<any>('/auth/logout', { method: 'POST' }),

  // Properties
  searchProperties: (params: Record<string, any>) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, String(v));
      }
    });
    return request<any>(`/properties?${query.toString()}`);
  },
  getProperty: (idOrSlug: string) => request<any>(`/properties/${idOrSlug}`),
  createProperty: (body: any) => request<any>('/properties', { method: 'POST', body: JSON.stringify(body) }),
  getMyListings: () => request<any[]>('/properties/my-listings'),

  // Favorites
  getFavorites: () => request<any[]>('/favorites'),
  addFavorite: (propertyId: string, collectionName?: string) =>
    request<any>(`/favorites/${propertyId}`, {
      method: 'POST',
      body: collectionName ? JSON.stringify({ collectionName }) : undefined
    }),
  removeFavorite: (propertyId: string) => request<any>(`/favorites/${propertyId}`, { method: 'DELETE' }),

  // Applications
  submitApplication: (body: any) => request<any>('/applications', { method: 'POST', body: JSON.stringify(body) }),
  getMyApplications: () => request<any[]>('/applications/my-applications'),
  getPropertyApplications: (propertyId: string) => request<any[]>(`/applications/property/${propertyId}`),
  updateApplicationStatus: (id: string, status: string, reason?: string) =>
    request<any>(`/applications/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, reason }) }),

  // Contracts
  completeRental: (applicationId: string, governmentRegistrationNo?: string) =>
    request<any>('/contracts/complete-rental', {
      method: 'POST',
      body: JSON.stringify({ applicationId, governmentRegistrationNo })
    }),
  getContract: (id: string) => request<any>(`/contracts/${id}`),

  // Payments & Telebirr
  initiateTelebirr: (contractId: string, amount: number, paymentType: 'COMMISSION' | 'DEPOSIT' | 'RENT') =>
    request<any>('/payments/telebirr/initiate', {
      method: 'POST',
      body: JSON.stringify({ contractId, amount, paymentType })
    }),
  simulateMockPayment: (outTradeNo: string) =>
    request<any>(`/payments/mock-simulate/${outTradeNo}`, { method: 'POST' }),
  getPaymentStatus: (outTradeNo: string) => request<any>(`/payments/${outTradeNo}/status`),

  // Verifications
  submitIdentityVerification: (body: any) =>
    request<any>('/verification', { method: 'POST', body: JSON.stringify(body) }),
  getIdentityStatus: () => request<any>('/verification/status'),
  reviewIdentityVerification: (id: string, decision: string, rejectionReason?: string) =>
    request<any>(`/verification/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ decision, rejectionReason })
    }),

  // National ID / Fayda Modular Verification Endpoints
  startIdentityVerification: (body?: { verificationType?: string; redirectUrl?: string }) =>
    request<any>('/identity-verification/start', {
      method: 'POST',
      body: JSON.stringify(body || {})
    }),
  getNationalIdentityStatus: () =>
    request<any>('/identity-verification/status'),
  retryIdentityVerification: () =>
    request<any>('/identity-verification/retry', {
      method: 'POST'
    }),
  simulateMockVerification: (body: { state: string; outcome?: 'APPROVED' | 'REJECTED'; failureReason?: string }) =>
    request<any>('/identity-verification/mock/simulate', {
      method: 'POST',
      body: JSON.stringify(body)
    }),
  revokeIdentityVerification: (userId: string, reason: string) =>
    request<any>(`/identity-verification/revoke/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    }),


  // Messaging
  getConversations: () => request<any[]>('/conversations'),
  startConversation: (body: any) => request<any>('/conversations', { method: 'POST', body: JSON.stringify(body) }),
  getMessages: (id: string) => request<any[]>(`/conversations/${id}/messages`),
  sendMessage: (id: string, content: string) =>
    request<any>(`/conversations/${id}/messages`, { method: 'POST', body: JSON.stringify({ content }) }),

  // Reviews & Reports
  submitReview: (body: any) => request<any>('/reviews', { method: 'POST', body: JSON.stringify(body) }),
  getPropertyReviews: (propertyId: string) => request<any[]>(`/reviews/property/${propertyId}`),
  submitReport: (body: any) => request<any>('/reports', { method: 'POST', body: JSON.stringify(body) }),

  // Admin
  getAdminAnalytics: () => request<any>('/admin/analytics'),
  getPendingVerifications: () => request<any[]>('/admin/verifications/pending'),
  getPendingProperties: () => request<any[]>('/admin/properties/pending'),
  reviewProperty: (id: string, decision: string, notes?: string) =>
    request<any>(`/admin/properties/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ decision, notes })
    }),
  getAdminCommissions: () => request<any[]>('/admin/commissions'),
  getAdminReports: () => request<any[]>('/admin/reports'),
  getAdminAuditLogs: () => request<any[]>('/admin/audit-logs'),

  // Uploads
  uploadFile: async (file: File, type: 'property-image' | 'document') => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/uploads/${type}`, {
      method: 'POST',
      headers,
      body: formData
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || 'Upload failed.');
    return data.data;
  },

  // AI Intelligence Layer Endpoints
  searchNaturalLanguage: (query: string) =>
    request<any>('/ai/search', { method: 'POST', body: JSON.stringify({ query }) }),
  getRecommendations: () => request<any>('/ai/recommendations'),
  calculatePreferenceMatch: (propertyId: string, preferences: any) =>
    request<any>('/ai/match', { method: 'POST', body: JSON.stringify({ propertyId, preferences }) }),
  generateDescription: (body: any) =>
    request<any>('/ai/description/generate', { method: 'POST', body: JSON.stringify(body) }),
  analyzeQuality: (body: any) =>
    request<any>('/ai/quality/analyze', { method: 'POST', body: JSON.stringify(body) }),
  estimatePrice: (body: any) =>
    request<any>('/ai/pricing/estimate', { method: 'POST', body: JSON.stringify(body) }),
  analyzePhotos: (imageUrls: string[]) =>
    request<any[]>('/ai/photos/analyze', { method: 'POST', body: JSON.stringify({ imageUrls }) }),
  compareProperties: (propertyIds: string[]) =>
    request<any>('/ai/properties/compare', { method: 'POST', body: JSON.stringify({ propertyIds }) }),
  chatWithAssistant: (message: string, conversationHistory: any[] = []) =>
    request<any>('/ai/assistant/chat', { method: 'POST', body: JSON.stringify({ message, conversationHistory }) }),
  createViewingRequest: (body: { propertyId: string; proposedDate: string; timeSlot: string; notes?: string }) =>
    request<any>('/ai/viewings', { method: 'POST', body: JSON.stringify(body) }),
  getPropertyViewings: (propertyId: string) => request<any[]>(`/ai/viewings/property/${propertyId}`),
  submitAiFeedback: (feature: string, rating: 'POSITIVE' | 'NEGATIVE', resourceId?: string, comment?: string) =>
    request<any>('/ai/feedback', { method: 'POST', body: JSON.stringify({ feature, rating, resourceId, comment }) }),
  getRiskReport: (type: 'user' | 'property', id: string) => request<any>(`/ai/risk/${type}/${id}`),
  getAdminAIMetrics: () => request<any>('/ai/admin/metrics'),
  getAdminFeatureFlags: () => request<any[]>('/ai/admin/feature-flags'),
  toggleFeatureFlag: (featureKey: string, isEnabled: boolean) =>
    request<any>('/ai/admin/feature-flags/toggle', { method: 'POST', body: JSON.stringify({ featureKey, isEnabled }) }),

  // Notifications
  getNotifications: (params?: { limit?: number; unreadOnly?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.limit) q.append('limit', String(params.limit));
    if (params?.unreadOnly) q.append('unreadOnly', 'true');
    return request<{ notifications: any[]; unreadCount: number }>(`/notifications?${q.toString()}`);
  },
  markNotificationAsRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsAsRead: () => request<any>('/notifications/mark-all-read', { method: 'POST' }),
  deleteNotification: (id: string) => request<any>(`/notifications/${id}`, { method: 'DELETE' }),

  // Saved Searches
  getSavedSearches: () => request<any[]>('/saved-searches'),
  createSavedSearch: (body: { name: string; filters: any; notifyEmail?: boolean; notifyInApp?: boolean }) =>
    request<any>('/saved-searches', { method: 'POST', body: JSON.stringify(body) }),
  deleteSavedSearch: (id: string) => request<any>(`/saved-searches/${id}`, { method: 'DELETE' }),

  // Viewing Appointments
  getMyViewingRequests: () => request<any[]>('/viewings/my-requests'),
  getOwnerViewingRequests: () => request<any[]>('/viewings/owner-requests'),
  updateViewingStatus: (id: string, status: string, rejectionReason?: string) =>
    request<any>(`/viewings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, rejectionReason }) }),

  // Property Price Update
  updatePropertyPrice: (id: string, monthlyRent: number, depositAmount: number) =>
    request<any>(`/properties/${id}/price`, { method: 'PATCH', body: JSON.stringify({ monthlyRent, depositAmount }) }),

  // Owner Public Profile
  getOwnerProfile: (ownerId: string) => request<{ owner: any; properties: any[] }>(`/properties/owner/${ownerId}/profile`)
};

