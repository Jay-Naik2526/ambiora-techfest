/**
 * SimpleGrid - Large screen-fitting grid lines
 * Dimmed background grid that fits to screen width
 */

export class SimpleGrid {
    constructor(container, options = {}) {
        this.container = container;

        this.options = {
            columns: options.columns || 12,
            rows: options.rows || 8,
            color: options.color || '#00d4aa',
            opacity: options.opacity || 0.08,
            glowOpacity: options.glowOpacity || 0.15
        };

        this.mouse = { x: 0, y: 0 };
        this.init();
    }

    init() {
        this.createGrid();
        this.bindEvents();
        this.startAnimation();
    }

    createGrid() {
        const { columns, rows, color, opacity, glowOpacity } = this.options;

        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'simple-grid-canvas';
        this.ctx = this.canvas.getContext('2d');

        this.container.appendChild(this.canvas);
        this.resize();
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        this.ctx.scale(dpr, dpr);
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
    }

    startAnimation() {
        const animate = () => {
            this.draw();
            requestAnimationFrame(animate);
        };
        animate();
    }

    draw() {
        const { columns, rows, color, opacity, glowOpacity } = this.options;
        const ctx = this.ctx;

        // Clear
        ctx.clearRect(0, 0, this.width, this.height);

        // Calculate cell size to fit screen
        const cellWidth = this.width / columns;
        const cellHeight = this.height / rows;

        // Draw vertical lines
        for (let i = 0; i <= columns; i++) {
            const x = i * cellWidth;

            // Calculate distance from mouse
            const distance = Math.abs(this.mouse.x - x);
            const maxDist = cellWidth * 2;
            const glowFactor = Math.max(0, 1 - distance / maxDist);

            // Line opacity dims near cursor
            const lineOpacity = opacity * (1 - glowFactor * 0.6);

            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
            ctx.strokeStyle = this.hexToRgba(color, lineOpacity);
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Draw horizontal lines
        for (let i = 0; i <= rows; i++) {
            const y = i * cellHeight;

            // Calculate distance from mouse
            const distance = Math.abs(this.mouse.y - y);
            const maxDist = cellHeight * 2;
            const glowFactor = Math.max(0, 1 - distance / maxDist);

            // Line opacity dims near cursor
            const lineOpacity = opacity * (1 - glowFactor * 0.6);

            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.strokeStyle = this.hexToRgba(color, lineOpacity);
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Draw subtle glow at intersections near mouse
        for (let i = 0; i <= columns; i++) {
            for (let j = 0; j <= rows; j++) {
                const x = i * cellWidth;
                const y = j * cellHeight;

                const dx = this.mouse.x - x;
                const dy = this.mouse.y - y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const maxDist = Math.min(cellWidth, cellHeight) * 3;

                if (distance < maxDist) {
                    const glowStrength = (1 - distance / maxDist) * glowOpacity;

                    ctx.beginPath();
                    ctx.arc(x, y, 3, 0, Math.PI * 2);
                    ctx.fillStyle = this.hexToRgba(color, glowStrength);
                    ctx.fill();
                }
            }
        }
    }

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    destroy() {
        this.canvas?.remove();
    }
}

// Helper function
export function initSimpleGrid(containerId, options) {
    const container = document.getElementById(containerId);
    if (container) {
        return new SimpleGrid(container, options);
    }
    return null;
}
