/**
 * Smooth Scroll Enhancements
 * Adds scroll-triggered animations and smooth scrolling behavior
 */

export class SmoothScroll {
    constructor(options = {}) {
        this.options = {
            offset: options.offset || 100,
            duration: options.duration || 1000,
            easing: options.easing || 'easeInOutCubic',
            animateOnScroll: options.animateOnScroll !== false,
            parallaxElements: options.parallaxElements || '[data-parallax]',
            fadeElements: options.fadeElements || '[data-fade]',
            slideElements: options.slideElements || '[data-slide]'
        };

        this.scrollY = 0;
        this.targetScrollY = 0;
        this.isSmooth = true;

        this.init();
    }

    init() {
        this.setupScrollBehavior();
        this.setupScrollAnimations();
        this.setupParallax();
        this.bindEvents();
        this.tick();
    }

    setupScrollBehavior() {
        // Add smooth scroll to anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const targetId = anchor.getAttribute('href');
                if (targetId === '#') return;

                const target = document.querySelector(targetId);
                if (target) {
                    e.preventDefault();
                    this.scrollTo(target);
                }
            });
        });
    }

    setupScrollAnimations() {
        // Find all animatable elements
        this.animatedElements = [];

        // Fade in elements
        document.querySelectorAll(this.options.fadeElements).forEach(el => {
            el.style.opacity = '0';
            el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            el.style.transform = 'translateY(30px)';
            this.animatedElements.push({ el, type: 'fade', triggered: false });
        });

        // Slide in elements
        document.querySelectorAll(this.options.slideElements).forEach(el => {
            const direction = el.dataset.slide || 'left';
            const offset = direction === 'left' ? '-50px' : direction === 'right' ? '50px' : '0';
            el.style.opacity = '0';
            el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            el.style.transform = `translateX(${offset})`;
            this.animatedElements.push({ el, type: 'slide', direction, triggered: false });
        });

        // Auto-add animations to common elements
        this.autoAnimateElements();
    }

    autoAnimateElements() {
        // Automatically animate section headings, cards, etc.
        const selectors = [
            '.hero-title-line',
            '.about-card',
            '.event-card',
            '.team-member',
            '.contact-card',
            '.value-card',
            '.stat-item',
            '.footer-column'
        ];

        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach((el, index) => {
                if (!el.hasAttribute('data-fade') && !el.hasAttribute('data-slide')) {
                    el.style.opacity = '0';
                    el.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
                    el.style.transform = 'translateY(20px)';
                    this.animatedElements.push({ el, type: 'auto', triggered: false, delay: index * 100 });
                }
            });
        });
    }

    setupParallax() {
        this.parallaxElements = [];

        document.querySelectorAll(this.options.parallaxElements).forEach(el => {
            const speed = parseFloat(el.dataset.parallax) || 0.5;
            this.parallaxElements.push({ el, speed });
        });
    }

    bindEvents() {
        window.addEventListener('scroll', () => this.onScroll(), { passive: true });
        window.addEventListener('resize', () => this.onResize());
    }

    onScroll() {
        this.scrollY = window.scrollY;
        this.checkAnimations();
        this.updateParallax();
    }

    onResize() {
        // Recalculate positions
    }

    checkAnimations() {
        const viewportHeight = window.innerHeight;

        this.animatedElements.forEach(item => {
            if (item.triggered) return;

            const rect = item.el.getBoundingClientRect();
            const triggerPoint = viewportHeight - this.options.offset;

            if (rect.top < triggerPoint) {
                item.triggered = true;

                // Trigger animation
                setTimeout(() => {
                    item.el.style.opacity = '1';
                    item.el.style.transform = 'translateY(0) translateX(0)';
                }, item.delay || 0);
            }
        });
    }

    updateParallax() {
        this.parallaxElements.forEach(({ el, speed }) => {
            const rect = el.getBoundingClientRect();
            const centerY = rect.top + rect.height / 2;
            const viewportCenter = window.innerHeight / 2;
            const offset = (centerY - viewportCenter) * speed;

            el.style.transform = `translateY(${offset}px)`;
        });
    }

    scrollTo(target, duration = this.options.duration) {
        const targetPosition = target.getBoundingClientRect().top + window.scrollY;
        const startPosition = window.scrollY;
        const distance = targetPosition - startPosition - 80; // Account for nav height
        const startTime = performance.now();

        const easeInOutCubic = t => t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;

        const animateScroll = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = easeInOutCubic(progress);

            window.scrollTo(0, startPosition + distance * ease);

            if (progress < 1) {
                requestAnimationFrame(animateScroll);
            }
        };

        requestAnimationFrame(animateScroll);
    }

    tick() {
        // Initial check for elements in view
        setTimeout(() => {
            this.checkAnimations();
        }, 100);
    }
}

// Magnetic button effect
export class MagneticButton {
    constructor(element, strength = 0.3) {
        this.element = element;
        this.strength = strength;
        this.bounds = null;

        this.init();
    }

    init() {
        this.element.style.transition = 'transform 0.3s ease';

        this.element.addEventListener('mouseenter', () => this.onEnter());
        this.element.addEventListener('mousemove', (e) => this.onMove(e));
        this.element.addEventListener('mouseleave', () => this.onLeave());
    }

    onEnter() {
        this.bounds = this.element.getBoundingClientRect();
    }

    onMove(e) {
        if (!this.bounds) return;

        const x = e.clientX - this.bounds.left - this.bounds.width / 2;
        const y = e.clientY - this.bounds.top - this.bounds.height / 2;

        this.element.style.transform = `translate(${x * this.strength}px, ${y * this.strength}px)`;
    }

    onLeave() {
        this.element.style.transform = 'translate(0, 0)';
    }
}

// Initialize
export function initSmoothScroll(options) {
    return new SmoothScroll(options);
}

export function initMagneticButtons(selector = '.nav-cta, .btn-primary, .submit-btn') {
    document.querySelectorAll(selector).forEach(btn => {
        new MagneticButton(btn);
    });
}
