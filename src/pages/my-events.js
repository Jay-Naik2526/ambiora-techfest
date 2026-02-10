/* ============================================
   AMBIORA - MY EVENTS PAGE SCRIPT
   ============================================ */

import QRCode from 'qrcode';
import { isAuthenticated, getCurrentUser, redirectToLogin } from '../utils/auth.js';
import { eventsData } from '../data/eventsData.js';

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

    // Get event details for WhatsApp links
    const eventDetails = eventsData.find(e => e.id === ticket.eventId);
    const whatsappSection = eventDetails && eventDetails.whatsapp ? `
        <div class="ticket-whatsapp-section" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1);">
            <p style="font-size: 0.8rem; color: rgba(255,255,255,0.6); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <strong>Join Official Groups</strong>
            </p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <a href="${eventDetails.whatsapp.community}" target="_blank" style="padding: 0.6rem; background: rgba(37, 211, 102, 0.1); border: 1px solid rgba(37, 211, 102, 0.3); color: #25D366; text-decoration: none; border-radius: 6px; font-size: 0.75rem; text-align: center; font-weight: 500; transition: all 0.2s;">
                    Join Community
                </a>
                <a href="${eventDetails.whatsapp.group}" target="_blank" style="padding: 0.6rem; background: rgba(37, 211, 102, 0.1); border: 1px solid rgba(37, 211, 102, 0.3); color: #25D366; text-decoration: none; border-radius: 6px; font-size: 0.75rem; text-align: center; font-weight: 500; transition: all 0.2s;">
                    Join Game Group
                </a>
            </div>
        </div>
    ` : '';

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
                </p>
            </div>
            
            ${whatsappSection}
            
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
