/* ============================================
   AMBIORA - TEAM PAGE SCRIPTS
   ============================================ */

import anime from 'animejs';
import { setupScrollAnimations, revealImage, hideImage } from '../utils/animations.js';

document.addEventListener('DOMContentLoaded', () => {
    initTeamPage();
});

function initTeamPage() {
    // Setup scroll animations
    setupScrollAnimations();

    // Setup header scroll behavior
    setupHeaderScroll();

    // Initialize mobile menu
    initMobileMenu();

    // Initialize team member hover effects
    initTeamHoverEffects();
}

/**
 * Setup header background on scroll
 */
function setupHeaderScroll() {
    const header = document.querySelector('.nav-header');
    if (!header) return;

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
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

    document.querySelectorAll('.nav-menu-link').forEach(link => {
        link.addEventListener('click', () => {
            menuBtn.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
}

/**
 * Initialize team member hover effects with anime.js
 */
function initTeamHoverEffects() {
    const teamMembers = document.querySelectorAll('.team-member');

    teamMembers.forEach(member => {
        const overlay = member.querySelector('.pixelate-overlay');
        const imageContainer = member.querySelector('.image-container');

        member.addEventListener('mouseenter', () => {
            // Animate pixelate overlay fade out
            anime({
                targets: overlay,
                opacity: [1, 0],
                duration: 400,
                easing: 'easeOutQuad'
            });

            // Scale up image slightly
            anime({
                targets: imageContainer,
                scale: 1.02,
                duration: 400,
                easing: 'easeOutQuad'
            });
        });

        member.addEventListener('mouseleave', () => {
            // Animate pixelate overlay fade in
            anime({
                targets: overlay,
                opacity: [0, 1],
                duration: 300,
                easing: 'easeOutQuad'
            });

            // Reset scale
            anime({
                targets: imageContainer,
                scale: 1,
                duration: 300,
                easing: 'easeOutQuad'
            });
        });
    });
}

export { initTeamPage };
