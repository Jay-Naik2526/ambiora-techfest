/* ============================================
   AMBIORA - MAIN ENTRY POINT
   ============================================ */

import './styles/global.css';
import { setupScrollAnimations, animateCrossMarkers } from './utils/animations.js';
import { initLoader } from './components/Loader.js';
import { initPageTransitions } from './components/Preloader.js';
import { initCart } from './components/Cart.js';
import { isAuthenticated, getCurrentUser, logout } from './utils/auth.js';

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initLoader(); // Show load.gif on first visit to home page
    initPageTransitions(); // Setup minimal loading bar for page transitions
    initializeApp();
});

function initializeApp() {
    // Create grid background
    createGridBackground();

    // Add cross markers
    createCrossMarkers();

    // Setup scroll animations
    setupScrollAnimations();

    // Animate cross markers
    animateCrossMarkers();

    // Initialize navigation
    initNavigation();

    // Initialize Cart (Global)
    initCart();

    // Update navigation with auth status
    updateNavigationAuth();
}

/**
 * Create the animated grid background
 */
function createGridBackground() {
    const gridBg = document.createElement('div');
    gridBg.className = 'grid-background';
    document.body.prepend(gridBg);
}

/**
 * Create floating cross markers
 */
function createCrossMarkers() {
    const container = document.createElement('div');
    container.className = 'cross-markers-container';
    container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1;
    overflow: hidden;
  `;

    // Create 5 cross markers at different positions
    const positions = [
        { top: '15%', left: '10%' },
        { top: '25%', left: '30%' },
        { top: '20%', left: '50%' },
        { top: '30%', left: '70%' },
        { top: '18%', left: '90%' }
    ];

    positions.forEach(pos => {
        const cross = document.createElement('div');
        cross.className = 'cross-marker';
        cross.style.top = pos.top;
        cross.style.left = pos.left;
        container.appendChild(cross);
    });

    document.body.appendChild(container);
}

/**
 * Initialize navigation functionality
 */
function initNavigation() {
    const menuBtn = document.querySelector('.nav-menu-btn');
    const navMenu = document.querySelector('.nav-menu');

    if (menuBtn && navMenu) {
        menuBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            menuBtn.classList.toggle('active');
        });
    }

    // Close menu on link click
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu) navMenu.classList.remove('active');
            if (menuBtn) menuBtn.classList.remove('active');
        });
    });
}

/**
 * Update navigation based on authentication status
 */
function updateNavigationAuth() {
    const profileLinks = document.querySelectorAll('a[href="#profile"]');

    if (isAuthenticated()) {
        const user = getCurrentUser();

        profileLinks.forEach(link => {
            // Update to My Profile page
            link.setAttribute('href', '/profile.html');
            link.setAttribute('data-tooltip', 'My Profile');

            // Add right-click context menu for logout
            link.addEventListener('contextmenu', (e) => {
                e.preventDefault();

                // Show confirmation
                if (confirm('Logout from your account?')) {
                    logout();
                    window.location.href = '/';
                }
            });
        });
    } else {
        profileLinks.forEach(link => {
            // Update to login link
            link.setAttribute('href', '/login.html');
            link.setAttribute('data-tooltip', 'Login');
        });
    }
}

// Export for page-specific scripts
export { initializeApp };
