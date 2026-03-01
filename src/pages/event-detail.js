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

    // Update price with optional kit checkbox if available
    const priceEl = document.getElementById('event-price');
    if (priceEl) {
        if (event.kitOptional && event.kitPrice) {
            // Show base price only
            priceEl.innerHTML = `₹${event.price}`;

            // Add kit checkbox section after price section
            const priceSection = priceEl.closest('.event-price-section');
            if (priceSection) {
                // Remove existing kit section if it exists
                const existingKit = priceSection.parentElement.querySelector('.event-kit-section');
                if (existingKit) existingKit.remove();

                // Create kit option section
                const kitSection = document.createElement('div');
                kitSection.className = 'event-kit-section';
                kitSection.innerHTML = `
                    <div class="kit-checkbox-wrapper">
                        <input type="checkbox" id="include-kit" class="kit-checkbox">
                        <label for="include-kit" class="kit-checkbox-label">
                            <span class="kit-label-text">
                                <strong>Include Robotics Kit</strong>
                                <span class="kit-recommended-badge">Recommended</span>
                            </span>
                            <span class="kit-price">+₹${event.kitPrice}</span>
                        </label>
                    </div>
                    <div class="kit-details">
                        <span class="kit-details-title" style="color: #fff;">Why you need this kit:</span>
                        <p class="kit-detail-item" style="margin-top:4px; line-height:1.4;">
                            Get the complete hands-on experience! Includes all motors, sensors, and boards needed to build your bot and dominate the Robo Soccer arena. <strong>And yes, it's yours to keep!</strong>
                        </p>
                    </div>
                    <div class="kit-total-price">
                        <span class="total-label">Total:</span>
                        <span class="total-value" id="dynamic-total">₹${event.price}</span>
                    </div>
                `;
                priceSection.parentElement.insertBefore(kitSection, priceSection.nextSibling);

                // Add checkbox event listener
                const checkbox = document.getElementById('include-kit');
                const totalEl = document.getElementById('dynamic-total');
                if (checkbox && totalEl) {
                    checkbox.addEventListener('change', (e) => {
                        const total = event.price + (e.target.checked ? event.kitPrice : 0);
                        totalEl.textContent = `₹${total}`;
                    });
                }
            }
        } else if (event.kitPrice && !event.kitOptional) {
            // Show price breakdown for mandatory kit
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

    // Update Rulebook & More Info (Drive Folder) section
    const driveSectionEl = document.getElementById('event-drive-section');
    const driveLinkEl = document.getElementById('event-drive-link');
    if (driveSectionEl && driveLinkEl && event.driveFolder) {
        driveLinkEl.href = event.driveFolder;
        driveSectionEl.style.display = 'block';
    }

    // Setup add to cart button
    const cartBtn = document.getElementById('add-to-cart-btn');
    if (cartBtn) {
        // If registration is closed, disable the button and show a message
        if (event.registrationClosed) {
            cartBtn.disabled = true;
            cartBtn.textContent = event.registrationClosedMessage || 'Registrations Closed';
            cartBtn.style.cssText = 'background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.4); cursor: not-allowed; opacity: 0.85; pointer-events: none;';

            // Insert a visible notice banner above the button
            const notice = document.createElement('div');
            notice.style.cssText = 'display:flex; align-items:center; gap:10px; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:10px; padding:12px 16px; margin-bottom:14px; color:#ef4444; font-size:14px; font-weight:600;';
            notice.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg> Registrations for this event are <strong style="margin-left:4px;">now closed</strong>. Seats are full!`;
            cartBtn.parentElement.insertBefore(notice, cartBtn);
            return; // Skip adding event listener
        }

        cartBtn.addEventListener('click', () => {
            const cart = initCart();

            // Check if kit is optional and selected
            let includesKit = false;
            let finalPrice = event.price;
            let itemName = event.name;

            if (event.kitOptional) {
                const kitCheckbox = document.getElementById('include-kit');
                includesKit = kitCheckbox ? kitCheckbox.checked : false;
                finalPrice = event.price + (includesKit ? event.kitPrice : 0);
                itemName = includesKit ? `${event.name} + Kit` : event.name;
            } else if (event.kitPrice) {
                // Mandatory kit
                includesKit = true;
                finalPrice = event.price + event.kitPrice;
                itemName = `${event.name} + Mandatory Kit`;
            }

            cart.addItem({
                id: event.id,
                name: itemName,
                price: finalPrice,
                category: event.category,
                host: event.host,
                includesKit: includesKit,
                kitPrice: includesKit ? event.kitPrice : 0,
                basePrice: event.price
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
