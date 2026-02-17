/* ============================================
   AMBIORA - SIGNUP PAGE SCRIPT
   ============================================ */

import { signup, isAuthenticated, getReturnUrl } from '../utils/auth.js';

document.addEventListener('DOMContentLoaded', () => {
    // Redirect if already logged in
    if (isAuthenticated()) {
        window.location.href = getReturnUrl();
        return;
    }

    initSignupPage();
});

function initSignupPage() {
    const form = document.getElementById('signup-form');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const sapIdInput = document.getElementById('sapId'); // Added sapId input
    const phoneInput = document.getElementById('phone');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const submitBtn = document.getElementById('submit-btn');

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Clear previous errors
        clearErrors();
        hideAlert();

        // Get form data
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const phone = phoneInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // Validate
        let hasError = false;

        if (!name) {
            showFieldError('name', 'Name is required');
            hasError = true;
        } else if (name.length < 2) {
            showFieldError('name', 'Name must be at least 2 characters');
            hasError = true;
        }

        if (!email) {
            showFieldError('email', 'Email is required');
            hasError = true;
        } else if (!isValidEmail(email)) {
            showFieldError('email', 'Please enter a valid email');
            hasError = true;
        }

        if (!phone) {
            showFieldError('phone', 'Phone number is required');
            hasError = true;
        } else if (!isValidPhone(phone)) {
            showFieldError('phone', 'Phone number must be 10 digits');
            hasError = true;
        }

        if (!password) {
            showFieldError('password', 'Password is required');
            hasError = true;
        } else if (password.length < 6) {
            showFieldError('password', 'Password must be at least 6 characters');
            hasError = true;
        }

        if (!confirmPassword) {
            showFieldError('confirm-password', 'Please confirm your password');
            hasError = true;
        } else if (password !== confirmPassword) {
            showFieldError('confirm-password', 'Passwords do not match');
            hasError = true;
        }

        if (hasError) return;

        // Show loading state
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        const sapId = sapIdInput.value.trim();

        // Attempt signup (now async)
        const result = await signup({ name, email, phone, sapId, password });

        // Remove loading state
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;

        if (result.success) {
            // Show success message
            showAlert(result.message, 'success');

            // Redirect after short delay
            setTimeout(() => {
                window.location.href = '/events.html';
            }, 1000);
        } else {
            // Show error message
            showAlert(result.message, 'error');
        }
    });

    // Real-time validation
    nameInput.addEventListener('blur', () => {
        const name = nameInput.value.trim();
        if (name && name.length < 2) {
            showFieldError('name', 'Name must be at least 2 characters');
        } else {
            clearFieldError('name');
        }
    });

    emailInput.addEventListener('blur', () => {
        const email = emailInput.value.trim();
        if (email && !isValidEmail(email)) {
            showFieldError('email', 'Please enter a valid email');
        } else {
            clearFieldError('email');
        }
    });

    phoneInput.addEventListener('blur', () => {
        const phone = phoneInput.value.trim();
        if (phone && !isValidPhone(phone)) {
            showFieldError('phone', 'Phone number must be 10 digits');
        } else {
            clearFieldError('phone');
        }
    });

    phoneInput.addEventListener('input', () => {
        // Only allow digits
        phoneInput.value = phoneInput.value.replace(/\D/g, '');
    });

    passwordInput.addEventListener('blur', () => {
        const password = passwordInput.value;
        if (password && password.length < 6) {
            showFieldError('password', 'Password must be at least 6 characters');
        } else {
            clearFieldError('password');
        }
    });

    confirmPasswordInput.addEventListener('blur', () => {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        if (confirmPassword && password !== confirmPassword) {
            showFieldError('confirm-password', 'Passwords do not match');
        } else {
            clearFieldError('confirm-password');
        }
    });

    // Clear errors on input
    nameInput.addEventListener('input', () => clearFieldError('name'));
    emailInput.addEventListener('input', () => clearFieldError('email'));
    phoneInput.addEventListener('input', () => clearFieldError('phone'));
    passwordInput.addEventListener('input', () => clearFieldError('password'));
    confirmPasswordInput.addEventListener('input', () => clearFieldError('confirm-password'));
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate phone number (10 digits)
 */
function isValidPhone(phone) {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
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
    clearFieldError('name');
    clearFieldError('email');
    clearFieldError('phone');
    clearFieldError('password');
    clearFieldError('confirm-password');
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
