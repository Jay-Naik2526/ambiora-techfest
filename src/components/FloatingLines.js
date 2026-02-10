/**
 * FloatingLines Component
 * Interactive animated gradient lines with mouse bending and parallax effects
 * 
 * Config options:
 * - linesGradient: [string, string] - Gradient colors
 * - animationSpeed: number - Animation speed multiplier
 * - interactive: boolean - Enable mouse interaction
 * - bendRadius: number - Radius of mouse influence
 * - bendStrength: number - Strength of bending (negative = attract, positive = repel)
 * - mouseDamping: number - Mouse movement smoothing (0-1)
 * - parallax: boolean - Enable parallax effect on scroll/mouse
 * - parallaxStrength: number - Parallax intensity
 * - lineCount: number - Number of lines
 * - waveAmplitude: number - Wave animation amplitude
 */

export class FloatingLines {
    constructor(container, options = {}) {
        this.container = container;

        // Default options matching the React component props
        this.options = {
            linesGradient: options.linesGradient || ['#001b85', '#00bd9d'],
            animationSpeed: options.animationSpeed || 2,
            interactive: options.interactive !== undefined ? options.interactive : true,
            bendRadius: options.bendRadius || 6,
            bendStrength: options.bendStrength || -0.2,
            mouseDamping: options.mouseDamping || 0.05,
            parallax: options.parallax !== undefined ? options.parallax : true,
            parallaxStrength: options.parallaxStrength || 0.2,
            lineCount: options.lineCount || 15,
            waveAmplitude: options.waveAmplitude || 50,
            lineSpacing: options.lineSpacing || 80
        };

        this.mouse = { x: 0, y: 0 };
        this.targetMouse = { x: 0, y: 0 };
        this.scrollY = 0;
        this.isInitialized = false;
        this.lines = [];

        this.init();
    }

    init() {
        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'floating-lines-canvas';
        this.ctx = this.canvas.getContext('2d');

        this.container.appendChild(this.canvas);

        // Set size
        this.resize();

        // Generate lines
        this.generateLines();

        // Create gradient
        this.updateGradient();

        // Bind events
        this.bindEvents();

        // Start animation
        this.isInitialized = true;
        this.animate();
    }

    resize() {
        const rect = this.container.getBoundingClientRect();
        this.width = rect.width || window.innerWidth;
        this.height = rect.height || window.innerHeight;

        // Handle high DPI displays
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        this.ctx.scale(dpr, dpr);

        // Regenerate gradient on resize
        this.updateGradient();
    }

    updateGradient() {
        const gradient = this.ctx.createLinearGradient(0, 0, this.width, this.height);
        gradient.addColorStop(0, this.options.linesGradient[0]);
        gradient.addColorStop(1, this.options.linesGradient[1]);
        this.gradient = gradient;
    }

    generateLines() {
        this.lines = [];
        const { lineCount, lineSpacing } = this.options;

        for (let i = 0; i < lineCount; i++) {
            const baseY = (i / lineCount) * this.height;
            const points = [];
            const pointCount = Math.ceil(this.width / 20) + 1;

            for (let j = 0; j < pointCount; j++) {
                points.push({
                    x: (j / (pointCount - 1)) * this.width,
                    baseY: baseY,
                    y: baseY,
                    phase: Math.random() * Math.PI * 2,
                    amplitude: 20 + Math.random() * 30,
                    frequency: 0.5 + Math.random() * 0.5
                });
            }

            this.lines.push({
                points,
                opacity: 0.1 + (i / lineCount) * 0.4,
                speed: 0.8 + Math.random() * 0.4,
                thickness: 1 + Math.random() * 2
            });
        }
    }

    bindEvents() {
        if (this.options.interactive) {
            window.addEventListener('mousemove', (e) => this.onMouseMove(e));
            this.container.addEventListener('mousemove', (e) => this.onMouseMove(e));
        }

        if (this.options.parallax) {
            window.addEventListener('scroll', () => this.onScroll());
        }

        window.addEventListener('resize', () => {
            this.resize();
            this.generateLines();
        });
    }

    onMouseMove(event) {
        const rect = this.container.getBoundingClientRect();
        this.targetMouse.x = event.clientX - rect.left;
        this.targetMouse.y = event.clientY - rect.top;
    }

    onScroll() {
        this.scrollY = window.scrollY;
    }

    animate() {
        if (!this.isInitialized) return;

        requestAnimationFrame(() => this.animate());

        // Smooth mouse following
        const damping = this.options.mouseDamping;
        this.mouse.x += (this.targetMouse.x - this.mouse.x) * damping;
        this.mouse.y += (this.targetMouse.y - this.mouse.y) * damping;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Update and draw lines
        const time = Date.now() * 0.001 * this.options.animationSpeed;

        this.lines.forEach((line, lineIndex) => {
            this.updateLine(line, time, lineIndex);
            this.drawLine(line);
        });
    }

    updateLine(line, time, lineIndex) {
        const { bendRadius, bendStrength, parallax, parallaxStrength, waveAmplitude } = this.options;

        line.points.forEach((point, pointIndex) => {
            // Base wave animation
            const wave = Math.sin(time * line.speed + point.phase + pointIndex * point.frequency * 0.1)
                * point.amplitude;

            let targetY = point.baseY + wave;

            // Parallax effect based on scroll
            if (parallax) {
                const parallaxOffset = this.scrollY * parallaxStrength * (1 - lineIndex / this.lines.length);
                targetY += parallaxOffset * 0.3;
            }

            // Mouse parallax
            if (parallax && this.options.interactive) {
                const mouseYInfluence = (this.mouse.y / this.height - 0.5) * waveAmplitude * parallaxStrength;
                targetY += mouseYInfluence * (lineIndex / this.lines.length);
            }

            // Mouse bending effect
            if (this.options.interactive) {
                const dx = point.x - this.mouse.x;
                const dy = targetY - this.mouse.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const bendRadiusPixels = bendRadius * 50;

                if (distance < bendRadiusPixels) {
                    const force = (1 - distance / bendRadiusPixels) * bendStrength * 100;
                    const angle = Math.atan2(dy, dx);
                    targetY += Math.sin(angle) * force;
                }
            }

            // Smooth interpolation
            point.y += (targetY - point.y) * 0.1;
        });
    }

    drawLine(line) {
        const { points, opacity, thickness } = line;

        if (points.length < 2) return;

        this.ctx.beginPath();
        this.ctx.strokeStyle = this.gradient;
        this.ctx.lineWidth = thickness;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.globalAlpha = opacity;

        // Draw smooth curve through points
        this.ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length - 2; i++) {
            const xc = (points[i].x + points[i + 1].x) / 2;
            const yc = (points[i].y + points[i + 1].y) / 2;
            this.ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }

        // Last two points
        if (points.length > 2) {
            const last = points.length - 1;
            this.ctx.quadraticCurveTo(
                points[last - 1].x,
                points[last - 1].y,
                points[last].x,
                points[last].y
            );
        }

        this.ctx.stroke();
        this.ctx.globalAlpha = 1;
    }

    destroy() {
        this.isInitialized = false;
        this.canvas.remove();
    }
}

// Helper function to initialize
export function initFloatingLines(containerId, options) {
    const container = document.getElementById(containerId) || document.querySelector(containerId);
    if (container) {
        return new FloatingLines(container, options);
    }
    return null;
}
