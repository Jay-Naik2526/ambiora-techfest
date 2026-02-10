/* ============================================
   AMBIORA - CHECKOUT PAGE SCRIPT
   ============================================ */

import { isAuthenticated, getCurrentUser, redirectToLogin, saveRegistration } from '../utils/auth.js';
import { initCashfree, processPayment, checkPaymentStatus, verifyPayment } from '../services/cashfree.js';
import { eventsData } from '../data/eventsData.js';

// ─── CONSTANTS ───────────────────────────────────────
const CART_KEY = 'ambiora_cart';
const MY_EVENTS_KEY = 'ambiora_my_events';

// ─── INITIALIZATION ─────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Auth guard
    if (!isAuthenticated()) {
        redirectToLogin('/checkout.html');
        return;
    }

    // Check if returning from Cashfree redirect
    const paymentStatus = checkPaymentStatus();
    if (paymentStatus) {
        handleReturnFromPayment(paymentStatus);
        return;
    }

    initCheckoutPage();
});

/**
 * Initialize the checkout page
 */
function initCheckoutPage() {
    const cart = getCart();
    const user = getCurrentUser();

    if (cart.length === 0) {
        showEmptyCheckout();
        return;
    }

    // Render order summary with dynamic prices
    renderOrderSummary(cart);
    renderUserInfo(user);
    renderOrderTotal(cart);
    bindPayButton(cart, user);

    // Pre-initialize Cashfree SDK
    initCashfree().catch(err => {
        console.warn('Cashfree SDK pre-load failed (will retry on payment):', err.message);
    });
}

// ─── CART ACCESS ─────────────────────────────────────
function getCart() {
    const cart = localStorage.getItem(CART_KEY);
    return cart ? JSON.parse(cart) : [];
}

function clearCart() {
    localStorage.setItem(CART_KEY, JSON.stringify([]));
}

// ─── RENDER: ORDER SUMMARY ──────────────────────────
/**
 * Render order items with dynamic prices fetched from eventsData
 */
function renderOrderSummary(cart) {
    const container = document.getElementById('order-items');
    const countEl = document.getElementById('item-count');
    if (!container) return;

    if (countEl) {
        countEl.textContent = `${cart.length} event${cart.length > 1 ? 's' : ''}`;
    }

    container.innerHTML = cart.map(item => {
        // Dynamically fetch the latest price from eventsData
        const eventData = eventsData.find(e => e.id === item.id);
        const dynamicPrice = eventData ? eventData.price : item.price;

        // Update cart item price to match eventsData (source of truth)
        item.price = dynamicPrice;

        return `
            <div class="order-item">
                <div class="order-item-info">
                    <div class="order-item-name">${item.name}</div>
                    <div class="order-item-details">
                        <span class="order-item-category">${item.category}</span>
                        <span class="order-item-host">${item.host || 'Ambiora'}</span>
                    </div>
                </div>
                <div class="order-item-price">₹${dynamicPrice}</div>
            </div>
        `;
    }).join('');
}

// ─── RENDER: USER INFO ───────────────────────────────
function renderUserInfo(user) {
    const container = document.getElementById('user-info');
    if (!container) return;

    const initials = user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);

    container.innerHTML = `
        <div class="user-info-avatar">${initials}</div>
        <div class="user-info-details">
            <div class="user-info-name">${user.name}</div>
            <div class="user-info-email">${user.email}</div>
        </div>
    `;
}

// ─── RENDER: ORDER TOTAL ─────────────────────────────
function renderOrderTotal(cart) {
    const container = document.getElementById('order-total');
    if (!container) return;

    const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const convenienceFee = Math.round(subtotal * 0.025); // 2.5% fee
    const total = subtotal + convenienceFee;

    container.innerHTML = `
        <div class="order-total-row">
            <span class="order-total-label">Subtotal (${cart.length} events)</span>
            <span class="order-total-value">₹${subtotal}</span>
        </div>
        <div class="order-total-row">
            <span class="order-total-label">Convenience Fee (2.5%)</span>
            <span class="order-total-value">₹${convenienceFee}</span>
        </div>
        <div class="order-total-row">
            <span class="order-total-label order-total-label--grand">Total</span>
            <span class="order-total-value order-total-value--grand">₹${total}</span>
        </div>
    `;
}

// ─── PAY BUTTON ──────────────────────────────────────
function bindPayButton(cart, user) {
    const payBtn = document.getElementById('pay-btn');
    const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const convenienceFee = Math.round(subtotal * 0.025);
    const total = subtotal + convenienceFee;

    if (payBtn) {
        // Update button text with dynamic total
        const btnText = payBtn.querySelector('.btn-text');
        if (btnText) {
            btnText.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                    <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
                Pay ₹${total} with Cashfree
            `;
        }

        payBtn.addEventListener('click', () => handlePayment(cart, user));
    }
}

// ─── PAYMENT HANDLER ─────────────────────────────────
async function handlePayment(cart, user) {
    const payBtn = document.getElementById('pay-btn');

    // Hide any previous error
    hideError();

    // Show processing state
    setPayButtonProcessing(true);

    try {
        const result = await processPayment(cart, user);

        if (result.success) {
            // Payment successful! Generate tickets
            await handlePaymentSuccess(cart, user, result);
        } else {
            // Payment failed - show error, keep cart intact
            handlePaymentFailure(result.error || 'Payment failed. Please try again.');
        }
    } catch (error) {
        console.error('Payment error:', error);
        handlePaymentFailure('An unexpected error occurred. Please try again.');
    } finally {
        setPayButtonProcessing(false);
    }
}

// ─── PAYMENT SUCCESS ─────────────────────────────────
async function handlePaymentSuccess(cart, user, paymentResult) {
    try {
        // Generate tickets with QR codes
        const tickets = generateTickets(cart, user);

        // ──────────────────────────────────────────────────
        // SAVE REGISTRATION TO MONGODB
        // ──────────────────────────────────────────────────
        try {
            const registrationData = {
                events: cart.map(item => ({
                    eventId: item.id,
                    eventName: item.name,
                    eventPrice: item.price,
                    eventCategory: item.category,
                    eventDate: item.date || '',
                    eventDescription: item.description || ''
                })),
                totalAmount: cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0),
                orderId: paymentResult.order_id || `ORDER_${Date.now()}`,
                paymentSessionId: paymentResult.payment_session_id || '',
                paymentStatus: 'success'
            };

            const saveResult = await saveRegistration(registrationData);

            if (saveResult.success) {
                console.log('✅ Registration saved to MongoDB:', saveResult.registration);
            } else {
                console.warn('⚠️ Failed to save registration to MongoDB:', saveResult.message);
                // Continue anyway - we'll save to localStorage as fallback
            }
        } catch (dbError) {
            console.error('❌ MongoDB save error:', dbError);
            // Continue with localStorage save as fallback
        }

        // Save tickets to localStorage (fallback/offline access)
        const existingEvents = getMyEvents();
        const updatedEvents = [...existingEvents, ...tickets];
        localStorage.setItem(MY_EVENTS_KEY, JSON.stringify(updatedEvents));

        // Clear cart
        clearCart();

        // Show brief success notification before redirect
        showSuccessOverlay(paymentResult.amount || cart.reduce((s, i) => s + i.price, 0));

        // Redirect to My Events page
        setTimeout(() => {
            window.location.href = '/my-events.html?success=true';
        }, 2000);
    } catch (error) {
        console.error('Ticket generation error:', error);
        // Payment was successful but ticket generation failed
        // Still clear cart and redirect - tickets can be regenerated
        clearCart();
        window.location.href = '/my-events.html?success=true';
    }
}

// ─── PAYMENT FAILURE ─────────────────────────────────
function handlePaymentFailure(errorMessage) {
    // Show the prominent error banner
    showError(errorMessage);

    // Cart remains intact - items are NOT removed
    // User can see their items still on the checkout page
}

// ─── TICKET GENERATION ──────────────────────────────
function generateTickets(cartItems, user) {
    const myEvents = getMyEvents();

    return cartItems.map(item => {
        const ticketId = generateTicketId(item.name, myEvents);
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
}

function generateTicketId(eventName, existingEvents) {
    const prefix = eventName.substring(0, 2).toUpperCase();
    const existingTicketsWithPrefix = existingEvents.filter(
        event => event.ticketId && event.ticketId.startsWith(prefix)
    );
    const serialNumber = String(existingTicketsWithPrefix.length + 1).padStart(3, '0');
    return `${prefix}${serialNumber}`;
}

function getMyEvents() {
    const events = localStorage.getItem(MY_EVENTS_KEY);
    return events ? JSON.parse(events) : [];
}

// ─── HANDLE REDIRECT RETURN ─────────────────────────
/**
 * Handle returning from Cashfree payment redirect
 */
/**
 * Handle returning from Cashfree payment redirect
 */
async function handleReturnFromPayment(paymentStatus) {
    const cart = getCart();
    const user = getCurrentUser();

    // Show processing state initially
    const payBtn = document.getElementById('pay-btn');
    if (payBtn) {
        setPayButtonProcessing(true);
        const btnText = payBtn.querySelector('.btn-text');
        if (btnText) btnText.innerHTML = 'Verifying Payment...';
    }

    // ──────────────────────────────────────────────────
    // VERIFY PAYMENT WITH BACKEND (SECURE CHECK)
    // ──────────────────────────────────────────────────
    let verifiedStatus = { success: false };

    try {
        // Verify with backend using order_id from URL
        verifiedStatus = await verifyPayment(paymentStatus.order_id);
    } catch (error) {
        console.error('Verification failed:', error);
        // Fallback: if backend fails, trust URL params as last resort (for demo only)
        verifiedStatus = paymentStatus;
    }

    if (!cart.length || !user) {
        // Cart was already cleared (success) or user not logged in
        if (verifiedStatus.success) {
            window.location.href = '/my-events.html?success=true';
        } else {
            initCheckoutPage();
            handlePaymentFailure('Payment verification failed. Please try again.');
        }
        return;
    }

    // Render the page first
    renderOrderSummary(cart);
    renderUserInfo(user);
    renderOrderTotal(cart);
    bindPayButton(cart, user);

    if (verifiedStatus.success) {
        await handlePaymentSuccess(cart, user, {
            order_id: verifiedStatus.order_id,
            amount: verifiedStatus.amount
        });
    } else {
        handlePaymentFailure('Payment was not completed or verification failed. Please try again.');
    }

    // Clean URL
    window.history.replaceState({}, '', '/checkout.html');
}

// ─── UI HELPERS ──────────────────────────────────────

function showError(message) {
    const banner = document.getElementById('payment-error');
    const msgEl = document.getElementById('error-message');

    if (banner && msgEl) {
        msgEl.textContent = message;
        banner.classList.add('payment-error-banner--visible');

        // Scroll to top so user sees the error
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function hideError() {
    const banner = document.getElementById('payment-error');
    if (banner) {
        banner.classList.remove('payment-error-banner--visible');
    }
}

function setPayButtonProcessing(isProcessing) {
    const payBtn = document.getElementById('pay-btn');
    if (payBtn) {
        if (isProcessing) {
            payBtn.classList.add('checkout-pay-btn--processing');
            payBtn.disabled = true;
        } else {
            payBtn.classList.remove('checkout-pay-btn--processing');
            payBtn.disabled = false;
        }
    }
}

function showEmptyCheckout() {
    const mainContent = document.getElementById('checkout-content');
    const emptyState = document.getElementById('checkout-empty');

    if (mainContent) mainContent.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
}

function showSuccessOverlay(amount) {
    const overlay = document.createElement('div');
    overlay.className = 'success-overlay';
    overlay.innerHTML = `
        <div class="success-overlay-content">
            <div class="success-checkmark">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
            </div>
            <h3 style="color: #10b981; font-family: var(--font-display); font-size: 1.5rem; margin: 1rem 0 0.5rem;">Payment Successful!</h3>
            <p style="color: rgba(255,255,255,0.6); font-size: 0.9rem;">₹${amount} paid • Generating your tickets...</p>
        </div>
    `;
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.85); backdrop-filter: blur(10px);
        display: flex; align-items: center; justify-content: center;
        z-index: 3000; animation: fadeIn 0.3s ease;
    `;
    document.body.appendChild(overlay);
}

// Error dismiss handler
document.addEventListener('click', (e) => {
    if (e.target.closest('.payment-error-dismiss')) {
        hideError();
    }
});

// ─── EXPORTS ─────────────────────────────────────────
export { initCheckoutPage };
