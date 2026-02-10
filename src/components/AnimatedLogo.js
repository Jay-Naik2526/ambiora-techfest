/**
 * AnimatedLogo - Logo with single ripple on load that moves to navbar on scroll
 * Uses Anime.js for smooth animations
 */

import anime from 'animejs';

export class AnimatedLogo {
    constructor(options = {}) {
        this.options = {
            logoSelector: options.logoSelector || '.hero-bg-logo',
            navLogoSelector: options.navLogoSelector || '.nav-logo-img',
            scrollThreshold: options.scrollThreshold || 300
        };

        this.logo = null;
        this.navLogo = null;
        this.isScrolled = false;

        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.logo = document.querySelector(this.options.logoSelector); // Hero logo
        // Find the logo in the nav (added to .nav-right in HTML)
        this.navLogo = document.querySelector('.nav-right .nav-scrolled-logo');

        // If we're on a page without hero logo (non-home pages), keep navbar logo visible
        if (!this.logo) {
            // Ensure nav logo is visible on non-home pages
            if (this.navLogo) {
                this.navLogo.style.opacity = '1';
                this.navLogo.style.pointerEvents = 'auto';
            }
            return;
        }

        // On home page: hide nav logo initially (will show on scroll)
        if (this.navLogo) {
            this.navLogo.style.opacity = '0';
            this.navLogo.style.pointerEvents = 'none';
            this.navLogo.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        }

        // Single ripple on load
        this.createSingleRipple();

        // Add float animation to logo
        this.addFloatAnimation();

        // Bind scroll event
        this.bindScrollEvent();
    }

    handleScroll() {
        const scrollY = window.scrollY;
        const threshold = this.options.scrollThreshold;

        // Bidirectional transition: Fade out hero logo, Fade in nav logo
        if (scrollY > threshold && !this.isScrolled) {
            this.isScrolled = true;

            // Fade out hero logo
            this.logo.style.opacity = '0';
            this.logo.style.pointerEvents = 'none';

            // Fade in nav logo with upward animation
            if (this.navLogo) {
                this.navLogo.style.opacity = '1';
                this.navLogo.style.pointerEvents = 'auto';
                this.navLogo.style.transform = 'translateY(0) scale(1)';
            }

        } else if (scrollY <= threshold && this.isScrolled) {
            this.isScrolled = false;

            // Fade in hero logo
            this.logo.style.opacity = ''; // Revert to CSS default (0.08)
            this.logo.style.pointerEvents = 'auto';

            // Fade out nav logo
            if (this.navLogo) {
                this.navLogo.style.opacity = '0';
                this.navLogo.style.pointerEvents = 'none';
                this.navLogo.style.transform = 'translateY(-10px) scale(0.9)';
            }
        }
    }

    createSingleRipple() {
        // Create a single ripple at the exact logo position
        const ripple = document.createElement('div');
        ripple.className = 'logo-ripple-once';

        // Add style for ripple since we removed addStyles
        ripple.style.cssText = `
            position: absolute;
            right: -3%;
            top: 40%;
            transform: translateY(-50%);
            width: 70%;
            max-width: 1000px;
            aspect-ratio: 1;
            border: 2px solid rgba(0, 212, 170, 0.4);
            border-radius: 50%;
            pointer-events: none;
            z-index: 0;
        `;

        // Insert into hero section
        const hero = this.logo.closest('.hero');
        if (hero) {
            hero.appendChild(ripple);
        } else {
            this.logo.parentNode.appendChild(ripple);
        }

        // Animate the single ripple
        anime({
            targets: ripple,
            scale: [0.5, 1.5],
            opacity: [0.8, 0],
            duration: 2000,
            easing: 'easeOutQuad',
            delay: 500,
            complete: () => {
                ripple.remove();
            }
        });
    }

    addFloatAnimation() {
        if (!this.logo) return;

        // Get the initial computed transform to maintain centering
        // Use a separate property for the float animation to avoid conflicts
        this.logo.style.willChange = 'transform';

        // Subtle floating animation using margin-top offset instead of transform
        // This avoids conflicts with the CSS transform: translateY(-50%) centering
        anime({
            targets: this.logo,
            marginTop: [0, -10, 0],
            duration: 5000,
            easing: 'easeInOutSine',
            loop: true
        });
    }

    bindScrollEvent() {
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    destroy() {
        // Cleanup if needed
        window.removeEventListener('scroll', this.bindScrollEvent);
    }
}

// Helper function
export function initAnimatedLogo(options) {
    return new AnimatedLogo(options);
}
