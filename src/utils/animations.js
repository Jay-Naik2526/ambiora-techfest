/* ============================================
   AMBIORA - ANIMATION UTILITIES
   Using Anime.js for smooth animations
   ============================================ */

import anime from 'animejs';

/**
 * Animate text reveal with staggered effect
 */
export function animateTextReveal(selector, options = {}) {
    const defaults = {
        duration: 800,
        delay: anime.stagger(50),
        easing: 'easeOutExpo',
        translateY: [40, 0],
        opacity: [0, 1]
    };

    return anime({
        targets: selector,
        ...defaults,
        ...options
    });
}

/**
 * Staggered entrance animation for grid items
 */
export function staggerEntrance(selector, options = {}) {
    const defaults = {
        duration: 600,
        delay: anime.stagger(100, { grid: [4, 4], from: 'center' }),
        easing: 'easeOutQuad',
        scale: [0.9, 1],
        opacity: [0, 1]
    };

    return anime({
        targets: selector,
        ...defaults,
        ...options
    });
}

/**
 * Fade in animation
 */
export function fadeIn(selector, options = {}) {
    return anime({
        targets: selector,
        opacity: [0, 1],
        duration: options.duration || 600,
        easing: options.easing || 'easeOutQuad',
        delay: options.delay || 0
    });
}

/**
 * Slide up animation
 */
export function slideUp(selector, options = {}) {
    return anime({
        targets: selector,
        translateY: [options.distance || 50, 0],
        opacity: [0, 1],
        duration: options.duration || 800,
        easing: options.easing || 'easeOutExpo',
        delay: options.delay || 0
    });
}

/**
 * Hero text animation - letter by letter
 */
export function animateHeroText(selector) {
    const textWrapper = document.querySelector(selector);
    if (!textWrapper) return;

    textWrapper.innerHTML = textWrapper.textContent.replace(/\S/g, "<span class='letter'>$&</span>");

    return anime.timeline({ loop: false })
        .add({
            targets: `${selector} .letter`,
            translateY: [100, 0],
            opacity: [0, 1],
            easing: 'easeOutExpo',
            duration: 1200,
            delay: (el, i) => 50 * i
        });
}

/**
 * Floating animation for decorative elements
 */
export function floatAnimation(selector) {
    return anime({
        targets: selector,
        translateY: [-10, 10],
        duration: 3000,
        easing: 'easeInOutSine',
        direction: 'alternate',
        loop: true
    });
}

/**
 * Pulse glow effect
 */
export function pulseGlow(selector) {
    return anime({
        targets: selector,
        boxShadow: [
            '0 0 20px rgba(0, 212, 170, 0.2)',
            '0 0 40px rgba(0, 212, 170, 0.4)',
            '0 0 20px rgba(0, 212, 170, 0.2)'
        ],
        duration: 2000,
        easing: 'easeInOutSine',
        loop: true
    });
}

/**
 * Setup scroll-triggered animations using Intersection Observer
 */
export function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const animationType = el.dataset.animate;

                switch (animationType) {
                    case 'fade':
                        fadeIn(el);
                        break;
                    case 'slide':
                        slideUp(el);
                        break;
                    case 'stagger':
                        staggerEntrance(el.children);
                        break;
                    default:
                        fadeIn(el);
                }

                observer.unobserve(el);
            }
        });
    }, observerOptions);

    document.querySelectorAll('[data-animate]').forEach(el => {
        el.style.opacity = '0';
        observer.observe(el);
    });
}

/**
 * Card flip animation
 */
export function flipCard(card, duration = 600) {
    return anime({
        targets: card,
        rotateY: 180,
        duration: duration,
        easing: 'easeInOutQuad'
    });
}

/**
 * Unflip card animation
 */
export function unflipCard(card, duration = 600) {
    return anime({
        targets: card,
        rotateY: 0,
        duration: duration,
        easing: 'easeInOutQuad'
    });
}

/**
 * Pixelate to reveal animation (for team photos)
 */
export function revealImage(imageContainer) {
    const overlay = imageContainer.querySelector('.pixelate-overlay');
    if (!overlay) return;

    return anime({
        targets: overlay,
        opacity: [1, 0],
        duration: 500,
        easing: 'easeOutQuad'
    });
}

/**
 * Hide image (restore pixelated state)
 */
export function hideImage(imageContainer) {
    const overlay = imageContainer.querySelector('.pixelate-overlay');
    if (!overlay) return;

    return anime({
        targets: overlay,
        opacity: [0, 1],
        duration: 300,
        easing: 'easeOutQuad'
    });
}

/**
 * Cross markers floating animation
 */
export function animateCrossMarkers() {
    const markers = document.querySelectorAll('.cross-marker');

    markers.forEach((marker, index) => {
        anime({
            targets: marker,
            translateY: [
                { value: -5, duration: 2000 },
                { value: 5, duration: 2000 },
                { value: 0, duration: 2000 }
            ],
            opacity: [
                { value: 0.5, duration: 1500 },
                { value: 0.2, duration: 1500 },
                { value: 0.3, duration: 1500 }
            ],
            easing: 'easeInOutSine',
            loop: true,
            delay: index * 200
        });
    });
}

export default {
    animateTextReveal,
    staggerEntrance,
    fadeIn,
    slideUp,
    animateHeroText,
    floatAnimation,
    pulseGlow,
    setupScrollAnimations,
    flipCard,
    unflipCard,
    revealImage,
    hideImage,
    animateCrossMarkers
};
