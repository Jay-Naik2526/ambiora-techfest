/* ============================================
   AMBIORA - HOME PAGE SCRIPTS
   ============================================ */

import anime from 'animejs';
import { animateCrossMarkers, setupScrollAnimations } from '../utils/animations.js';

document.addEventListener('DOMContentLoaded', () => {
    initHomePage();
});

function initHomePage() {
    // Animate hero elements on load
    animateHero();

    // Setup scroll-triggered animations
    setupScrollAnimations();

    // Add scroll listener for header
    setupHeaderScroll();

    // Initialize navigation menu
    initMobileMenu();
}

/**
 * Animate hero section elements
 */
function animateHero() {
    const timeline = anime.timeline({
        easing: 'easeOutExpo'
    });

    // Hero title lines animation is handled by CSS
    // Add any additional JS animations here if needed

    // Animate stats with stagger
    anime({
        targets: '.hero-stat',
        opacity: [0, 1],
        translateY: [20, 0],
        delay: anime.stagger(100, { start: 1000 }),
        easing: 'easeOutQuad',
        duration: 600
    });
}

/**
 * Setup header background on scroll
 */
function setupHeaderScroll() {
    const header = document.querySelector('.nav-header');
    if (!header) return;

    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    });
}

/**
 * Initialize mobile menu toggle
 */
function initMobileMenu() {
    const menuBtn = document.querySelector('.nav-menu-btn');
    const navMenu = document.querySelector('.nav-menu');

    if (!menuBtn || !navMenu) return;

    menuBtn.addEventListener('click', () => {
        menuBtn.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close menu when clicking a link
    document.querySelectorAll('.nav-menu-link').forEach(link => {
        link.addEventListener('click', () => {
            menuBtn.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !menuBtn.contains(e.target)) {
            menuBtn.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });
}

export { initHomePage };
