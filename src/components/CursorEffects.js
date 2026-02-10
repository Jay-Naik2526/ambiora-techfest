/**
 * Cursor Effects - Interactive cursor trails and hover effects
 */

export class CursorEffects {
    constructor(options = {}) {
        this.options = {
            trailEnabled: options.trailEnabled !== false,
            trailLength: options.trailLength || 8,
            trailColor: options.trailColor || '#00d4aa',
            magneticEnabled: options.magneticEnabled !== false,
            magneticStrength: options.magneticStrength || 0.3,
            rippleEnabled: options.rippleEnabled !== false
        };

        this.mouse = { x: 0, y: 0 };
        this.trail = [];
        this.isHovering = false;

        this.init();
    }

    init() {
        this.createCustomCursor();
        this.createTrail();
        this.bindEvents();
        this.animate();
    }

    createCustomCursor() {
        // Main cursor dot
        this.cursorDot = document.createElement('div');
        this.cursorDot.className = 'cursor-dot';
        document.body.appendChild(this.cursorDot);

        // Cursor ring
        this.cursorRing = document.createElement('div');
        this.cursorRing.className = 'cursor-ring';
        document.body.appendChild(this.cursorRing);

        // Inject styles
        this.injectStyles();
    }

    createTrail() {
        if (!this.options.trailEnabled) return;

        for (let i = 0; i < this.options.trailLength; i++) {
            const dot = document.createElement('div');
            dot.className = 'cursor-trail-dot';
            dot.style.opacity = 1 - (i / this.options.trailLength);
            dot.style.transform = 'scale(' + (1 - i * 0.1) + ')';
            document.body.appendChild(dot);
            this.trail.push({
                element: dot,
                x: 0,
                y: 0
            });
        }
    }

    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            * {
                cursor: none !important;
            }

            .cursor-dot {
                position: fixed;
                width: 8px;
                height: 8px;
                background: ${this.options.trailColor};
                border-radius: 50%;
                pointer-events: none;
                z-index: 99999;
                transform: translate(-50%, -50%);
                transition: transform 0.1s ease, background 0.2s ease;
                mix-blend-mode: difference;
            }

            .cursor-dot.hovering {
                transform: translate(-50%, -50%) scale(1.5);
                background: #fff;
            }

            .cursor-ring {
                position: fixed;
                width: 32px;
                height: 32px;
                border: 1px solid ${this.options.trailColor};
                border-radius: 50%;
                pointer-events: none;
                z-index: 99998;
                transform: translate(-50%, -50%);
                transition: transform 0.15s ease, border-color 0.2s ease, width 0.2s ease, height 0.2s ease;
                opacity: 0.6;
            }

            .cursor-ring.hovering {
                width: 48px;
                height: 48px;
                border-color: #fff;
            }

            .cursor-ring.clicking {
                transform: translate(-50%, -50%) scale(0.8);
            }

            .cursor-trail-dot {
                position: fixed;
                width: 4px;
                height: 4px;
                background: ${this.options.trailColor};
                border-radius: 50%;
                pointer-events: none;
                z-index: 99997;
                transform: translate(-50%, -50%);
            }

            .cursor-ripple {
                position: fixed;
                width: 10px;
                height: 10px;
                border: 2px solid ${this.options.trailColor};
                border-radius: 50%;
                pointer-events: none;
                z-index: 99996;
                transform: translate(-50%, -50%);
                animation: rippleExpand 0.6s ease-out forwards;
            }

            @keyframes rippleExpand {
                0% {
                    width: 10px;
                    height: 10px;
                    opacity: 1;
                }
                100% {
                    width: 100px;
                    height: 100px;
                    opacity: 0;
                }
            }

            /* Magnetic hover effect for interactive elements */
            .magnetic-hover {
                transition: transform 0.3s ease;
            }

            @media (max-width: 768px) {
                .cursor-dot,
                .cursor-ring,
                .cursor-trail-dot {
                    display: none !important;
                }
                * {
                    cursor: auto !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    bindEvents() {
        // Mouse move
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));

        // Mouse down/up for click effect
        document.addEventListener('mousedown', () => this.onMouseDown());
        document.addEventListener('mouseup', () => this.onMouseUp());

        // Hover detection for links and buttons
        const interactiveElements = document.querySelectorAll('a, button, .event-card, .team-member, .nav-link, .nav-cta');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => this.onHoverStart(el));
            el.addEventListener('mouseleave', () => this.onHoverEnd(el));
        });

        // Setup magnetic effect
        if (this.options.magneticEnabled) {
            this.setupMagnetic();
        }
    }

    onMouseMove(e) {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
    }

    onMouseDown() {
        this.cursorRing.classList.add('clicking');
        if (this.options.rippleEnabled) {
            this.createRipple();
        }
    }

    onMouseUp() {
        this.cursorRing.classList.remove('clicking');
    }

    onHoverStart(el) {
        this.isHovering = true;
        this.cursorDot.classList.add('hovering');
        this.cursorRing.classList.add('hovering');
    }

    onHoverEnd(el) {
        this.isHovering = false;
        this.cursorDot.classList.remove('hovering');
        this.cursorRing.classList.remove('hovering');
    }

    createRipple() {
        const ripple = document.createElement('div');
        ripple.className = 'cursor-ripple';
        ripple.style.left = this.mouse.x + 'px';
        ripple.style.top = this.mouse.y + 'px';
        document.body.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    }

    setupMagnetic() {
        const magneticElements = document.querySelectorAll('.nav-cta, .btn-primary, .submit-btn, .nav-link');

        magneticElements.forEach(el => {
            el.classList.add('magnetic-hover');

            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                el.style.transform = `translate(${x * this.options.magneticStrength}px, ${y * this.options.magneticStrength}px)`;
            });

            el.addEventListener('mouseleave', () => {
                el.style.transform = 'translate(0, 0)';
            });
        });
    }

    animate() {
        // Update cursor position
        this.cursorDot.style.left = this.mouse.x + 'px';
        this.cursorDot.style.top = this.mouse.y + 'px';

        // Smooth follow for ring
        const ringX = parseFloat(this.cursorRing.style.left) || this.mouse.x;
        const ringY = parseFloat(this.cursorRing.style.top) || this.mouse.y;

        this.cursorRing.style.left = ringX + (this.mouse.x - ringX) * 0.15 + 'px';
        this.cursorRing.style.top = ringY + (this.mouse.y - ringY) * 0.15 + 'px';

        // Update trail
        if (this.options.trailEnabled) {
            this.trail.forEach((dot, i) => {
                const target = i === 0 ? this.mouse : this.trail[i - 1];
                dot.x += (target.x - dot.x) * 0.3;
                dot.y += (target.y - dot.y) * 0.3;
                dot.element.style.left = dot.x + 'px';
                dot.element.style.top = dot.y + 'px';
            });
        }

        requestAnimationFrame(() => this.animate());
    }

    destroy() {
        this.cursorDot?.remove();
        this.cursorRing?.remove();
        this.trail.forEach(dot => dot.element.remove());
    }
}

// Helper to initialize
export function initCursorEffects(options) {
    // Only on desktop
    if (window.innerWidth > 768) {
        return new CursorEffects(options);
    }
    return null;
}
