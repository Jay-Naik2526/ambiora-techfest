/**
 * HeavyScroll - Fixed cascading scroll animations with Anime.js
 * Working IntersectionObserver-based animations
 */

import anime from 'animejs';

export class HeavyScroll {
    constructor(options = {}) {
        this.options = {
            cascadeDelay: options.cascadeDelay || 100,
            duration: options.duration || 1200,
            easing: options.easing || 'easeOutExpo',
            threshold: options.threshold || 0.1
        };

        this.animatedElements = new Set();
        this.observer = null;
        this.init();
    }

    init() {
        // Wait for DOM to be fully ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.setup(), 100);
            });
        } else {
            setTimeout(() => this.setup(), 100);
        }
    }

    setup() {
        this.collectElements();
        this.setupObserver();
        this.addHoverEffects();
    }

    collectElements() {
        // Collect all animatable elements
        const selectors = [
            '.hero-title',
            '.hero-subtitle',
            '.hero-tagline',
            '.hero-pillars',
            '.hero-label',
            '.hero-stats',
            '.hero-scroll',
            '.section-header',
            '.section-title',
            '.section-subtitle',
            '.section-label',
            '.about-content',
            '.about-text',
            '.legacy-card',
            '.event-card',
            '.event-preview-card',
            '.team-member',
            '.stat-item',
            '.contact-card',
            '.faq-item',
            '.info-card',
            '.form-group',
            '.pillar-item',
            '.cta-content',
            '.footer-content',
            '[data-animate]'
        ];

        this.elements = document.querySelectorAll(selectors.join(', '));

        // Set initial hidden state with inline styles
        this.elements.forEach((el, index) => {
            // Skip elements that are already animated by CSS keyframes
            if (el.classList.contains('hero-title-line') ||
                el.classList.contains('hero-label') ||
                el.classList.contains('hero-stats') ||
                el.classList.contains('hero-scroll')) {
                return;
            }

            el.style.opacity = '0';
            el.style.transform = 'translateY(60px)';
            el.dataset.scrollIndex = index;
        });
    }

    setupObserver() {
        const observerOptions = {
            root: null,
            rootMargin: '0px 0px -80px 0px',
            threshold: this.options.threshold
        };

        this.observer = new IntersectionObserver((entries) => {
            const visibleEntries = entries.filter(e => e.isIntersecting && !this.animatedElements.has(e.target));

            visibleEntries.forEach((entry, index) => {
                this.animatedElements.add(entry.target);
                this.animateElement(entry.target, index);
            });
        }, observerOptions);

        // Observe all elements
        this.elements.forEach(el => {
            // Skip elements animated by CSS
            if (el.classList.contains('hero-title-line') ||
                el.classList.contains('hero-label') ||
                el.classList.contains('hero-stats') ||
                el.classList.contains('hero-scroll')) {
                return;
            }
            this.observer.observe(el);
        });
    }

    animateElement(element, batchIndex = 0) {
        const delay = batchIndex * this.options.cascadeDelay;

        // Add morphing effect (skew + scale + translation)
        anime({
            targets: element,
            translateY: [100, 0],
            skewY: [10, 0],      // Morphing/skew effect
            scale: [0.85, 1],    // Scale expansion
            opacity: [0, 1],
            duration: this.options.duration,
            delay: delay,
            easing: 'easeOutElastic(1, .8)', // Elastic easing for organic feel
            complete: () => {
                element.style.transform = '';
                element.style.opacity = '';
                element.classList.add('scroll-animated');
            }
        });
    }

    addHoverEffects() {
        // Add morph hover effects to cards
        const hoverElements = document.querySelectorAll(
            '.event-card, .event-preview-card, .team-member, .contact-card, .info-card, .faq-item, .legacy-card'
        );

        hoverElements.forEach(el => {
            el.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';

            el.addEventListener('mouseenter', () => {
                anime.remove(el);
                anime({
                    targets: el,
                    scale: 1.02,
                    translateY: -8,
                    duration: 300,
                    easing: 'easeOutQuad'
                });
            });

            el.addEventListener('mouseleave', () => {
                anime.remove(el);
                anime({
                    targets: el,
                    scale: 1,
                    translateY: 0,
                    duration: 300,
                    easing: 'easeOutQuad'
                });
            });
        });

        // Add magnetic effect to buttons
        const buttons = document.querySelectorAll('.nav-cta, .btn-primary, .btn-secondary, .submit-btn');
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                anime({
                    targets: btn,
                    scale: 1.05,
                    duration: 200,
                    easing: 'easeOutQuad'
                });
            });

            btn.addEventListener('mouseleave', () => {
                anime({
                    targets: btn,
                    scale: 1,
                    translateX: 0,
                    translateY: 0,
                    duration: 300,
                    easing: 'easeOutElastic(1, .5)'
                });
            });
        });
    }

    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

// Helper function
export function initHeavyScroll(options) {
    return new HeavyScroll(options);
}
