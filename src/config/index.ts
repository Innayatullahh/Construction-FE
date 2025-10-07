export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001',
  nodeEnv: import.meta.env.NODE_ENV || 'development',
  isDevelopment: import.meta.env.NODE_ENV === 'development',
  isProduction: import.meta.env.NODE_ENV === 'production',
  
  // Database configuration
  database: {
    name: 'construction_db',
    version: 1,
  },
  
  // Sync configuration
  sync: {
    interval: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 5000, // 5 seconds
  },
};
