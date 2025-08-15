/**
 * API Configuration
 */

// Определяем базовый URL для API
export const API_BASE_URL = import.meta.env.PROD 
  ? 'https://moloco-crm-backend.onrender.com'  // Production Render URL (WORKING!)
  : 'http://localhost:8000';  // Development URL

// API endpoints
export const API_ENDPOINTS = {
  reports: `${API_BASE_URL}/reports`,
  clearReports: `${API_BASE_URL}/clear-reports`,
  upload: `${API_BASE_URL}/upload`,
  apps: `${API_BASE_URL}/apps`,
} as const;

export default API_BASE_URL;
