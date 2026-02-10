/* ============================================
   AMBIORA - MY EVENTS PAGE SCRIPT
   ============================================ */

import QRCode from 'qrcode';
import { isAuthenticated, getCurrentUser, redirectToLogin } from '../utils/auth.js';

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!isAuthenticated()) {
        redirectToLogin('/my-events.html');
        return;
    }

    initMyEventsPage();
});

function initMyEventsPage() {
    // Show success banner if redirected from checkout
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
        showSuccessBanner();
    }

    // Load and display tickets
    loadTickets();
}

/**
 * Show success banner
 */
function showSuccessBanner() {
    const banner = document.getElementById('success-banner');
    if (banner) {
        banner.style.display = 'flex';

        // Hide after 5 seconds
        setTimeout(() => {
            banner.style.opacity = '0';
            setTimeout(() => {
                banner.style.display = 'none';
            }, 300);
        }, 5000);
    }
}

/**
 * Load tickets from localStorage
 */
function loadTickets() {
    const myEvents = getMyEvents();
    const ticketsGrid = document.getElementById('tickets-grid');
    const emptyState = document.getElementById('empty-state');

    if (myEvents.length === 0) {
        // Show empty state
        if (ticketsGrid) ticketsGrid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'flex';
    } else {
        // Show tickets
        if (ticketsGrid) ticketsGrid.style.display = 'grid';
        if (emptyState) emptyState.style.display = 'none';

        // Render tickets
        renderTickets(myEvents);
    }
}

/**
 * Render ticket cards
 */
async function renderTickets(tickets) {
    const ticketsGrid = document.getElementById('tickets-grid');
    if (!ticketsGrid) return;

    // Clear existing content
    ticketsGrid.innerHTML = '';

    // Create ticket cards
    for (const ticket of tickets) {
        const card = await createTicketCard(ticket);
        ticketsGrid.appendChild(card);
    }
}

/**
 * Create a single ticket card
 */
async function createTicketCard(ticket) {
    const article = document.createElement('article');
    article.className = 'ticket-card';
    article.dataset.ticketId = ticket.ticketId;

    // Format date
    const purchaseDate = new Date(ticket.purchaseDate);
    const formattedDate = purchaseDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    // Create QR code canvas
    const qrCanvas = document.createElement('canvas');
    qrCanvas.className = 'ticket-qr-canvas';

    try {
        await QRCode.toCanvas(qrCanvas, ticket.qrData, {
            width: 200,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
    } catch (error) {
        console.error('QR Code generation error:', error);
    }

    article.innerHTML = `
        <div class="ticket-header">
            <div class="ticket-id-badge">${ticket.ticketId}</div>
            <div class="ticket-category">${ticket.eventCategory}</div>
        </div>
        
        <div class="ticket-content">
            <div class="ticket-info">
                <h3 class="ticket-event-name">${ticket.eventName}</h3>
                <p class="ticket-host">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    ${ticket.eventHost}
                </p>
                <p class="ticket-user">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    ${ticket.userName}
                </p>
                <p class="ticket-date">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    Purchased: ${formattedDate}
                </p>
            </div>
            
            <div class="ticket-qr">
                <div class="qr-container" id="qr-${ticket.ticketId}"></div>
                <p class="qr-label">Scan to verify</p>
            </div>
        </div>
        
        <div class="ticket-footer">
            <button class="ticket-download-btn" data-ticket-id="${ticket.ticketId}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download Ticket
            </button>
            <span class="ticket-price">₹${ticket.eventPrice}</span>
        </div>
    `;

    // Append QR code canvas
    const qrContainer = article.querySelector(`#qr-${ticket.ticketId}`);
    if (qrContainer) {
        qrContainer.appendChild(qrCanvas);
    }

    // Add download handler
    const downloadBtn = article.querySelector('.ticket-download-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => downloadTicket(ticket, qrCanvas));
    }

    return article;
}

/**
 * Download ticket as image
 */
function downloadTicket(ticket, qrCanvas) {
    try {
        // Create a canvas for the full ticket
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set canvas size
        canvas.width = 800;
        canvas.height = 400;

        // Background
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Border
        ctx.strokeStyle = '#00d4aa';
        ctx.lineWidth = 3;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

        // Title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px Inter, sans-serif';
        ctx.fillText('AMBIORA TECH FEST 2026', 40, 60);

        // Event name
        ctx.font = 'bold 28px Inter, sans-serif';
        ctx.fillStyle = '#00d4aa';
        ctx.fillText(ticket.eventName, 40, 110);

        // Ticket ID
        ctx.font = '20px Inter, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`Ticket ID: ${ticket.ticketId}`, 40, 150);

        // User info
        ctx.font = '18px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText(`Name: ${ticket.userName}`, 40, 190);
        ctx.fillText(`Email: ${ticket.userEmail}`, 40, 220);
        ctx.fillText(`Host: ${ticket.eventHost}`, 40, 250);

        // QR Code
        ctx.drawImage(qrCanvas, 550, 100, 200, 200);

        // QR Label
        ctx.font = '14px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.textAlign = 'center';
        ctx.fillText('Scan to verify', 650, 320);

        // Download
        const link = document.createElement('a');
        link.download = `ambiora-ticket-${ticket.ticketId}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        // Show notification
        showNotification('Ticket downloaded successfully!', 'success');
    } catch (error) {
        console.error('Download error:', error);
        showNotification('Failed to download ticket', 'error');
    }
}

/**
 * Get purchased events from localStorage
 */
function getMyEvents() {
    const events = localStorage.getItem('ambiora_my_events');
    return events ? JSON.parse(events) : [];
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.querySelector('.page-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `page-notification page-notification--${type}`;
    notification.innerHTML = `
        <span class="notification-icon">${type === 'success' ? '✓' : 'ℹ'}</span>
        <span class="notification-text">${message}</span>
    `;

    document.body.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
        notification.classList.add('page-notification--visible');
    });

    // Remove after delay
    setTimeout(() => {
        notification.classList.remove('page-notification--visible');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
