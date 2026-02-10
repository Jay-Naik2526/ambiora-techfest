/* ============================================
   AMBIORA - ADMIN PANEL LOGIC
   ============================================ */

import { getApiUrl } from '../config/api.js';

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
            const response = await fetch(getApiUrl('admin/login'), {
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
    setupTabs();
    await fetchAndRenderData();
}

function setupLogout() {
    document.getElementById('admin-logout').addEventListener('click', () => {
        localStorage.removeItem('admin_token');
        location.reload();
    });
}

function setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            filterAndRender(tab.dataset.category);
        });
    });
}

let allRegistrations = [];

async function fetchAndRenderData() {
    try {
        const response = await fetch(getApiUrl('admin/registrations'), {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        const data = await response.json();

        if (data.success) {
            allRegistrations = data.registrations;
            filterAndRender('all');
        } else {
            localStorage.removeItem('admin_token');
            location.reload();
        }
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

function filterAndRender(category) {
    const sectionsContainer = document.getElementById('registration-sections');
    const statTotal = document.getElementById('stat-total');
    const statCount = document.getElementById('stat-count');

    // Calculate display data
    const displayData = [];
    allRegistrations.forEach(reg => {
        reg.events.forEach(event => {
            if (category === 'all' || (event.eventCategory && event.eventCategory.toLowerCase() === category.toLowerCase())) {
                displayData.push({
                    ...event,
                    userName: reg.userName,
                    userEmail: reg.userEmail,
                    userPhone: reg.userPhone,
                    orderId: reg.orderId,
                    paymentStatus: reg.paymentStatus,
                    date: reg.createdAt
                });
            }
        });
    });

    statTotal.textContent = allRegistrations.length + " Orders";
    statCount.textContent = displayData.length;

    sectionsContainer.innerHTML = '';

    if (displayData.length === 0) {
        sectionsContainer.innerHTML = `<p style="text-align: center; padding: 40px; color: var(--color-white-muted);">No registrations found for this category.</p>`;
        return;
    }

    // Grouping by category for the display
    const grouped = {};
    displayData.forEach(item => {
        const cat = item.eventCategory || 'other';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(item);
    });

    const sortedCats = Object.keys(grouped).sort();

    sortedCats.forEach(cat => {
        const items = grouped[cat];
        const section = document.createElement('section');
        section.className = 'admin-section';
        section.innerHTML = `
            <div class="section-header">
                <h2 class="section-title">
                    <span class="category-dot" style="background: ${getColorForCategory(cat)}"></span>
                    ${cat.charAt(0).toUpperCase() + cat.slice(1)}s
                </h2>
                <span class="page-label">${items.length} Registered</span>
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
                        ${items.map(item => `
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

    // Setup Exports
    document.getElementById('export-csv').onclick = () => exportToCSV(displayData);
    document.getElementById('export-excel').onclick = () => exportToExcel(displayData, category);
}

function getColorForCategory(cat) {
    switch (cat.toLowerCase()) {
        case 'competition': return '#00d4aa';
        case 'workshop': return '#f472b6';
        case 'gaming': return '#6366f1';
        default: return '#94a3b8';
    }
}

function exportToCSV(displayData) {
    const rows = [
        ['Date', 'User Name', 'Email', 'Phone', 'Event Name', 'Category', 'Price', 'Order ID', 'Status']
    ];

    displayData.forEach(item => {
        rows.push([
            new Date(item.date).toLocaleString(),
            item.userName,
            item.userEmail,
            item.userPhone,
            item.eventName,
            item.eventCategory,
            item.eventPrice,
            item.orderId,
            item.paymentStatus
        ]);
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

function exportToExcel(displayData, category) {
    // Check if XLSX library is loaded
    if (typeof XLSX === 'undefined') {
        alert('Excel library is still loading. Please try again in a moment.');
        return;
    }

    const data = displayData.map(item => ({
        'Registration Date': new Date(item.date).toLocaleString(),
        'User Name': item.userName,
        'Email': item.userEmail,
        'Phone': item.userPhone,
        'Event Name': item.eventName,
        'Category': item.eventCategory,
        'Price (INR)': item.eventPrice,
        'Order ID': item.orderId,
        'Payment Status': item.paymentStatus
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");

    // Auto-size columns
    const maxWidths = {};
    data.forEach(row => {
        Object.keys(row).forEach(key => {
            const val = String(row[key] || '');
            maxWidths[key] = Math.max(maxWidths[key] || key.length, val.length);
        });
    });
    worksheet['!cols'] = Object.keys(maxWidths).map(key => ({ wch: maxWidths[key] + 2 }));

    const fileName = `ambiora_${category}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
}
