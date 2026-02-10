/* ============================================
   AMBIORA - CART SYSTEM
   ============================================ */

import { isAuthenticated, redirectToLogin, getCurrentUser } from '../utils/auth.js';

// Cart state management
class CartManager {
    constructor() {
        this.storageKey = 'ambiora_cart';
        this.listeners = [];
        this.init();
    }

    init() {
        // Create cart UI elements
        this.createCartUI();
        this.updateCartBadge();
        this.bindEvents();
    }

    // Get cart from localStorage
    getCart() {
        const cart = localStorage.getItem(this.storageKey);
        return cart ? JSON.parse(cart) : [];
    }

    // Save cart to localStorage
    saveCart(cart) {
        localStorage.setItem(this.storageKey, JSON.stringify(cart));
        this.updateCartBadge();
        this.updateCartPanel();
        this.notifyListeners();
    }

    // Add item to cart
    addItem(item) {
        // Check authentication first
        if (!isAuthenticated()) {
            this.showNotification('Please login to add items to cart', 'info');
            // Redirect to login with current page as return URL
            setTimeout(() => {
                redirectToLogin(window.location.href);
            }, 1000);
            return false;
        }

        const cart = this.getCart();
        const existingIndex = cart.findIndex(i => i.id === item.id);

        // Check if event is already purchased (in My Events)
        const myEvents = this.getMyEvents();
        const isPurchased = myEvents.some(e => e.eventId === item.id);

        if (isPurchased) {
            this.showNotification(`You have already registered for ${item.name}!`, 'info');
            return false;
        }

        if (existingIndex > -1) {
            // Item already in cart - show notification
            this.showNotification(`${item.name} is already in your cart!`, 'info');
            return false;
        }

        cart.push({
            ...item,
            quantity: 1,
            addedAt: Date.now()
        });

        this.saveCart(cart);
        this.showNotification(`${item.name} added to cart!`, 'success');
        this.animateCartIcon();
        return true;
    }

    // Remove item from cart
    removeItem(itemId) {
        const cart = this.getCart();
        const item = cart.find(i => i.id === itemId);
        const updatedCart = cart.filter(i => i.id !== itemId);
        this.saveCart(updatedCart);

        if (item) {
            this.showNotification(`${item.name} removed from cart`, 'info');
        }
    }

    // Clear entire cart
    clearCart() {
        this.saveCart([]);
        this.showNotification('Cart cleared', 'info');
    }

    // Get cart total
    getTotal() {
        const cart = this.getCart();
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    // Get cart item count
    getItemCount() {
        return this.getCart().length;
    }

    // Update cart badge
    updateCartBadge() {
        const badge = document.querySelector('.cart-badge');
        const count = this.getItemCount();

        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    // Animate cart icon on add
    animateCartIcon() {
        const cartIcon = document.querySelector('.cart-icon');
        if (cartIcon) {
            cartIcon.classList.add('cart-bounce');
            setTimeout(() => cartIcon.classList.remove('cart-bounce'), 500);
        }
    }

    // Show notification
    showNotification(message, type = 'info') {
        // Remove existing notification
        const existing = document.querySelector('.cart-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `cart-notification cart-notification--${type}`;
        notification.innerHTML = `
            <span class="cart-notification-icon">${type === 'success' ? '✓' : 'ℹ'}</span>
            <span class="cart-notification-text">${message}</span>
        `;

        document.body.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.classList.add('cart-notification--visible');
        });

        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('cart-notification--visible');
            setTimeout(() => notification.remove(), 300);
        }, 2500);
    }

    // Create cart UI elements
    createCartUI() {
        // Add cart icon to navigation if not exists
        if (!document.querySelector('.cart-nav-item')) {
            const navLinks = document.querySelector('.nav-links');
            if (navLinks) {
                const cartLi = document.createElement('li');
                cartLi.className = 'cart-nav-item';

                // Minimalist Cart Icon matching nav-link style
                cartLi.innerHTML = `
                    <button class="nav-link cart-icon" aria-label="Shopping Cart" style="background: rgba(255, 255, 255, 0.03); border: none; color: rgba(255, 255, 255, 0.6);">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <path d="M16 10a4 4 0 0 1-8 0"></path>
                        </svg>
                        <span class="cart-badge"></span>
                    </button>
                    <div class="cart-tooltip">Cart</div>
                `;

                // Insert before the last item (Profile)
                // We want: ... -> Contact -> Cart -> Profile
                // Profile is the last li
                const profileLi = navLinks.lastElementChild;
                if (profileLi) {
                    navLinks.insertBefore(cartLi, profileLi);
                } else {
                    navLinks.appendChild(cartLi);
                }
            }
        }

        // Create cart panel if not exists
        if (!document.querySelector('.cart-panel')) {
            const cartPanel = document.createElement('div');
            cartPanel.className = 'cart-panel';
            cartPanel.innerHTML = `
                <div class="cart-panel-overlay"></div>
                <div class="cart-panel-content">
                    <div class="cart-panel-header">
                        <h3 class="cart-panel-title">Your Cart</h3>
                        <button class="cart-panel-close" aria-label="Close cart">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <div class="cart-panel-items"></div>
                    <div class="cart-panel-footer">
                        <div class="cart-panel-total">
                            <span>Total:</span>
                            <span class="cart-total-amount">₹0</span>
                        </div>
                        <button class="cart-checkout-btn">Proceed to Checkout</button>
                        <button class="cart-clear-btn">Clear Cart</button>
                    </div>
                </div>
            `;
            document.body.appendChild(cartPanel);
        }
    }

    // Update cart panel content
    updateCartPanel() {
        const itemsContainer = document.querySelector('.cart-panel-items');
        const totalElement = document.querySelector('.cart-total-amount');
        const cart = this.getCart();

        if (!itemsContainer) return;

        if (cart.length === 0) {
            itemsContainer.innerHTML = `
                <div class="cart-empty">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    <p>Your cart is empty</p>
                    <a href="/events.html" class="cart-browse-btn">Browse Events</a>
                </div>
            `;
        } else {
            itemsContainer.innerHTML = cart.map(item => `
                <div class="cart-item" data-id="${item.id}">
                    <div class="cart-item-info">
                        <span class="cart-item-category">${item.category}</span>
                        <h4 class="cart-item-name">${item.name}</h4>
                        <span class="cart-item-host">${item.host || 'Ambiora'}</span>
                    </div>
                    <div class="cart-item-actions">
                        <span class="cart-item-price">₹${item.price}</span>
                        <button class="cart-item-remove" data-id="${item.id}" aria-label="Remove item">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            `).join('');
        }

        if (totalElement) {
            totalElement.textContent = `₹${this.getTotal()}`;
        }
    }

    // Bind events
    bindEvents() {
        // Cart icon click
        document.addEventListener('click', (e) => {
            if (e.target.closest('.cart-icon')) {
                this.toggleCartPanel();
            }

            // Close cart panel
            if (e.target.closest('.cart-panel-close') || e.target.closest('.cart-panel-overlay')) {
                this.closeCartPanel();
            }

            // Remove item
            if (e.target.closest('.cart-item-remove')) {
                const itemId = e.target.closest('.cart-item-remove').dataset.id;
                this.removeItem(itemId);
            }

            // Clear cart
            if (e.target.closest('.cart-clear-btn')) {
                this.clearCart();
            }

            // Checkout
            if (e.target.closest('.cart-checkout-btn')) {
                this.checkout();
            }
        });

        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeCartPanel();
            }
        });
    }

    // Toggle cart panel
    toggleCartPanel() {
        const panel = document.querySelector('.cart-panel');
        if (panel) {
            panel.classList.toggle('cart-panel--open');
            this.updateCartPanel();
        }
    }

    // Open cart panel
    openCartPanel() {
        const panel = document.querySelector('.cart-panel');
        if (panel) {
            panel.classList.add('cart-panel--open');
            this.updateCartPanel();
        }
    }

    // Close cart panel
    closeCartPanel() {
        const panel = document.querySelector('.cart-panel');
        if (panel) {
            panel.classList.remove('cart-panel--open');
        }
    }

    // Checkout - Redirect to Cashfree payment page
    checkout() {
        // Check authentication
        if (!isAuthenticated()) {
            this.showNotification('Please login to checkout', 'info');
            setTimeout(() => {
                redirectToLogin(window.location.href);
            }, 1000);
            return;
        }

        const cart = this.getCart();
        if (cart.length === 0) {
            this.showNotification('Your cart is empty!', 'info');
            return;
        }

        // Close cart panel and redirect to checkout page
        this.closeCartPanel();
        this.showNotification('Redirecting to checkout...', 'info');

        setTimeout(() => {
            window.location.href = '/checkout.html';
        }, 500);
    }

    // Process checkout and generate tickets
    processCheckout(cartItems) {
        try {
            const user = getCurrentUser();
            if (!user) {
                return { success: false, message: 'User not authenticated' };
            }

            // Get existing purchased events
            const myEvents = this.getMyEvents();

            // Generate tickets for each cart item
            const newTickets = cartItems.map(item => {
                const ticketId = this.generateTicketId(item.name, myEvents);
                const purchaseDate = new Date().toISOString();

                return {
                    ticketId,
                    eventId: item.id,
                    eventName: item.name,
                    eventCategory: item.category,
                    eventHost: item.host,
                    eventPrice: item.price,
                    userName: user.name,
                    userEmail: user.email,
                    userId: user.id,
                    purchaseDate,
                    qrData: JSON.stringify({
                        ticketId,
                        eventId: item.id,
                        eventName: item.name,
                        userName: user.name,
                        userEmail: user.email,
                        purchaseDate
                    })
                };
            });

            // Add new tickets to existing events
            const updatedEvents = [...myEvents, ...newTickets];

            // Save to localStorage
            localStorage.setItem('ambiora_my_events', JSON.stringify(updatedEvents));

            return { success: true, tickets: newTickets };
        } catch (error) {
            console.error('Checkout error:', error);
            return { success: false, message: error.message };
        }
    }

    // Generate unique ticket ID
    generateTicketId(eventName, existingEvents) {
        // Get first 2 letters of event name (uppercase)
        const prefix = eventName.substring(0, 2).toUpperCase();

        // Count existing tickets with same prefix
        const existingTicketsWithPrefix = existingEvents.filter(
            event => event.ticketId && event.ticketId.startsWith(prefix)
        );

        // Generate serial number
        const serialNumber = String(existingTicketsWithPrefix.length + 1).padStart(3, '0');

        return `${prefix}${serialNumber}`;
    }

    // Get purchased events from localStorage
    getMyEvents() {
        const events = localStorage.getItem('ambiora_my_events');
        return events ? JSON.parse(events) : [];
    }

    // Subscribe to cart changes
    subscribe(callback) {
        this.listeners.push(callback);
    }

    // Notify listeners
    notifyListeners() {
        this.listeners.forEach(callback => callback(this.getCart()));
    }
}

// Initialize cart manager
let cartManager;

function initCart() {
    if (!cartManager) {
        cartManager = new CartManager();
    }
    return cartManager;
}

// Export for use in other modules
export { initCart, CartManager };
export default cartManager;
