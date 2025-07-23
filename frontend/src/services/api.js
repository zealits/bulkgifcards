import axios from "axios";

const API_BASE_URL = "https://bulkgiftcard.aiiventure.com/api";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: (userData) => api.post("/auth/register", userData),
  login: (credentials) => api.post("/auth/login", credentials),
  verifyEmail: (token) => api.get(`/auth/verify-email?token=${token}`),
};

// Dashboard API calls
export const dashboardAPI = {
  getStats: () => api.get("/dashboard/stats"),
  uploadFile: (formData) =>
    api.post("/dashboard/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
  getEmailLists: (page = 1, limit = 10) => api.get(`/dashboard/email-lists?page=${page}&limit=${limit}`),
  getEmailList: (id) => api.get(`/dashboard/email-lists/${id}`),
  deleteEmailList: (id) => api.delete(`/dashboard/email-lists/${id}`),
  getEmails: (listId, page = 1, limit = 50) => api.get(`/dashboard/emails/${listId}?page=${page}&limit=${limit}`),
};

// Gift Card API calls
export const giftCardAPI = {
  getCampaigns: () => api.get("/giftcards/campaigns"),
  sendGiftCards: (data) => api.post("/giftcards/send", data),
  getHistory: (page = 1, limit = 20) => api.get(`/giftcards/history?page=${page}&limit=${limit}`),
  getStats: () => api.get("/giftcards/stats"),
  getStatus: (id) => api.get(`/giftcards/${id}/status`),
  cancelGiftCard: (id) => api.delete(`/giftcards/${id}`),
};

export default api;
