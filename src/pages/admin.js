/* ============================================
   AMBIORA - ADMIN PANEL LOGIC
   ============================================ */

import { API_BASE_URL } from '../config/api.js';

let adminToken = localStorage.getItem('admin_token');

document.addEventListener('DOMContentLoaded', () => {
    if (adminToken) {
        showDashboard();
    } else {
        initLogin();
    }
});

function initLogin() {
    const loginForm = document.getElementById('admin-login-form');
    const loginError = document.getElementById('login-error');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('admin-password').value;

        try {
            const response = await fetch(`${API_BASE_URL}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (data.success) {
                adminToken = data.token;
                localStorage.setItem('admin_token', adminToken);
                showDashboard();
            } else {
                loginError.textContent = data.message || 'Access denied';
                loginError.style.display = 'block';
            }
        } catch (error) {
            console.error('Login error:', error);
            loginError.textContent = 'Server connection failed';
            loginError.style.display = 'block';
        }
    });
}

async function showDashboard() {
    document.getElementById('admin-login-overlay').style.display = 'none';
    document.getElementById('admin-dashboard').classList.add('active');

    setupLogout();
    await fetchAndRenderData();
}

function setupLogout() {
    document.getElementById('admin-logout').addEventListener('click', () => {
        localStorage.removeItem('admin_token');
        location.reload();
    });
}

async function fetchAndRenderData() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/registrations`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        const data = await response.json();

        if (data.success) {
            renderRegistrations(data.registrations);
        } else {
            localStorage.removeItem('admin_token');
            location.reload();
        }
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

function renderRegistrations(registrations) {
    const sectionsContainer = document.getElementById('registration-sections');
    const statTotal = document.getElementById('stat-total');
    const statCategories = document.getElementById('stat-categories');

    sectionsContainer.innerHTML = '';
    statCategories.innerHTML = '';

    // Grouping by category
    const categorized = {};
    let totalCount = 0;

    registrations.forEach(reg => {
        reg.events.forEach(event => {
            const cat = event.eventCategory || 'other';
            if (!categorized[cat]) categorized[cat] = [];
            categorized[cat].push({
                ...event,
                userName: reg.userName,
                userEmail: reg.userEmail,
                userPhone: reg.userPhone,
                orderId: reg.orderId,
                paymentStatus: reg.paymentStatus,
                date: reg.createdAt
            });
            totalCount++;
        });
    });

    statTotal.textContent = totalCount;

    // Sort categories (Competition first, then Workshops, etc)
    const sortedCats = Object.keys(categorized).sort();

    sortedCats.forEach(cat => {
        const count = categorized[cat].length;

        // Add Stat Card
        const statCard = document.createElement('div');
        statCard.className = 'stat-card';
        statCard.innerHTML = `
            <div class="stat-label">${cat}s</div>
            <div class="stat-value" style="color: ${getColorForCategory(cat)}">${count}</div>
        `;
        statCategories.appendChild(statCard);

        // Add Table Section
        const section = document.createElement('section');
        section.className = 'admin-section';
        section.innerHTML = `
            <div class="section-header">
                <h2 class="section-title">
                    <span class="category-dot" style="background: ${getColorForCategory(cat)}"></span>
                    ${cat.charAt(0).toUpperCase() + cat.slice(1)}s
                </h2>
                <span class="page-label">${count} Total</span>
            </div>
            <div class="table-container">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Event</th>
                            <th>Contact</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${categorized[cat].map(item => `
                            <tr>
                                <td><strong>${item.userName}</strong></td>
                                <td>${item.eventName}</td>
                                <td>
                                    <div style="font-size: 11px;">${item.userEmail}</div>
                                    <div style="font-size: 11px; opacity: 0.6;">${item.userPhone}</div>
                                </td>
                                <td>${new Date(item.date).toLocaleDateString()}</td>
                                <td>₹${item.eventPrice}</td>
                                <td>
                                    <span class="status-badge status-${item.paymentStatus}">
                                        ${item.paymentStatus}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        sectionsContainer.appendChild(section);
    });

    // Setup Export
    document.getElementById('export-csv').onclick = () => exportToCSV(registrations);
}

function getColorForCategory(cat) {
    switch (cat.toLowerCase()) {
        case 'competition': return '#00d4aa';
        case 'workshop': return '#f472b6';
        case 'gaming': return '#6366f1';
        default: return '#94a3b8';
    }
}

function exportToCSV(registrations) {
    const rows = [
        ['Date', 'User Name', 'Email', 'Phone', 'Event Name', 'Category', 'Price', 'Order ID', 'Status']
    ];

    registrations.forEach(reg => {
        reg.events.forEach(event => {
            rows.push([
                new Date(reg.createdAt).toLocaleString(),
                reg.userName,
                reg.userEmail,
                reg.userPhone,
                event.eventName,
                event.eventCategory,
                event.eventPrice,
                reg.orderId,
                reg.paymentStatus
            ]);
        });
    });

    let csvContent = "data:text/csv;charset=utf-8,"
        + rows.map(e => e.map(cell => `"${cell}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ambiora_registrations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
