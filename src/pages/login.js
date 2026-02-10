/* ============================================
   AMBIORA - LOGIN PAGE SCRIPT
   ============================================ */

import { login, isAuthenticated, getReturnUrl } from '../utils/auth.js';

document.addEventListener('DOMContentLoaded', () => {
    // Redirect if already logged in
    if (isAuthenticated()) {
        window.location.href = getReturnUrl();
        return;
    }

    initLoginPage();
});

function initLoginPage() {
    const form = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const submitBtn = document.getElementById('submit-btn');
    const alert = document.getElementById('auth-alert');
    const alertMessage = document.getElementById('auth-alert-message');

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Clear previous errors
        clearErrors();
        hideAlert();

        // Get form data
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Validate
        let hasError = false;

        if (!email) {
            showFieldError('email', 'Email is required');
            hasError = true;
        } else if (!isValidEmail(email)) {
            showFieldError('email', 'Please enter a valid email');
            hasError = true;
        }

        if (!password) {
            showFieldError('password', 'Password is required');
            hasError = true;
        }

        if (hasError) return;

        // Show loading state
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        // Attempt login (now async)
        const result = await login({ email, password });

        // Remove loading state
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;

        if (result.success) {
            // Show success message
            showAlert(result.message, 'success');

            // Redirect after short delay
            setTimeout(() => {
                window.location.href = getReturnUrl();
            }, 800);
        } else {
            // Show error message
            showAlert(result.message, 'error');
        }
    });

    // Real-time validation
    emailInput.addEventListener('blur', () => {
        const email = emailInput.value.trim();
        if (email && !isValidEmail(email)) {
            showFieldError('email', 'Please enter a valid email');
        } else {
            clearFieldError('email');
        }
    });

    // Clear error on input
    emailInput.addEventListener('input', () => clearFieldError('email'));
    passwordInput.addEventListener('input', () => clearFieldError('password'));
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Show field error
 */
function showFieldError(fieldName, message) {
    const input = document.getElementById(fieldName);
    const error = document.getElementById(`${fieldName}-error`);

    if (input) input.classList.add('error');
    if (error) {
        error.textContent = message;
        error.classList.add('visible');
    }
}

/**
 * Clear field error
 */
function clearFieldError(fieldName) {
    const input = document.getElementById(fieldName);
    const error = document.getElementById(`${fieldName}-error`);

    if (input) input.classList.remove('error');
    if (error) {
        error.textContent = '';
        error.classList.remove('visible');
    }
}

/**
 * Clear all errors
 */
function clearErrors() {
    clearFieldError('email');
    clearFieldError('password');
}

/**
 * Show alert message
 */
function showAlert(message, type = 'error') {
    const alert = document.getElementById('auth-alert');
    const alertMessage = document.getElementById('auth-alert-message');

    if (alert && alertMessage) {
        alertMessage.textContent = message;
        alert.className = `auth-alert ${type} visible`;
    }
}

/**
 * Hide alert message
 */
function hideAlert() {
    const alert = document.getElementById('auth-alert');
    if (alert) {
        alert.classList.remove('visible');
    }
}
