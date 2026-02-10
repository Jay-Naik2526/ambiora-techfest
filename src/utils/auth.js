/* ============================================
   AMBIORA - AUTHENTICATION UTILITY
   ============================================ */

/**
 * Authentication Manager
 * Handles user registration, login, logout, and session management
 * Uses backend API with JWT tokens
 */

const API_URL = 'http://localhost:3001/api';

class AuthManager {
    constructor() {
        this.tokenKey = 'ambiora_token';
        this.userKey = 'ambiora_user';
    }

    /**
     * Get stored JWT token
     */
    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    /**
     * Save JWT token
     */
    setToken(token) {
        localStorage.setItem(this.tokenKey, token);
    }

    /**
     * Clear JWT token
     */
    clearToken() {
        localStorage.removeItem(this.tokenKey);
    }

    /**
     * Get currently logged in user from localStorage
     */
    getCurrentUser() {
        const user = localStorage.getItem(this.userKey);
        return user ? JSON.parse(user) : null;
    }

    /**
     * Set current user in localStorage
     */
    setCurrentUser(user) {
        localStorage.setItem(this.userKey, JSON.stringify(user));
    }

    /**
     * Clear current user from localStorage
     */
    clearCurrentUser() {
        localStorage.removeItem(this.userKey);
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return this.getToken() !== null && this.getCurrentUser() !== null;
    }

    /**
     * Get authorization headers for API requests
     */
    getAuthHeaders() {
        const token = this.getToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    }

    /**
     * Register a new user
     * @param {Object} userData - { name, email, phone, password }
     * @returns {Promise<Object>} { success: boolean, message: string, user?: Object }
     */
    async signup(userData) {
        try {
            const response = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();

            if (result.success) {
                // Save token and user data
                this.setToken(result.token);
                this.setCurrentUser(result.user);
            }

            return result;

        } catch (error) {
            console.error('Signup error:', error);
            return {
                success: false,
                message: 'Network error. Please check your connection and try again.'
            };
        }
    }

    /**
     * Login user
     * @param {Object} credentials - { email, password }
     * @returns {Promise<Object>} { success: boolean, message: string, user?: Object }
     */
    async login(credentials) {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });

            const result = await response.json();

            if (result.success) {
                // Save token and user data
                this.setToken(result.token);
                this.setCurrentUser(result.user);
            }

            return result;

        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: 'Network error. Please check your connection and try again.'
            };
        }
    }

    /**
     * Logout current user
     */
    logout() {
        this.clearToken();
        this.clearCurrentUser();
        return { success: true, message: 'Logged out successfully' };
    }

    /**
     * Fetch current user from backend
     * @returns {Promise<Object>} { success: boolean, user?: Object }
     */
    async fetchCurrentUser() {
        try {
            const response = await fetch(`${API_URL}/auth/user`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            const result = await response.json();

            if (result.success) {
                this.setCurrentUser(result.user);
            } else {
                // Token might be invalid, clear auth data
                this.clearToken();
                this.clearCurrentUser();
            }

            return result;

        } catch (error) {
            console.error('Fetch user error:', error);
            return {
                success: false,
                message: 'Network error'
            };
        }
    }

    /**
     * Save event registration
     * @param {Object} registrationData - { events, totalAmount, orderId, paymentSessionId, paymentStatus }
     * @returns {Promise<Object>}
     */
    async saveRegistration(registrationData) {
        try {
            const response = await fetch(`${API_URL}/registrations`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(registrationData)
            });

            const result = await response.json();
            return result;

        } catch (error) {
            console.error('Save registration error:', error);
            return {
                success: false,
                message: 'Network error saving registration'
            };
        }
    }

    /**
     * Get user's registrations
     * @returns {Promise<Object>}
     */
    async getRegistrations() {
        try {
            const response = await fetch(`${API_URL}/registrations`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            const result = await response.json();
            return result;

        } catch (error) {
            console.error('Get registrations error:', error);
            return {
                success: false,
                message: 'Network error fetching registrations'
            };
        }
    }

    /**
     * Update registration payment status
     * @param {string} orderId
     * @param {Object} updates - { paymentStatus, paymentDetails }
     * @returns {Promise<Object>}
     */
    async updateRegistration(orderId, updates) {
        try {
            const response = await fetch(`${API_URL}/registrations/${orderId}`, {
                method: 'PATCH',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(updates)
            });

            const result = await response.json();
            return result;

        } catch (error) {
            console.error('Update registration error:', error);
            return {
                success: false,
                message: 'Network error updating registration'
            };
        }
    }

    /**
     * Redirect to login page with return URL
     * @param {string} returnUrl - URL to return to after login
     */
    redirectToLogin(returnUrl = null) {
        const url = returnUrl || window.location.href;
        window.location.href = `/login.html?returnUrl=${encodeURIComponent(url)}`;
    }

    /**
     * Get return URL from query parameters
     */
    getReturnUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('returnUrl') || '/events.html';
    }
}

// Create singleton instance
const authManager = new AuthManager();

// Export functions
export const signup = (userData) => authManager.signup(userData);
export const login = (credentials) => authManager.login(credentials);
export const logout = () => authManager.logout();
export const isAuthenticated = () => authManager.isAuthenticated();
export const getCurrentUser = () => authManager.getCurrentUser();
export const fetchCurrentUser = () => authManager.fetchCurrentUser();
export const saveRegistration = (data) => authManager.saveRegistration(data);
export const getRegistrations = () => authManager.getRegistrations();
export const updateRegistration = (orderId, updates) => authManager.updateRegistration(orderId, updates);
export const redirectToLogin = (returnUrl) => authManager.redirectToLogin(returnUrl);
export const getReturnUrl = () => authManager.getReturnUrl();

export default authManager;
