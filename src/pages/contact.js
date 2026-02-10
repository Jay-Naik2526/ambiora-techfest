/* ============================================
   AMBIORA - CONTACT PAGE SCRIPTS
   ============================================ */

import anime from 'animejs';
import { setupScrollAnimations } from '../utils/animations.js';

document.addEventListener('DOMContentLoaded', () => {
    initContactPage();
});

function initContactPage() {
    // Setup scroll animations
    setupScrollAnimations();

    // Setup header scroll behavior
    setupHeaderScroll();

    // Initialize mobile menu
    initMobileMenu();

    // Initialize contact form
    initContactForm();

    // Initialize newsletter form
    initNewsletterForm();
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
 * Initialize contact form handling
 */
function initContactForm() {
    const form = document.getElementById('contact-form');
    const successMessage = document.getElementById('form-success');

    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Simulate form submission
        const submitBtn = form.querySelector('.btn-submit');
        submitBtn.innerHTML = '<span>Sending...</span>';
        submitBtn.disabled = true;

        // Animate button
        anime({
            targets: submitBtn,
            scale: [1, 0.95, 1],
            duration: 300,
            easing: 'easeInOutQuad'
        });

        // Simulate API call
        setTimeout(() => {
            // Hide form and show success message
            anime({
                targets: form,
                opacity: 0,
                translateY: -20,
                duration: 300,
                easing: 'easeOutQuad',
                complete: () => {
                    form.style.display = 'none';
                    successMessage.classList.add('visible');

                    // Animate success message
                    anime({
                        targets: successMessage,
                        opacity: [0, 1],
                        translateY: [20, 0],
                        duration: 500,
                        easing: 'easeOutQuad'
                    });

                    // Animate success icon
                    anime({
                        targets: '.success-icon svg',
                        scale: [0, 1],
                        rotate: [180, 0],
                        duration: 600,
                        easing: 'easeOutElastic(1, .5)'
                    });
                }
            });
        }, 1500);
    });

    // Add focus animations to inputs
    const inputs = form.querySelectorAll('.form-input');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            anime({
                targets: input,
                scale: 1.01,
                duration: 200,
                easing: 'easeOutQuad'
            });
        });

        input.addEventListener('blur', () => {
            anime({
                targets: input,
                scale: 1,
                duration: 200,
                easing: 'easeOutQuad'
            });
        });
    });
}

/**
 * Initialize newsletter form
 */
function initNewsletterForm() {
    const form = document.getElementById('newsletter-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const input = form.querySelector('.newsletter-input');
        const email = input.value.trim();
        const btn = form.querySelector('.newsletter-btn');

        if (!email) return;

        // Animate button click
        anime({
            targets: btn,
            scale: [1, 0.9, 1],
            duration: 200,
            easing: 'easeInOutQuad'
        });

        // Disable input during request
        input.disabled = true;
        btn.disabled = true;

        try {
            const response = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (data.success) {
                // Success feedback
                input.value = '';
                input.placeholder = 'Subscribed! ✓';

                anime({
                    targets: input,
                    backgroundColor: ['rgba(0, 212, 170, 0.2)', 'rgba(255, 255, 255, 0.03)'],
                    duration: 1000,
                    easing: 'easeOutQuad'
                });

                setTimeout(() => {
                    input.placeholder = 'Your email';
                }, 4000);
            } else {
                // Error feedback
                alert(data.message || 'Subscription failed. Please try again.');
            }

        } catch (error) {
            console.error('Newsletter error:', error);
            alert('Something went wrong. Please check your connection.');
        } finally {
            input.disabled = false;
            btn.disabled = false;
        }
    });
}

export { initContactPage };
