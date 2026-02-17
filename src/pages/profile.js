/* ============================================
   AMBIORA - PROFILE PAGE SCRIPT
   ============================================ */

import { fetchCurrentUser, redirectToLogin, isAuthenticated, logout } from '../utils/auth.js';
import { API_CONFIG } from '../config/api.js';

document.addEventListener('DOMContentLoaded', () => {
    if (!isAuthenticated()) {
        redirectToLogin('/profile.html');
        return;
    }

    initProfilePage();
});

async function initProfilePage() {
    const form = document.getElementById('profile-form');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const sapIdInput = document.getElementById('sapId');
    const phoneInput = document.getElementById('phone');
    const saveBtn = document.getElementById('save-btn');
    const logoutBtn = document.getElementById('logout-btn');

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                logout();
                window.location.href = '/login.html';
            }
        });
    }

    // 1. Fetch current user data
    if (saveBtn) setLoading(true, saveBtn, 'Loading...');

    const result = await fetchCurrentUser();

    if (saveBtn) setLoading(false, saveBtn);

    if (result.success && result.user) {
        // Populate form
        if (nameInput) nameInput.value = result.user.name || '';
        if (emailInput) emailInput.value = result.user.email || '';
        if (sapIdInput) sapIdInput.value = result.user.sapId || '';
        if (phoneInput) phoneInput.value = result.user.phone || '';
    } else {
        showAlert('Failed to load profile data', 'error');
    }

    // 2. Handle Form Submission
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = nameInput.value.trim();
            const phone = phoneInput.value.trim();
            const sapId = sapIdInput.value.trim();

            if (!name || !phone) {
                showAlert('Name and Phone are required', 'error');
                return;
            }

            // Basic SAP ID validation if provided
            if (sapId && sapId.length < 3) {
                showAlert('Please enter a valid SAP ID', 'error');
                return;
            }

            setLoading(true, saveBtn);

            try {
                // Call API to update profile
                const response = await fetch(`${API_CONFIG.API_URL}/auth/profile`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('ambiora_token')}`
                    },
                    body: JSON.stringify({ name, phone, sapId })
                });

                const updateResult = await response.json();

                if (updateResult.success) {
                    showAlert('Profile updated successfully!', 'success');
                    // Optional: Update local user data if stored
                } else {
                    showAlert(updateResult.message || 'Failed to update profile', 'error');
                }

            } catch (error) {
                console.error('Update error:', error);
                showAlert('Network error. Please try again.', 'error');
            } finally {
                setLoading(false, saveBtn);
            }
        });
    }
}

function setLoading(isLoading, btn, text = 'Saving...') {
    if (!btn) return;
    if (isLoading) {
        btn.classList.add('loading');
        btn.disabled = true;
        btn.textContent = text;
    } else {
        btn.classList.remove('loading');
        btn.disabled = false;
        btn.textContent = 'Save Changes';
    }
}

function showAlert(message, type = 'info') {
    const alert = document.getElementById('profile-alert');
    const alertMessage = document.getElementById('profile-alert-message');

    if (alert && alertMessage) {
        alertMessage.textContent = message;
        alert.className = `auth-alert ${type} visible`;

        // Auto hide after 3 seconds if success
        if (type === 'success') {
            setTimeout(() => {
                alert.classList.remove('visible');
            }, 3000);
        }
    }
}
