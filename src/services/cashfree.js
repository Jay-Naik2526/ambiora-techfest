/* ============================================
   AMBIORA - CASHFREE PAYMENT SERVICE
   ============================================ */

import { API_CONFIG } from '../config/api.js';

/**
 * Cashfree Payment Integration Service
 * 
 * SETUP INSTRUCTIONS:
 * 1. Replace CASHFREE_APP_ID with your Cashfree App ID
 * 2. Set CASHFREE_ENV to 'sandbox' for testing or 'production' for live
 * 3. The SECRET KEY should NEVER be in frontend code - it's only used server-side
 *    For demo/prototype purposes, order creation is simulated client-side.
 *    In production, replace createOrder() with a call to YOUR backend server.
 */

// ─── CONFIGURATION ──────────────────────────────────
const CASHFREE_CONFIG = {
    appId: '12036812ef25ec0142f7963aeb11863021',       // ← Replace with your App ID
    env: 'production',                       // 'sandbox' or 'production'
    // SDK URLs
    sdkUrl: {
        sandbox: 'https://sdk.cashfree.com/js/v3/cashfree.js',
        production: 'https://sdk.cashfree.com/js/v3/cashfree.js'
    },
    // API URLs (for backend - reference only)
    apiUrl: {
        sandbox: 'https://sandbox.cashfree.com/pg',
        production: 'https://api.cashfree.com/pg'
    },
    apiVersion: '2025-01-01'
};

// ─── SDK LOADER ──────────────────────────────────────
let cashfreeInstance = null;
let sdkLoaded = false;

/**
 * Load the Cashfree JS SDK dynamically
 */
function loadCashfreeSDK() {
    return new Promise((resolve, reject) => {
        if (sdkLoaded && window.Cashfree) {
            resolve(window.Cashfree);
            return;
        }

        // Check if script already exists
        const existing = document.querySelector('script[src*="cashfree"]');
        if (existing) {
            existing.addEventListener('load', () => {
                sdkLoaded = true;
                resolve(window.Cashfree);
            });
            return;
        }

        const script = document.createElement('script');
        script.src = CASHFREE_CONFIG.sdkUrl[CASHFREE_CONFIG.env];
        script.async = true;

        script.onload = () => {
            sdkLoaded = true;
            resolve(window.Cashfree);
        };

        script.onerror = () => {
            reject(new Error('Failed to load Cashfree SDK'));
        };

        document.head.appendChild(script);
    });
}

/**
 * Initialize Cashfree SDK instance
 */
async function initCashfree() {
    try {
        const Cashfree = await loadCashfreeSDK();
        cashfreeInstance = Cashfree({
            mode: CASHFREE_CONFIG.env === 'production' ? 'production' : 'sandbox'
        });
        return cashfreeInstance;
    } catch (error) {
        console.error('Cashfree SDK initialization failed:', error);
        throw error;
    }
}

// ─── ORDER CREATION ──────────────────────────────────
/**
 * Generate a unique order ID
 */
function generateOrderId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `AMB_${timestamp}_${random}`.toUpperCase();
}

/**
 * Create an order with Cashfree
 * 
 * ⚠️ IMPORTANT: In production, this MUST be done on your backend server.
 * The secret key should NEVER be exposed in frontend code.
 * 
 * For now, this simulates order creation for the demo.
 * Replace the body of this function with a fetch() call to your backend.
 * 
 * Example backend call:
 *   const response = await fetch('/api/create-order', {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({ cart, user })
 *   });
 *   return await response.json();
 */
async function createOrder(cart, user) {
    const orderId = generateOrderId();
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const orderData = {
        order_id: orderId,
        order_amount: totalAmount,
        order_currency: 'INR',
        customer_details: {
            customer_id: user.id || `CUST_${Date.now()}`,
            customer_name: user.name,
            customer_email: user.email,
            customer_phone: user.phone || '9999999999'
        },
        order_meta: {
            return_url: `${API_CONFIG.BASE_URL}/checkout.html?order_id=${orderId}&status={order_status}`
        },
        order_note: `Ambiora Tech Fest - ${cart.map(i => i.name).join(', ')}`,
        order_items: cart.map(item => ({
            item_id: item.id,
            item_name: item.name,
            item_price: item.price,
            item_quantity: item.quantity || 1
        }))
    };

    // ──────────────────────────────────────────────────
    // Call the backend server to create the order
    // The backend holds the secret key and calls Cashfree API
    // ──────────────────────────────────────────────────
    try {
        const response = await fetch(`${API_CONFIG.API_URL}/cashfree/create-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Order creation failed: ${response.status}`);
        }

        const result = await response.json();
        return {
            success: true,
            simulated: false,
            order_id: result.order_id,
            order_amount: totalAmount,
            payment_session_id: result.payment_session_id
        };
    } catch (error) {
        // If backend is not running, fall back to simulated mode for testing
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            console.warn('Cashfree: Backend server not running. Using simulated payment.');
            console.warn('Run "npm run server" to start the payment server.');
            return {
                success: true,
                simulated: true,
                order_id: orderId,
                order_amount: totalAmount,
                payment_session_id: `sim_session_${orderId}`,
                order_data: orderData
            };
        }

        console.error('Order creation error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ─── PAYMENT PROCESSING ─────────────────────────────

/**
 * Process payment through Cashfree
 * @param {Array} cart - Cart items with prices
 * @param {Object} user - Current user info
 * @returns {Promise<Object>} Payment result
 */
async function processPayment(cart, user) {
    // Step 1: Create order
    const orderResult = await createOrder(cart, user);

    if (!orderResult.success) {
        return {
            success: false,
            error: orderResult.error || 'Failed to create order'
        };
    }

    // Step 2: If simulated, run simulated payment flow
    if (orderResult.simulated) {
        return await simulatePayment(orderResult);
    }

    // Step 3: Real Cashfree payment
    try {
        const cf = cashfreeInstance || await initCashfree();

        return new Promise((resolve) => {
            cf.checkout({
                paymentSessionId: orderResult.payment_session_id,
                onSuccess: (data) => {
                    resolve({
                        success: true,
                        order_id: orderResult.order_id,
                        payment_data: data,
                        amount: orderResult.order_amount
                    });
                },
                onFailure: (data) => {
                    resolve({
                        success: false,
                        order_id: orderResult.order_id,
                        error: 'Payment was declined or cancelled. Please try again.',
                        payment_data: data
                    });
                },
                onCancel: () => {
                    resolve({
                        success: false,
                        order_id: orderResult.order_id,
                        error: 'Payment was cancelled. Your cart items are still saved.',
                        cancelled: true
                    });
                }
            });
        });
    } catch (error) {
        return {
            success: false,
            error: `Payment initialization failed: ${error.message}`
        };
    }
}

// ─── SIMULATED PAYMENT ──────────────────────────────
/**
 * Simulated payment for demo/testing when no Cashfree credentials are configured
 */
function simulatePayment(orderResult) {
    return new Promise((resolve) => {
        // Show a simulated payment modal
        const modal = createSimulatedPaymentModal(orderResult);
        document.body.appendChild(modal);

        // Animate in
        requestAnimationFrame(() => {
            modal.classList.add('sim-modal--visible');
        });

        // Handle buttons
        modal.querySelector('.sim-pay-success').addEventListener('click', () => {
            closeSimModal(modal);
            resolve({
                success: true,
                order_id: orderResult.order_id,
                amount: orderResult.order_amount,
                simulated: true
            });
        });

        modal.querySelector('.sim-pay-fail').addEventListener('click', () => {
            closeSimModal(modal);
            resolve({
                success: false,
                order_id: orderResult.order_id,
                error: 'Payment was declined by your bank. Please try again or use a different payment method.',
                simulated: true
            });
        });

        modal.querySelector('.sim-pay-cancel').addEventListener('click', () => {
            closeSimModal(modal);
            resolve({
                success: false,
                order_id: orderResult.order_id,
                error: 'Payment was cancelled. Your cart items are still saved.',
                cancelled: true,
                simulated: true
            });
        });
    });
}

function closeSimModal(modal) {
    modal.classList.remove('sim-modal--visible');
    setTimeout(() => modal.remove(), 300);
}

function createSimulatedPaymentModal(orderResult) {
    const modal = document.createElement('div');
    modal.className = 'sim-payment-modal';
    modal.innerHTML = `
        <div class="sim-modal-overlay"></div>
        <div class="sim-modal-content">
            <div class="sim-modal-header">
                <div class="sim-cashfree-logo">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00d4aa" stroke-width="2">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                        <line x1="1" y1="10" x2="23" y2="10"></line>
                    </svg>
                    <span>Cashfree Payment</span>
                </div>
                <div class="sim-badge">SANDBOX MODE</div>
            </div>
            <div class="sim-modal-body">
                <div class="sim-order-info">
                    <span class="sim-order-label">Order ID</span>
                    <span class="sim-order-value">${orderResult.order_id}</span>
                </div>
                <div class="sim-amount">
                    <span class="sim-amount-label">Amount to Pay</span>
                    <span class="sim-amount-value">₹${orderResult.order_amount}</span>
                </div>
                <p class="sim-note">This is a simulated payment gateway. Configure your Cashfree App ID in <code>src/services/cashfree.js</code> for real payments.</p>
                <div class="sim-actions">
                    <button class="sim-pay-success">✓ Simulate Success</button>
                    <button class="sim-pay-fail">✗ Simulate Failure</button>
                    <button class="sim-pay-cancel">Cancel Payment</button>
                </div>
            </div>
        </div>
    `;
    return modal;
}

// ─── PAYMENT VERIFICATION ───────────────────────────
/**
 * Check payment status from URL params (after redirect back from Cashfree)
 */
function checkPaymentStatus() {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('order_id');
    const status = params.get('status');

    if (!orderId || !status) return null;

    return {
        order_id: orderId,
        status: status,
        success: status === 'PAID' || status === 'SUCCESS'
    };
}

/**
 * Verify payment status with backend server
 * @param {string} orderId 
 */
async function verifyPayment(orderId) {
    try {
        const response = await fetch(`${API_CONFIG.API_URL}/cashfree/order/${orderId}`);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Payment verification failed');
        }

        return {
            success: result.order_status === 'PAID',
            order_id: result.order_id,
            status: result.order_status,
            amount: result.order_amount
        };
    } catch (error) {
        console.error('Payment verification error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ─── EXPORTS ─────────────────────────────────────────
export {
    CASHFREE_CONFIG,
    initCashfree,
    createOrder,
    processPayment,
    checkPaymentStatus,
    generateOrderId,
    verifyPayment
};
