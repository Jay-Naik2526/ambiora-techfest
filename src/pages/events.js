/* ============================================
   AMBIORA - EVENTS PAGE SCRIPTS
   ============================================ */

import anime from 'animejs';
import { setupScrollAnimations } from '../utils/animations.js';
import { initCart } from '../components/Cart.js';

// Events data with all competitions
import { eventsData } from '../data/eventsData.js';

// Events data with all competitions - Imported from central file


// Category icons
const categoryIcons = {
    competition: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
        <path d="M4 22h16"></path>
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
    </svg>`,
    workshop: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
    </svg>`,
    gaming: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="6" y1="12" x2="10" y2="12"></line>
        <line x1="8" y1="10" x2="8" y2="14"></line>
        <line x1="15" y1="13" x2="15.01" y2="13"></line>
        <line x1="18" y1="11" x2="18.01" y2="11"></line>
        <rect x="2" y="6" width="20" height="12" rx="2"></rect>
    </svg>`
};

// Host logo mapping for flip card back faces
const hostLogos = {
    'Google Developers Student Club': '/assets/gd.jpeg',
    'Ambiora': '/assets/LOGO.png',
    'Atrangi Club': '/assets/at.jpeg',
    'ADC Club': '/assets/ad.jpeg',
    'Avinya Club': '/assets/av.jpeg',
    'Coding Club': '/assets/LOGO.png',
    'UAS NMIMS Club': '/assets/ua.jpeg',
    'Raw Vision Media': '/assets/ra.jpeg'
};

document.addEventListener('DOMContentLoaded', () => {
    initEventsPage();
});

function initEventsPage() {
    // Initialize cart
    const cart = initCart();

    // Setup scroll animations
    setupScrollAnimations();

    // Setup header scroll behavior
    setupHeaderScroll();

    // Initialize mobile menu
    initMobileMenu();

    // Generate event cards dynamically
    // Get purchased events
    const myEvents = cart.getMyEvents();
    generateEventCards(myEvents);

    // Initialize filter buttons
    initFilterButtons();

    // Add card hover sounds/effects if desired
    initCardEffects();
}

/**
 * Generate event cards from data
 */
function generateEventCards(myEvents = []) {
    const eventsGrid = document.querySelector('.events-grid');
    if (!eventsGrid) return;

    // Clear existing cards
    eventsGrid.innerHTML = '';

    // Generate cards
    eventsData.forEach((event, index) => {
        const card = createEventCard(event, index, myEvents);
        eventsGrid.appendChild(card);
    });
}

/**
 * Create a single event card
 */
function createEventCard(event, index, myEvents = []) {
    const article = document.createElement('article');
    article.className = 'event-card';
    article.dataset.category = event.category;
    article.dataset.eventId = event.id;
    article.style.animationDelay = `${0.1 + index * 0.05}s`;

    const categoryLabel = event.category.charAt(0).toUpperCase() + event.category.slice(1);
    const categoryIcon = categoryIcons[event.category] || categoryIcons.competition;
    const hostLogo = hostLogos[event.host] || '/assets/LOGO.png';

    // Check if purchased
    const isPurchased = myEvents.some(e => e.eventId === event.id);

    // Button state
    const btnText = isPurchased ? 'Registered' : 'Add to Cart';
    const btnClass = isPurchased ? 'event-card-cart-btn disabled' : 'event-card-cart-btn';
    const btnIcon = isPurchased ?
        `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>` :
        `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>`;
    const detailsBtnHref = isPurchased ? '/my-events.html' : `/event-detail.html?id=${event.id}`;
    const detailsBtnText = isPurchased ? 'View Ticket' : 'View Details';

    article.innerHTML = `
        <div class="event-card-inner">
            <div class="event-card-front">
                <div class="event-card-image">
                    <img src="${event.image || hostLogo}" alt="${event.name}" />
                </div>
                <div class="event-card-content">
                    <div class="event-card-header">
                        <div class="event-card-category">
                            ${categoryIcon}
                            <span>${categoryLabel}</span>
                        </div>
                        <div class="event-card-price">${event.externalPrice ? `₹${event.price} / ₹${event.externalPrice}${event.priceNote ? `<span class="price-note">${event.priceNote}</span>` : ''}` : `₹${event.price}`}</div>
                    </div>
                    <h3 class="event-card-title">${event.name}</h3>
                    <p class="event-card-desc">${event.description}</p>
                    <div class="event-card-highlights">
                        ${event.highlights.map(h => `<span class="highlight-tag">${h}</span>`).join('')}
                    </div>
                    <div class="event-card-meta">
                        <span class="event-card-date">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            ${event.date}
                        </span>
                        <span class="event-card-time">${event.duration}</span>
                    </div>
                    <div class="event-card-host">
                        <span>Hosted by</span>
                        <strong>${event.host}</strong>
                    </div>
                    <div class="event-card-actions">
                        <a href="${detailsBtnHref}" class="event-card-details-btn">${detailsBtnText}</a>
                        <button class="${btnClass}" data-event-id="${event.id}" ${isPurchased ? 'disabled' : ''}>
                            ${btnIcon}
                            ${btnText}
                        </button>
                    </div>
                </div>
            </div>
            <div class="event-card-back">
                <div class="event-card-back-glow"></div>
                <div class="event-card-back-content">
                    <img src="${event.image || hostLogo}" alt="${event.name}" class="static-event-image" />
                </div>
                <!-- <div class="event-card-back-scanlines"></div> -->
            </div>
        </div>
    `;

    // Add to cart click handler
    const cartBtn = article.querySelector('.event-card-cart-btn');
    cartBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart(event);
    });

    return article;
}

/**
 * Add event to cart
 */
function addToCart(event) {
    const cart = initCart();
    cart.addItem({
        id: event.id,
        name: event.name,
        price: event.price,
        category: event.category,
        host: event.host
    });
}

/**
 * Setup header background on scroll
 */
function setupHeaderScroll() {
    const header = document.querySelector('.nav-header');
    if (!header) return;

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

/**
 * Initialize mobile menu toggle
 */
function initMobileMenu() {
    const menuBtn = document.querySelector('.nav-menu-btn');
    const navMenu = document.querySelector('.nav-menu');

    if (!menuBtn || !navMenu) return;

    menuBtn.addEventListener('click', () => {
        menuBtn.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    document.querySelectorAll('.nav-menu-link').forEach(link => {
        link.addEventListener('click', () => {
            menuBtn.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
}

/**
 * Initialize filter buttons for events
 */
function initFilterButtons() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const eventsGrid = document.querySelector('.events-grid');

    if (!filterBtns.length || !eventsGrid) return;

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.dataset.filter;
            const eventCards = eventsGrid.querySelectorAll('.event-card');

            // Filter cards with animation
            eventCards.forEach((card, index) => {
                const category = card.dataset.category;

                if (filter === 'all' || category === filter) {
                    card.classList.remove('hidden');

                    // Animate in
                    anime({
                        targets: card,
                        opacity: [0, 1],
                        translateY: [20, 0],
                        duration: 400,
                        delay: index * 50,
                        easing: 'easeOutQuad'
                    });
                } else {
                    // Animate out then hide
                    anime({
                        targets: card,
                        opacity: 0,
                        translateY: -10,
                        duration: 200,
                        easing: 'easeOutQuad',
                        complete: () => {
                            card.classList.add('hidden');
                        }
                    });
                }
            });
        });
    });
}

/**
 * Initialize card hover effects
 */
function initCardEffects() {
    // Card effects are now handled by CSS
}

// Export for use elsewhere
export { initEventsPage, eventsData };
