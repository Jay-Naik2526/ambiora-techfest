/**
 * Three.js 3D Particle Background Component
 * Creates an interactive particle system that reacts to mouse movement
 */

import * as THREE from 'three';

export class ThreeBackground {
    constructor(container) {
        this.container = container;
        this.mouse = { x: 0, y: 0 };
        this.targetMouse = { x: 0, y: 0 };
        this.isInitialized = false;

        this.init();
    }

    init() {
        // Scene setup
        this.scene = new THREE.Scene();

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.z = 50;

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 0);

        this.container.appendChild(this.renderer.domElement);

        // Create particles
        this.createParticles();

        // Create ambient elements
        this.createAmbientElements();

        // Event listeners
        this.bindEvents();

        // Start animation
        this.isInitialized = true;
        this.animate();
    }

    createParticles() {
        const particleCount = 1500;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        // Color palette - teal to purple gradient
        const color1 = new THREE.Color(0x00d4aa); // Teal accent
        const color2 = new THREE.Color(0x6366f1); // Indigo
        const color3 = new THREE.Color(0x8b5cf6); // Purple

        for (let i = 0; i < particleCount; i++) {
            // Position - spread in 3D space
            positions[i * 3] = (Math.random() - 0.5) * 150;     // x
            positions[i * 3 + 1] = (Math.random() - 0.5) * 150; // y
            positions[i * 3 + 2] = (Math.random() - 0.5) * 100; // z

            // Random color from palette
            const colorChoice = Math.random();
            let color;
            if (colorChoice < 0.33) {
                color = color1;
            } else if (colorChoice < 0.66) {
                color = color2;
            } else {
                color = color3;
            }

            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            // Random size
            sizes[i] = Math.random() * 2 + 0.5;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        // Particle material with glow effect
        const material = new THREE.PointsMaterial({
            size: 1.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);

        // Store original positions for animation
        this.originalPositions = positions.slice();
    }

    createAmbientElements() {
        // Add floating geometric shapes
        const shapes = [];

        // Tetrahedron
        const tetraGeometry = new THREE.TetrahedronGeometry(3);
        const tetraMaterial = new THREE.MeshBasicMaterial({
            color: 0x00d4aa,
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });
        const tetra = new THREE.Mesh(tetraGeometry, tetraMaterial);
        tetra.position.set(-30, 20, -20);
        shapes.push(tetra);
        this.scene.add(tetra);

        // Octahedron
        const octaGeometry = new THREE.OctahedronGeometry(4);
        const octaMaterial = new THREE.MeshBasicMaterial({
            color: 0x6366f1,
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });
        const octa = new THREE.Mesh(octaGeometry, octaMaterial);
        octa.position.set(35, -15, -15);
        shapes.push(octa);
        this.scene.add(octa);

        // Icosahedron
        const icoGeometry = new THREE.IcosahedronGeometry(2.5);
        const icoMaterial = new THREE.MeshBasicMaterial({
            color: 0x8b5cf6,
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });
        const ico = new THREE.Mesh(icoGeometry, icoMaterial);
        ico.position.set(0, 30, -25);
        shapes.push(ico);
        this.scene.add(ico);

        this.shapes = shapes;
    }

    bindEvents() {
        // Mouse movement
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));

        // Window resize
        window.addEventListener('resize', () => this.onResize());
    }

    onMouseMove(event) {
        // Normalize mouse position to -1 to 1
        this.targetMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.targetMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        if (!this.isInitialized) return;

        requestAnimationFrame(() => this.animate());

        // Smooth mouse following
        this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.05;
        this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.05;

        // Animate particles
        const positions = this.particles.geometry.attributes.position.array;
        const time = Date.now() * 0.0001;

        for (let i = 0; i < positions.length; i += 3) {
            // Mouse influence on particles
            const mouseInfluence = {
                x: this.mouse.x * 10,
                y: this.mouse.y * 10
            };

            // Gentle floating motion
            positions[i] = this.originalPositions[i] + Math.sin(time + i) * 2 + mouseInfluence.x * 0.5;
            positions[i + 1] = this.originalPositions[i + 1] + Math.cos(time + i * 0.5) * 2 + mouseInfluence.y * 0.5;
        }

        this.particles.geometry.attributes.position.needsUpdate = true;

        // Rotate particles slowly
        this.particles.rotation.y += 0.0005;
        this.particles.rotation.x += 0.0002;

        // Animate geometric shapes
        this.shapes.forEach((shape, index) => {
            shape.rotation.x += 0.005 + index * 0.001;
            shape.rotation.y += 0.003 + index * 0.002;

            // Subtle floating motion
            shape.position.y += Math.sin(time * 10 + index * 2) * 0.02;
        });

        // Camera subtle movement based on mouse
        this.camera.position.x += (this.mouse.x * 5 - this.camera.position.x) * 0.02;
        this.camera.position.y += (this.mouse.y * 3 - this.camera.position.y) * 0.02;
        this.camera.lookAt(this.scene.position);

        this.renderer.render(this.scene, this.camera);
    }

    destroy() {
        this.isInitialized = false;

        // Clean up
        this.scene.traverse((object) => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) object.material.dispose();
        });

        this.renderer.dispose();
        this.container.removeChild(this.renderer.domElement);
    }
}

// Auto-initialize if container exists
export function initThreeBackground() {
    const container = document.getElementById('three-background');
    if (container) {
        return new ThreeBackground(container);
    }
    return null;
}
