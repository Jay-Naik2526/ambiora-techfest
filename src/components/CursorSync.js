/**
 * Cursor Synchronization Component
 * Shows other visitors' cursors in real-time
 * Local demo version without server dependency
 */

export class CursorSync {
    constructor() {
        this.cursors = new Map();
        this.userId = this.generateUserId();
        this.myColor = this.getRandomColor();
        this.isEnabled = true;
        this.mousePosition = { x: 0, y: 0 };

        this.init();
    }

    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9);
    }

    getRandomColor() {
        const colors = [
            '#00d4aa', // Teal
            '#6366f1', // Indigo
            '#8b5cf6', // Purple
            '#f59e0b', // Amber
            '#ef4444', // Red
            '#10b981', // Emerald
            '#3b82f6', // Blue
            '#ec4899'  // Pink
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    init() {
        // Create cursor container
        this.container = document.createElement('div');
        this.container.id = 'cursor-sync-container';
        this.container.innerHTML = `
      <div class="cursor-sync-indicator">
        <span class="cursor-sync-dot"></span>
        <span class="cursor-sync-label">Live: <span class="cursor-sync-count">1</span></span>
      </div>
    `;
        document.body.appendChild(this.container);

        // Create my cursor trail element
        this.myTrail = this.createCursorTrail('You', this.myColor);

        // Bind events
        this.bindEvents();

        // Start demo simulation
        this.startDemoMode();
    }

    createCursorTrail(name, color) {
        const trail = document.createElement('div');
        trail.className = 'cursor-remote';
        trail.innerHTML = `
      <svg class="cursor-remote-icon" viewBox="0 0 24 24" fill="${color}">
        <path d="M4 4l16 8-8 3-3 8z"/>
      </svg>
      <span class="cursor-remote-name" style="background: ${color}">${name}</span>
    `;
        trail.style.setProperty('--cursor-color', color);
        document.body.appendChild(trail);
        return trail;
    }

    bindEvents() {
        // Track mouse movement
        document.addEventListener('mousemove', (e) => {
            this.mousePosition = { x: e.clientX, y: e.clientY };

            // Update my trail position
            if (this.myTrail) {
                this.myTrail.style.left = `${e.clientX}px`;
                this.myTrail.style.top = `${e.clientY}px`;
                this.myTrail.classList.add('active');
            }
        });

        // Hide trail when cursor leaves
        document.addEventListener('mouseleave', () => {
            if (this.myTrail) {
                this.myTrail.classList.remove('active');
            }
        });
    }

    startDemoMode() {
        // Simulate other users for demo purposes
        const demoUsers = [
            { name: 'Alice', color: '#6366f1' },
            { name: 'Bob', color: '#ef4444' },
            { name: 'Carol', color: '#10b981' }
        ];

        // Add demo cursors with random movements
        demoUsers.forEach((user, index) => {
            setTimeout(() => {
                this.addDemoCursor(user.name, user.color, index);
            }, 2000 + index * 1500);
        });

        // Update user count
        this.updateUserCount(1);
    }

    addDemoCursor(name, color, index) {
        const cursor = this.createCursorTrail(name, color);
        this.cursors.set(name, cursor);

        // Update count
        this.updateUserCount(this.cursors.size + 1);

        // Animate cursor with random path
        this.animateDemoCursor(cursor, index);

        // Remove after some time
        setTimeout(() => {
            this.removeCursor(name);
        }, 15000 + Math.random() * 10000);
    }

    animateDemoCursor(cursor, seed) {
        let time = 0;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const radiusX = 200 + seed * 50;
        const radiusY = 150 + seed * 30;
        const speed = 0.0015 + seed * 0.0005;

        const animate = () => {
            if (!cursor.parentElement) return;

            time += speed;

            // Create smooth, organic movement
            const x = centerX + Math.sin(time + seed) * radiusX + Math.sin(time * 1.5) * 50;
            const y = centerY + Math.cos(time * 0.7 + seed) * radiusY + Math.cos(time * 1.2) * 40;

            cursor.style.left = `${x}px`;
            cursor.style.top = `${y}px`;
            cursor.classList.add('active');

            requestAnimationFrame(animate);
        };

        animate();
    }

    removeCursor(name) {
        const cursor = this.cursors.get(name);
        if (cursor) {
            cursor.classList.add('leaving');
            setTimeout(() => {
                cursor.remove();
                this.cursors.delete(name);
                this.updateUserCount(this.cursors.size + 1);
            }, 300);
        }
    }

    updateUserCount(count) {
        const countEl = document.querySelector('.cursor-sync-count');
        if (countEl) {
            countEl.textContent = count;
        }

        // Update indicator visibility
        const indicator = document.querySelector('.cursor-sync-indicator');
        if (indicator) {
            indicator.classList.toggle('has-others', count > 1);
        }
    }

    destroy() {
        this.isEnabled = false;
        this.container?.remove();
        this.myTrail?.remove();
        this.cursors.forEach(cursor => cursor.remove());
        this.cursors.clear();
    }
}

// WebSocket-ready version for production
export class CursorSyncWS extends CursorSync {
    constructor(wsUrl) {
        super();
        this.wsUrl = wsUrl;
        this.ws = null;
        this.reconnectAttempts = 0;

        if (wsUrl) {
            this.connectWebSocket();
        }
    }

    connectWebSocket() {
        try {
            this.ws = new WebSocket(this.wsUrl);

            this.ws.onopen = () => {
                console.log('Cursor sync connected');
                this.reconnectAttempts = 0;
                this.sendPosition();
            };

            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            };

            this.ws.onclose = () => {
                console.log('Cursor sync disconnected');
                this.scheduleReconnect();
            };

            this.ws.onerror = (error) => {
                console.warn('Cursor sync error:', error);
            };
        } catch (error) {
            console.warn('WebSocket not available:', error);
        }
    }

    handleMessage(data) {
        switch (data.type) {
            case 'cursor_move':
                this.updateRemoteCursor(data.userId, data.x, data.y, data.color, data.name);
                break;
            case 'user_left':
                this.removeCursor(data.userId);
                break;
            case 'user_count':
                this.updateUserCount(data.count);
                break;
        }
    }

    updateRemoteCursor(userId, x, y, color, name) {
        if (userId === this.userId) return;

        let cursor = this.cursors.get(userId);
        if (!cursor) {
            cursor = this.createCursorTrail(name || 'Visitor', color);
            this.cursors.set(userId, cursor);
        }

        cursor.style.left = `${x}px`;
        cursor.style.top = `${y}px`;
        cursor.classList.add('active');
    }

    sendPosition() {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'cursor_move',
                userId: this.userId,
                x: this.mousePosition.x,
                y: this.mousePosition.y,
                color: this.myColor
            }));
        }
    }

    scheduleReconnect() {
        if (this.reconnectAttempts < 5) {
            this.reconnectAttempts++;
            setTimeout(() => this.connectWebSocket(), 2000 * this.reconnectAttempts);
        }
    }
}

// Initialize function
export function initCursorSync(wsUrl = null) {
    if (wsUrl) {
        return new CursorSyncWS(wsUrl);
    }
    return new CursorSync();
}
