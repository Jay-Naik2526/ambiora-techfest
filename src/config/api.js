/* ============================================
   AMBIORA - API CONFIGURATION
   ============================================ */

/**
 * API Configuration
 * Automatically detects environment and uses correct backend URL
 */

// Detect environment
const isDevelopment = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '';

const isProduction = !isDevelopment;

// Backend URLs
export const API_CONFIG = {
    // Development: Local backend server
    DEVELOPMENT_URL: 'http://localhost:3001',

    // Production: Vercel backend
    PRODUCTION_URL: 'https://ambiora-techfest.vercel.app',

    // Get current backend URL based on environment
    get BASE_URL() {
        return isDevelopment ? this.DEVELOPMENT_URL : this.PRODUCTION_URL;
    },

    // Get API endpoint URL
    get API_URL() {
        return `${this.BASE_URL}/api`;
    },

    // Environment info
    isDevelopment,
    isProduction,

    // Log current configuration (for debugging)
    log() {
        console.log('🔧 API Configuration:', {
            environment: isDevelopment ? 'Development' : 'Production',
            baseUrl: this.BASE_URL,
            apiUrl: this.API_URL,
            hostname: window.location.hostname
        });
    }
};

// Export helper functions
export const getApiUrl = (endpoint) => {
    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${API_CONFIG.API_URL}/${cleanEndpoint}`;
};

export const getBaseUrl = () => API_CONFIG.BASE_URL;

// Log configuration on load (only in development)
if (isDevelopment) {
    API_CONFIG.log();
}

export default API_CONFIG;
