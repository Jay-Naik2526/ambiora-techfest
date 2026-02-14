/* ============================================
   AMBIORA - EVENT DETAIL PAGE SCRIPTS
   ============================================ */

import { setupScrollAnimations } from '../utils/animations.js';
import { initCart } from '../components/Cart.js';

// Events data (shared with events.js)
import { eventsData } from '../data/eventsData.js';

// Events data (shared with events.js) - Imported from central file


// Get event ID from URL
function getEventIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Get event data by ID
function getEventById(id) {
    return eventsData.find(event => event.id === id);
}

// Populate event details
function populateEventDetails(event) {
    if (!event) {
        window.location.href = '/events.html';
        return;
    }

    // Update page title
    document.title = `${event.name} | Ambiora Tech Fest 2026`;

    // Update category badge
    const categoryBadge = document.getElementById('event-category');
    if (categoryBadge) {
        categoryBadge.classList.add(event.category);
        categoryBadge.querySelector('.category-text').textContent =
            event.category.charAt(0).toUpperCase() + event.category.slice(1);
    }

    // Update title
    const titleEl = document.getElementById('event-title');
    if (titleEl) titleEl.textContent = event.name;

    // Update host
    const hostEl = document.getElementById('event-host');
    if (hostEl) hostEl.innerHTML = `Hosted by <strong>AMBIORA X ${event.host}</strong>`;

    // Update description
    const descEl = document.getElementById('event-description');
    if (descEl) descEl.innerHTML = event.description;

    // Update price with external price if available
    const priceEl = document.getElementById('event-price');
    if (priceEl) {
        if (event.kitPrice) {
            // Show price breakdown
            priceEl.innerHTML = `₹${event.price} (Event) + ₹${event.kitPrice} (Mandatory Kit)`;

            // Add note
            const priceNoteEl = priceEl.parentElement.querySelector('.price-note');
            if (priceNoteEl) {
                priceNoteEl.style.display = 'none'; // Hide redundant note if breakdown is clear
            }
        } else if (event.externalPrice) {
            priceEl.innerHTML = `₹${event.price} (In-house Team) <span class="price-external">/ ₹${event.externalPrice} (External Team)</span>`;
        } else {
            priceEl.innerHTML = `₹${event.price}`;
        }

        // Update price note (sibling element)
        const priceNoteEl = priceEl.parentElement.querySelector('.price-note');
        if (priceNoteEl) {
            priceNoteEl.textContent = event.priceNote || 'per participant';
        }
    }

    // Update date
    const dateEl = document.getElementById('event-date');
    if (dateEl) dateEl.textContent = event.date;

    // Update duration
    const durationEl = document.getElementById('event-duration');
    if (durationEl) durationEl.textContent = event.duration;

    // Update team size
    const teamEl = document.getElementById('event-team');
    if (teamEl) teamEl.textContent = event.teamSize;

    // Update highlights
    const highlightsEl = document.getElementById('event-highlights');
    if (highlightsEl && event.highlights) {
        highlightsEl.innerHTML = event.highlights.map(h =>
            `<span class="event-highlight-tag">${h}</span>`
        ).join('');
    }

    // Update venue
    const venueEl = document.getElementById('event-venue');
    if (venueEl && event.venue) {
        venueEl.textContent = event.venue;
        venueEl.closest('.detail-item').style.display = 'flex';
    }

    // Update prizes section
    const prizesEl = document.getElementById('event-prizes');
    if (prizesEl && event.prizes) {
        let prizesHtml = '';
        if (event.prizes.first) {
            prizesHtml += `<div class="prize-item prize-first"><span class="prize-icon">🥇</span> First Prize: <strong>₹${event.prizes.first.toLocaleString()}</strong></div>`;
        }
        if (event.prizes.second) {
            prizesHtml += `<div class="prize-item prize-second"><span class="prize-icon">🥈</span> Second Prize: <strong>₹${event.prizes.second.toLocaleString()}</strong></div>`;
        }
        if (event.prizes.third) {
            prizesHtml += `<div class="prize-item prize-third"><span class="prize-icon">🥉</span> Third Prize: <strong>₹${event.prizes.third.toLocaleString()}</strong></div>`;
        }
        if (event.prizes.consolation) {
            prizesHtml += `<div class="prize-item"><span class="prize-icon">🎁</span> Consolation: <strong>₹${event.prizes.consolation.toLocaleString()}</strong> each</div>`;
        }
        if (event.prizes.special) {
            prizesHtml += `<div class="prize-item prize-special"><span class="prize-icon">🏆</span> <strong>${event.prizes.special}</strong></div>`;
        }
        prizesEl.innerHTML = prizesHtml;
        prizesEl.closest('.event-section').style.display = 'block';
    }

    // Update includes section
    const includesEl = document.getElementById('event-includes');
    if (includesEl && event.includes && event.includes.length > 0) {
        includesEl.innerHTML = event.includes.map(item =>
            `<div class="include-item"><span class="include-icon">✓</span> ${item}</div>`
        ).join('');
        includesEl.closest('.event-section').style.display = 'block';
    }

    // Update note section
    const noteEl = document.getElementById('event-note');
    if (noteEl && event.note) {
        noteEl.textContent = event.note;
        noteEl.closest('.event-section').style.display = 'block';
    }

    // Setup add to cart button
    const cartBtn = document.getElementById('add-to-cart-btn');
    if (cartBtn) {
        cartBtn.addEventListener('click', () => {
            const cart = initCart();
            const price = event.price + (event.kitPrice || 0);
            const name = event.kitPrice ? `${event.name} + Mandatory Kit` : event.name;

            cart.addItem({
                id: event.id,
                name: name,
                price: price,
                category: event.category,
                host: event.host
            });
        });
    }

    // Populate related events
    populateRelatedEvents(event);
}

// Populate related events
function populateRelatedEvents(currentEvent) {
    const relatedGrid = document.getElementById('related-events');
    if (!relatedGrid) return;

    // Get events in same category (excluding current)
    const relatedEvents = eventsData
        .filter(e => e.category === currentEvent.category && e.id !== currentEvent.id)
        .slice(0, 3);

    // If not enough, add random events from other categories
    if (relatedEvents.length < 3) {
        const otherEvents = eventsData
            .filter(e => e.id !== currentEvent.id && !relatedEvents.includes(e))
            .slice(0, 3 - relatedEvents.length);
        relatedEvents.push(...otherEvents);
    }

    relatedGrid.innerHTML = relatedEvents.map(event => `
        <a href="/event-detail.html?id=${event.id}" class="related-card">
            <span class="related-card-category">${event.category}</span>
            <h3 class="related-card-title">${event.name}</h3>
            <div class="related-card-meta">
                <span class="related-card-price">₹${event.price}</span>
                <span class="related-card-host">AMBIORA X ${event.host}</span>
            </div>
        </a>
    `).join('');
}

// Initialize page
function initEventDetailPage() {
    // Initialize cart
    initCart();

    // Setup scroll animations
    setupScrollAnimations();

    // Setup header scroll behavior
    setupHeaderScroll();

    // Initialize mobile menu
    initMobileMenu();

    // Get event and populate
    const eventId = getEventIdFromUrl();
    const event = getEventById(eventId);
    populateEventDetails(event);
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

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initEventDetailPage();
});

export { initEventDetailPage, eventsData };
