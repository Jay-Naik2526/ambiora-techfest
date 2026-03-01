/* ============================================
   AMBIORA - ADMIN PANEL LOGIC
   ============================================ */

import { getApiUrl } from '../config/api.js';
import { eventsData } from '../data/eventsData.js';

let adminToken = localStorage.getItem('admin_token');
let currentView = 'registrations'; // 'registrations' or 'teams'
let currentCategory = 'all';
let currentEventFilter = 'all';
let currentSearch = '';
let allRegistrations = [];
let allTeams = [];

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
    setupControls();
    populateEventFilter();
    await fetchAndRenderData();
}

function setupLogout() {
    document.getElementById('admin-logout').addEventListener('click', () => {
        localStorage.removeItem('admin_token');
        location.reload();
    });
}

function populateEventFilter() {
    const selector = document.getElementById('event-filter');
    // Sort events alphabetically
    const sortedEvents = [...eventsData].sort((a, b) => a.name.localeCompare(b.name));

    sortedEvents.forEach(ev => {
        const opt = document.createElement('option');
        opt.value = ev.id;
        opt.textContent = ev.name;
        selector.appendChild(opt);
    });

    selector.addEventListener('change', (e) => {
        currentEventFilter = e.target.value;
        renderCurrentView();
    });
}

function setupControls() {
    // View Toggles
    const viewBtns = document.querySelectorAll('.view-btn');
    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            viewBtns.forEach(b => {
                b.classList.remove('active');
                b.style.background = 'transparent';
                b.style.color = 'rgba(255,255,255,0.6)';
            });
            btn.classList.add('active');
            btn.style.background = '#00d4aa'; // Active color
            btn.style.color = 'white';

            currentView = btn.dataset.view;
            renderCurrentView();
        });
    });

    // Category Tabs
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentCategory = tab.dataset.category;
            renderCurrentView();
        });
    });

    // Search
    const searchInput = document.getElementById('admin-search');
    const searchClear = document.getElementById('admin-search-clear');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value.trim().toLowerCase();
            searchClear.style.display = currentSearch ? 'flex' : 'none';
            renderCurrentView();
        });
    }
    if (searchClear) {
        searchClear.addEventListener('click', () => {
            searchInput.value = '';
            currentSearch = '';
            searchClear.style.display = 'none';
            searchInput.focus();
            renderCurrentView();
        });
    }

    // Exports
    document.getElementById('export-csv').onclick = () => exportToCSV();
    document.getElementById('export-excel').onclick = () => exportToExcel();
}

async function fetchAndRenderData() {
    try {
        // Fetch Registrations
        const regRes = await fetch(getApiUrl('admin/registrations'), {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const regData = await regRes.json();

        // Fetch Teams
        const teamRes = await fetch(getApiUrl('admin/teams'), {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const teamData = await teamRes.json();

        if (regData.success) {
            allRegistrations = regData.registrations;
        }

        if (teamData.success) {
            allTeams = teamData.teams;
        }

        if (!regData.success && !teamData.success) {
            localStorage.removeItem('admin_token');
            location.reload();
            return;
        }

        computePaymentSummary([]); // init cards with 0 until renderCurrentView fills them
        renderCurrentView();

    } catch (error) {
        console.error('Fetch error:', error);
        // Add more detailed logging
        if (error instanceof SyntaxError) {
            console.error('Likely received HTML instead of JSON. Check network tab for 404/500 response body.');
        }
    }
}

function getFilteredData() {
    let data = [];

    if (currentView === 'registrations') {
        allRegistrations.forEach(reg => {
            reg.events.forEach(event => {
                // Filter by Category
                const catMatch = currentCategory === 'all' || (event.eventCategory && event.eventCategory.toLowerCase() === currentCategory.toLowerCase());
                // Filter by Event ID
                const eventMatch = currentEventFilter === 'all' || event.eventId === currentEventFilter;
                // Filter by Search (name, email, SAP ID)
                const q = currentSearch;
                const searchMatch = !q ||
                    (reg.userName || '').toLowerCase().includes(q) ||
                    (reg.userEmail || '').toLowerCase().includes(q) ||
                    (reg.userSapId || '').toLowerCase().includes(q) ||
                    (reg.userPhone || '').toLowerCase().includes(q);

                if (catMatch && eventMatch && searchMatch) {
                    data.push({
                        ...event,
                        userId: reg.userId,
                        userName: reg.userName,
                        userEmail: reg.userEmail,
                        userPhone: reg.userPhone,
                        userSapId: reg.userSapId || '',
                        orderId: reg.orderId,
                        paymentStatus: reg.paymentStatus,
                        date: reg.createdAt
                    });
                }
            });
        });
    } else if (currentView === 'teams') {
        data = allTeams.filter(team => {
            const event = eventsData.find(e => e.id === team.eventId);
            const category = event ? event.category : 'other';

            const catMatch = currentCategory === 'all' || (category && category.toLowerCase().includes(currentCategory.toLowerCase()));
            const eventMatch = currentEventFilter === 'all' || team.eventId === currentEventFilter;
            // Search by team name or leader/member name
            const q = currentSearch;
            const leader = team.members ? team.members.find(m => m.userId === team.leaderId) : null;
            const searchMatch = !q ||
                (team.name || '').toLowerCase().includes(q) ||
                (leader && (leader.name || '').toLowerCase().includes(q)) ||
                (leader && (leader.sapId || '').toLowerCase().includes(q)) ||
                (team.members || []).some(m => (m.name || '').toLowerCase().includes(q) || (m.sapId || '').toLowerCase().includes(q));

            return catMatch && eventMatch && searchMatch;
        });
    }

    return data;
}

function computePaymentSummary(filteredData) {
    // Revenue & pending computed from currently visible (filtered) flat data
    const isFiltered = currentEventFilter !== 'all' || currentCategory !== 'all' || currentSearch !== '';

    let revenueCollected = 0;
    let pendingCount = 0;
    let pendingAmount = 0;
    const seenPendingOrders = new Set();

    if (currentView === 'registrations' && filteredData) {
        filteredData.forEach(item => {
            if (item.paymentStatus === 'success') {
                revenueCollected += item.eventPrice || 0;
            } else if (item.paymentStatus === 'pending') {
                // Count unique orders not individual event rows
                if (!seenPendingOrders.has(item.orderId)) {
                    seenPendingOrders.add(item.orderId);
                    pendingCount++;
                }
                pendingAmount += item.eventPrice || 0;
            }
        });
    } else if (currentView === 'teams') {
        // Teams don't have direct revenue — show global totals instead
        allRegistrations.forEach(reg => {
            if (reg.paymentStatus === 'success') revenueCollected += reg.totalAmount || 0;
            else if (reg.paymentStatus === 'pending') {
                pendingCount++;
                pendingAmount += reg.totalAmount || 0;
            }
        });
    }

    // Context sublabel
    let revSubLabel = '';
    if (currentView === 'registrations') {
        if (currentEventFilter !== 'all') {
            const ev = eventsData.find(e => e.id === currentEventFilter);
            revSubLabel = ev ? `For: ${ev.name}` : 'Filtered revenue';
        } else if (isFiltered) {
            revSubLabel = 'Filtered revenue';
        } else {
            revSubLabel = 'All events combined';
        }
    } else {
        revSubLabel = 'Based on all registrations';
    }

    // Update stat cards
    const revenueEl = document.getElementById('stat-revenue');
    const revenueSubEl = document.getElementById('stat-revenue-sub');
    const pendingEl = document.getElementById('stat-pending');
    const pendingSubEl = document.getElementById('stat-pending-sub');

    if (revenueEl) revenueEl.textContent = `₹${revenueCollected.toLocaleString('en-IN')}`;
    if (revenueSubEl) revenueSubEl.textContent = revSubLabel;
    if (pendingEl) pendingEl.textContent = pendingCount;
    if (pendingSubEl) pendingSubEl.textContent = pendingCount > 0 ? `₹${pendingAmount.toLocaleString('en-IN')} at risk` : 'All clear ✓';
}

function renderCurrentView() {
    const sectionsContainer = document.getElementById('registration-sections');
    const statTotalWrapper = document.getElementById('stat-total-wrapper'); // To change label
    const statTotal = document.getElementById('stat-total');
    const statCount = document.getElementById('stat-count');
    const pageHeader = document.querySelector('.text-gradient');

    const filteredData = getFilteredData();

    statCount.textContent = filteredData.length;
    computePaymentSummary(filteredData);

    sectionsContainer.innerHTML = '';

    if (currentView === 'registrations') {
        pageHeader.textContent = 'Registrations Overview';
        statTotalWrapper.querySelector('.stat-label').textContent = 'Total Orders';
        statTotal.textContent = allRegistrations.length;

        if (filteredData.length === 0) {
            sectionsContainer.innerHTML = `<p style="text-align: center; padding: 40px; color: var(--color-white-muted);">No registrations found.</p>`;
            return;
        }

        // Group by Event Name (instead of Category for cleaner look)
        const grouped = {};
        filteredData.forEach(item => {
            const key = item.eventName || 'Unknown Event';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(item);
        });

        Object.keys(grouped).sort().forEach(eventName => {
            const items = grouped[eventName];
            const event = eventsData.find(e => e.name === eventName);
            const catColor = event ? getColorForCategory(event.category) : '#94a3b8';

            const section = document.createElement('section');
            section.className = 'admin-section';
            section.innerHTML = `
                <div class="section-header">
                    <h2 class="section-title">
                        <span class="category-dot" style="background: ${catColor}"></span>
                        ${eventName}
                    </h2>
                    <span class="page-label">${items.length} Entries</span>
                </div>
                <div class="table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>SAP ID</th>
                                <th>Contact</th>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Order ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(item => `
                                <tr>
                                    <td><strong>${item.userName}</strong></td>
                                    <td><span class="sap-id">${item.userSapId || '—'}</span></td>
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
                                    <td style="font-family: monospace; opacity: 0.7;">${item.orderId}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            sectionsContainer.appendChild(section);
        });

    } else {
        // TEAMS VIEW
        pageHeader.textContent = 'Teams Management';
        statTotalWrapper.querySelector('.stat-label').textContent = 'Total Teams';
        statTotal.textContent = allTeams.length;

        if (filteredData.length === 0) {
            sectionsContainer.innerHTML = `<p style="text-align: center; padding: 40px; color: var(--color-white-muted);">No teams found.</p>`;
            return;
        }

        // Group by Event Name
        const grouped = {};
        filteredData.forEach(team => {
            const event = eventsData.find(e => e.id === team.eventId);
            const key = event ? event.name : 'Unknown Event';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(team);
        });

        Object.keys(grouped).sort().forEach(eventName => {
            const items = grouped[eventName];
            const event = eventsData.find(e => e.name === eventName);
            const catColor = event ? getColorForCategory(event.category) : '#94a3b8';

            const section = document.createElement('section');
            section.className = 'admin-section';
            section.innerHTML = `
                <div class="section-header">
                    <h2 class="section-title">
                        <span class="category-dot" style="background: ${catColor}"></span>
                        ${eventName}
                    </h2>
                    <span class="page-label">${items.length} Teams</span>
                </div>
                <div class="table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Team Name</th>
                                <th>Leader</th>
                                <th>Members</th>
                                <th>Invite Code</th>
                                <th>Created At</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(team => {
                const leader = team.members.find(m => m.userId === team.leaderId);
                return `
                                <tr>
                                    <td><strong>${team.name}</strong></td>
                                    <td>
                                        <div>${leader ? leader.name : 'Unknown'}</div>
                                        <div style="font-size: 10px; opacity: 0.6;">${leader ? (leader.sapId || 'No SAP ID') : ''}</div>
                                    </td>
                                    <td>
                                        <div class="member-stack">
                                        ${team.members.map(m => `
                                            <div title="${m.name} (${m.sapId || 'No SAP'})" style="font-size: 11px; padding: 2px 0;">
                                                ${m.name} <span style="opacity:0.5; font-size: 10px;">${m.sapId || '-'}</span>
                                            </div>
                                        `).join('')}
                                        </div>
                                    </td>
                                    <td style="font-family: monospace; color: #00d4aa;">${team.inviteCode}</td>
                                    <td>${new Date(team.createdAt).toLocaleDateString()}</td>
                                </tr>
                                `;
            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            sectionsContainer.appendChild(section);
        });
    }
}

function getColorForCategory(cat) {
    if (!cat) return '#94a3b8';
    switch (cat.toLowerCase()) {
        case 'competition': return '#00d4aa';
        case 'workshop': return '#f472b6';
        case 'gaming': return '#6366f1';
        default: return '#94a3b8';
    }
}

function exportToCSV() {
    const data = getFilteredData();
    let rows = [];
    let filename = '';

    if (currentView === 'registrations') {
        filename = `ambiora_registrations_${currentEventFilter}_${new Date().toLocaleDateString()}.csv`;
        rows = [['Date', 'User Name', 'SAP ID', 'Email', 'Phone', 'Event Name', 'Category', 'Price', 'Order ID', 'Status']];
        data.forEach(item => {
            rows.push([
                new Date(item.date).toLocaleString(),
                item.userName,
                item.userSapId || '',
                item.userEmail,
                item.userPhone,
                item.eventName,
                item.eventCategory,
                item.eventPrice,
                item.orderId,
                item.paymentStatus
            ]);
        });
    } else {
        filename = `ambiora_teams_${currentEventFilter}_${new Date().toLocaleDateString()}.csv`;
        rows = [['Date Created', 'Team Name', 'Event Name', 'Invite Code', 'Leader Name', 'Leader SAP', 'Leader Email', 'Member 1', 'Member 1 SAP', 'Member 2', 'Member 2 SAP', 'Member 3', 'Member 3 SAP', 'Member 4', 'Member 4 SAP']];

        data.forEach(team => {
            const event = eventsData.find(e => e.id === team.eventId);
            const leader = team.members.find(m => m.userId === team.leaderId) || {};

            const row = [
                new Date(team.createdAt).toLocaleString(),
                team.name,
                event ? event.name : team.eventId,
                team.inviteCode,
                leader.name || '',
                leader.sapId || '',
                leader.email || ''
            ];

            // Add members (excluding leader for cleanliness, or just all members)
            // Let's list all members including leader to be safe, or just others.
            // Requirement is details. Let's append members sequentially.
            team.members.forEach(m => {
                if (m.userId !== team.leaderId) {
                    row.push(m.name);
                    row.push(m.sapId || '');
                }
            });

            rows.push(row);
        });
    }

    let csvContent = "data:text/csv;charset=utf-8,"
        + rows.map(e => e.map(cell => `"${cell}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportToExcel() {
    if (typeof XLSX === 'undefined') {
        alert('Excel library is still loading. Please try again in a moment.');
        return;
    }

    const data = getFilteredData();
    let excelData = [];
    let sheetName = '';
    let fileName = '';

    if (currentView === 'registrations') {
        sheetName = 'Registrations';
        fileName = `ambiora_registrations_${currentEventFilter}.xlsx`;
        excelData = data.map(item => ({
            'Registration Date': new Date(item.date).toLocaleString(),
            'User Name': item.userName,
            'SAP ID': item.userSapId || '',
            'Email': item.userEmail,
            'Phone': item.userPhone,
            'Event Name': item.eventName,
            'Category': item.eventCategory,
            'Price (INR)': item.eventPrice,
            'Order ID': item.orderId,
            'Payment Status': item.paymentStatus
        }));
    } else {
        sheetName = 'Teams';
        fileName = `ambiora_teams_${currentEventFilter}.xlsx`;
        excelData = data.map(team => {
            const event = eventsData.find(e => e.id === team.eventId);
            const leader = team.members.find(m => m.userId === team.leaderId) || {};

            const row = {
                'Created At': new Date(team.createdAt).toLocaleString(),
                'Team Name': team.name,
                'Event': event ? event.name : team.eventId,
                'Invite Code': team.inviteCode,
                'Leader Name': leader.name,
                'Leader SAP': leader.sapId,
                'Leader Email': leader.email
            };

            // Dynamic Member Columns
            team.members.forEach((m, idx) => {
                row[`Member ${idx + 1} Name`] = m.name;
                row[`Member ${idx + 1} SAP`] = m.sapId;
                row[`Member ${idx + 1} Status`] = m.status;
            });

            return row;
        });
    }

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Auto-size columns
    const maxWidths = {};
    excelData.forEach(row => {
        Object.keys(row).forEach(key => {
            const val = String(row[key] || '');
            maxWidths[key] = Math.max(maxWidths[key] || key.length, val.length);
        });
    });
    worksheet['!cols'] = Object.keys(maxWidths).map(key => ({ wch: maxWidths[key] + 2 }));

    XLSX.writeFile(workbook, fileName);
}
