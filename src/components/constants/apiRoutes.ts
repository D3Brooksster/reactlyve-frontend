// Base API URL
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://api.reactlyve.com/api';

// Auth Routes
export const AUTH_ROUTES = {
  GOOGLE: `${API_BASE_URL}/auth/google`,
  USER: `${API_BASE_URL}/auth/user`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,
};

// Message Routes
export const MESSAGE_ROUTES = {
  CREATE: `${API_BASE_URL}/messages/send`,
  GET_ALL: `${API_BASE_URL}/messages`,
  GET_BY_ID: (id: string) => `${API_BASE_URL}/messages/${id}`,
  DELETE: (id: string) => `${API_BASE_URL}/messages/${id}/delete`,
  VIEW: (id: string) => `${API_BASE_URL}/messages/view/${id}`,
  VERIFY_PASSCODE: (id: string) => `${API_BASE_URL}/messages/${id}/verify-passcode`,
  SHARED: (id: string) => `${API_BASE_URL}/messages/shared/${id}`,
};

export const MESSAGE_LINK_ROUTES = {
  CREATE: (messageId: string) => `${API_BASE_URL}/messages/${messageId}/links`,
  LIST: (messageId: string) => `${API_BASE_URL}/messages/${messageId}/links`,
  DELETE: (linkId: string) => `${API_BASE_URL}/messages/links/${linkId}`,
};

// Reaction Routes
export const REACTION_ROUTES = {
  UPLOAD: (messageId: string) => `${API_BASE_URL}/reactions/${messageId}`,
  GET_BY_MESSAGE_ID: (messageId: string) => `${API_BASE_URL}/reactions/message/${messageId}`,
  GET_BY_ID: (id: string) => `${API_BASE_URL}/reactions/${id}`,
  DELETE: (id: string) => `${API_BASE_URL}/messages/${id}/delete`,
  DOWNLOAD: (id: string) => `${API_BASE_URL}/reactions/${id}/download`,
};

// Reply Routes
export const REPLY_ROUTES = {
  UPLOAD: (reactionId: string) => `${API_BASE_URL}/reactions/${reactionId}/reply`,
};

// Admin Routes
export const ADMIN_ROUTES = {
  USERS: `${API_BASE_URL}/admin/users`,
  UPDATE_USER_ROLE: (userId: string) => `${API_BASE_URL}/admin/users/${userId}/role`,
  DELETE_USER: (userId: string) => `${API_BASE_URL}/admin/users/${userId}`,
  STATS: `${API_BASE_URL}/admin/stats`,
};
