/**
 * IsometricGrid - Equally spaced dimmed grid using Three.js
 * Clean orthogonal grid with hover dimming effect
 */

import * as THREE from 'three';

export class IsometricGrid {
    constructor(container, options = {}) {
        this.container = container;

        this.options = {
            gridSize: options.gridSize || 50,
            cellSize: options.cellSize || 40,
            baseColor: options.baseColor || '#00d4aa',
            baseOpacity: options.baseOpacity || 0.12,
            hoverRadius: options.hoverRadius || 200,
            dimStrength: options.dimStrength || 0.8
        };

        this.mouse = { x: 0, y: 0 };
        this.targetMouse = { x: 0, y: 0 };
        this.isInitialized = false;

        this.init();
    }

    init() {
        // Scene setup
        this.scene = new THREE.Scene();

        // Top-down orthographic camera for flat grid
        const aspect = window.innerWidth / window.innerHeight;
        const frustumSize = 800;
        this.camera = new THREE.OrthographicCamera(
            -frustumSize * aspect,
            frustumSize * aspect,
            frustumSize,
            -frustumSize,
            0.1,
            1000
        );

        // Position camera directly above looking down
        this.camera.position.set(0, 100, 0);
        this.camera.lookAt(0, 0, 0);
        this.camera.rotation.z = Math.PI / 4; // 45 degree rotation for isometric feel

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 0);

        this.container.appendChild(this.renderer.domElement);

        // Create uniform grid
        this.createGrid();

        // Bind events
        this.bindEvents();

        // Start animation
        this.isInitialized = true;
        this.animate();
    }

    createGrid() {
        const { gridSize, cellSize, baseColor, baseOpacity } = this.options;

        this.gridLines = [];

        const color = new THREE.Color(baseColor);
        const halfSize = (gridSize * cellSize) / 2;

        // Create horizontal lines (equally spaced)
        for (let i = 0; i <= gridSize; i++) {
            const y = -halfSize + i * cellSize;

            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array([
                -halfSize, 0, y,
                halfSize, 0, y
            ]);
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

            const material = new THREE.LineBasicMaterial({
                color: color,
                transparent: true,
                opacity: baseOpacity
            });

            const line = new THREE.Line(geometry, material);
            line.userData.type = 'horizontal';
            line.userData.index = i;
            line.userData.centerZ = y;
            this.scene.add(line);
            this.gridLines.push(line);
        }

        // Create vertical lines (equally spaced)
        for (let i = 0; i <= gridSize; i++) {
            const x = -halfSize + i * cellSize;

            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array([
                x, 0, -halfSize,
                x, 0, halfSize
            ]);
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

            const material = new THREE.LineBasicMaterial({
                color: color,
                transparent: true,
                opacity: baseOpacity
            });

            const line = new THREE.Line(geometry, material);
            line.userData.type = 'vertical';
            line.userData.index = i;
            line.userData.centerX = x;
            this.scene.add(line);
            this.gridLines.push(line);
        }

        // Add subtle glow dots at intersections (sparse, every 5 cells)
        const dotGeometry = new THREE.CircleGeometry(2, 6);
        for (let i = 0; i <= gridSize; i += 5) {
            for (let j = 0; j <= gridSize; j += 5) {
                const x = -halfSize + i * cellSize;
                const z = -halfSize + j * cellSize;

                const material = new THREE.MeshBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: baseOpacity * 1.5
                });

                const dot = new THREE.Mesh(dotGeometry, material);
                dot.rotation.x = -Math.PI / 2;
                dot.position.set(x, 0.1, z);
                dot.userData.posX = x;
                dot.userData.posZ = z;

                this.scene.add(dot);
                this.gridLines.push(dot);
            }
        }
    }

    bindEvents() {
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('resize', () => this.onResize());
    }

    onMouseMove(event) {
        // Normalize mouse to -1 to 1
        this.targetMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.targetMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    onResize() {
        const aspect = window.innerWidth / window.innerHeight;
        const frustumSize = 800;

        this.camera.left = -frustumSize * aspect;
        this.camera.right = frustumSize * aspect;
        this.camera.top = frustumSize;
        this.camera.bottom = -frustumSize;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        if (!this.isInitialized) return;
        requestAnimationFrame(() => this.animate());

        // Smooth mouse following
        this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.1;
        this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.1;

        // Convert mouse to world space
        const worldX = this.mouse.x * 800;
        const worldZ = -this.mouse.y * 800;

        const { hoverRadius, dimStrength, baseOpacity } = this.options;

        // Update grid with hover dimming
        this.gridLines.forEach((obj) => {
            let distance;

            if (obj.userData.type === 'horizontal') {
                // Distance from mouse to horizontal line
                distance = Math.abs(obj.userData.centerZ - worldZ);
            } else if (obj.userData.type === 'vertical') {
                // Distance from mouse to vertical line
                distance = Math.abs(obj.userData.centerX - worldX);
            } else {
                // Distance from mouse to dot
                const dx = obj.userData.posX - worldX;
                const dz = obj.userData.posZ - worldZ;
                distance = Math.sqrt(dx * dx + dz * dz);
            }

            // Dim effect - closer = dimmer (inverse glow)
            const dimFactor = Math.max(0, 1 - distance / hoverRadius);
            const targetOpacity = baseOpacity * (1 - dimFactor * dimStrength);

            // Smooth transition
            obj.material.opacity += (targetOpacity - obj.material.opacity) * 0.15;
        });

        this.renderer.render(this.scene, this.camera);
    }

    destroy() {
        this.isInitialized = false;
        if (this.renderer) {
            this.renderer.dispose();
            this.container.removeChild(this.renderer.domElement);
        }
    }
}

// Helper function
export function initIsometricGrid(containerId, options) {
    const container = document.getElementById(containerId);
    if (container) {
        return new IsometricGrid(container, options);
    }
    return null;
}
