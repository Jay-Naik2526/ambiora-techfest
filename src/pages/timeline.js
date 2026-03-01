/* ============================================
   AMBIORA - TIMELINE PAGE SCRIPTS
   ============================================ */

import { eventsData } from '../data/eventsData.js';


document.addEventListener('DOMContentLoaded', () => {
    initTimeline();
});

function initTimeline() {
    const timelineContainer = document.getElementById('timeline-container');
    if (!timelineContainer) return;

    // Group events by date
    // Current dates in data: 'Mar 6', 'Mar 7', 'March 1', 'Mar 6 - March 1', 'Mar 7 - March 1'
    // We need to categorize them.
    // Logic: 
    // If exact match (e.g. 'Mar 6'), put in that day.
    // If range starts with date (e.g. 'Mar 7 - March 1'), put in Mar 7?
    // User request had specific dates, so based on my earlier update, most events have specific single dates now
    // except 'robotics-robo-soccer' which spans days.

    // Hardcoded categories based on user plan
    const days = [
        { id: 'day1', label: 'Day 1 - 6th March', dateMatch: 'Mar 6' },
        { id: 'day2', label: 'Day 2 - 7th March', dateMatch: 'Mar 7' },
        { id: 'day3', label: 'Day 3 - 8th March', dateMatch: 'Mar 8' }
    ];

    // Helper to check if event belongs to day
    const getEventDay = (event) => {
        if (event.date.includes('Mar 6')) return 'day1';
        if (event.date.includes('Mar 7')) return 'day2';
        if (event.date.includes('Mar 8')) return 'day3';
        return 'day1'; // Default
    };


    // Grouping
    const groupedEvents = {
        day1: [],
        day2: [],
        day3: []
    };

    eventsData.forEach(event => {
        const day = getEventDay(event);
        if (groupedEvents[day]) {
            groupedEvents[day].push(event);
        }
    });

    // Helper to parse start time from duration string
    // Formats: "10:00 AM onwards", "2:00 PM to 5:00 PM"
    const parseTime = (durationStr) => {
        if (!durationStr) return 9999; // Late if undefined
        const parts = durationStr.split(' ');
        const timePart = parts[0]; // "10:00"
        const period = parts[1]; // "AM" or "PM"

        let [hours, minutes] = timePart.split(':').map(Number);
        if (isNaN(hours)) return 9999;
        if (isNaN(minutes)) minutes = 0;

        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        return hours * 60 + minutes;
    };

    // Sort events
    Object.keys(groupedEvents).forEach(day => {
        groupedEvents[day].sort((a, b) => parseTime(a.duration) - parseTime(b.duration));
    });

    // Render
    let html = '';

    days.forEach(day => {
        const events = groupedEvents[day.id];
        if (events.length === 0) return;

        // Day Header
        html += `
            <div class="timeline-day-header">
                <span class="timeline-day-badge">${day.label}</span>
            </div>
        `;

        // Events
        events.forEach((event, index) => {
            const side = index % 2 === 0 ? 'left' : 'right';
            const categoryTag = event.category ? event.category.charAt(0).toUpperCase() + event.category.slice(1) : 'Event';

            html += `
                <div class="timeline-item ${side}" style="animation-delay: ${index * 0.1}s">
                    <!-- Connector Line -->
                    <div class="timeline-connector"></div>
                    <!-- Dot is handled by CSS on timeline-item::after or separate element -->
                    
                    <a href="/event-detail.html?id=${event.id}" class="timeline-content">
                        <span class="timeline-tag">${categoryTag}</span>
                        <div class="timeline-header-visual"></div> <!-- For dual tone -->
                        
                        <div class="timeline-body">
                            <div class="timeline-time">${event.duration}</div>
                            <h3 class="timeline-title">${event.name}</h3>
                            <div class="timeline-host">
                                <span>by AMBIORA X ${event.host}</span>
                            </div>
                            <p class="timeline-desc">${event.shortDescription || event.description}</p>
                            <div class="timeline-arrow">
                                View Details <span>→</span>
                            </div>
                        </div>
                    </a>
                </div>
            `;
        });
    });

    timelineContainer.innerHTML = html;
}
