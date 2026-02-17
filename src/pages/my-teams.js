/* ============================================
   AMBIORA - MY TEAMS SCRIPT
   ============================================ */

import { isAuthenticated, redirectToLogin, fetchCurrentUser } from '../utils/auth.js';
import { API_CONFIG } from '../config/api.js';
import { eventsData } from '../data/eventsData.js';

document.addEventListener('DOMContentLoaded', () => {
    if (!isAuthenticated()) {
        redirectToLogin('/my-teams.html');
        return;
    }

    initMyTeams();
});

async function initMyTeams() {
    // DOM Elements
    const teamsList = document.getElementById('teams-list');
    const createModal = document.getElementById('create-team-modal');
    const openCreateBtn = document.getElementById('open-create-modal');
    const closeModalBtn = document.querySelector('.close-modal');
    const createForm = document.getElementById('create-team-form');
    const joinForm = document.getElementById('join-team-form');
    const eventSelect = document.getElementById('event-select');

    // 1. Fetch User's Teams and Registrations
    loadTeams();
    loadEligibleEvents();

    // Event Listeners
    openCreateBtn.addEventListener('click', async () => {
        // Check if user has SAP ID before showing modal
        const user = await fetchCurrentUser();
        if (user.success && !user.user.sapId) {
            if (confirm('You need an SAP ID to create a team. Go to Profile to update it?')) {
                window.location.href = '/profile.html';
            }
            return;
        }

        createModal.classList.add('active');
        loadEligibleEvents();
    });

    // Assuming there's a join button and join modal, based on the edit
    const joinTeamBtn = document.getElementById('open-join-modal'); // Assuming this ID
    const joinModal = document.getElementById('join-team-modal'); // Assuming this ID
    const closeModals = document.querySelectorAll('.close-modal'); // Assuming multiple close buttons

    if (joinTeamBtn) {
        joinTeamBtn.addEventListener('click', () => {
            joinModal.classList.add('active');
        });
    }

    closeModals.forEach(btn => {
        btn.addEventListener('click', () => {
            createModal.classList.remove('active');
            if (joinModal) joinModal.classList.remove('active');
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === createModal) createModal.classList.remove('active');
        if (joinModal && e.target === joinModal) joinModal.classList.remove('active');
    });

    // Create Team Submission
    createForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const startBtn = createForm.querySelector('button[type="submit"]');
        const name = document.getElementById('team-name').value;
        const eventId = eventSelect.value;

        setLoading(true, startBtn, 'Creating...');

        try {
            const response = await fetch(`${API_CONFIG.API_URL}/teams`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('ambiora_token')}`
                },
                body: JSON.stringify({ name, eventId })
            });

            const result = await response.json();

            if (result.success) {
                showAlert('Team created successfully!', 'success');
                createModal.classList.remove('active');
                createForm.reset();
                loadTeams(); // Reload list
            } else {
                showAlert(result.message || 'Failed to create team', 'error');
            }
        } catch (error) {
            console.error(error);
            showAlert('Failed to create team', 'error');
        } finally {
            setLoading(false, startBtn, 'Create Team');
        }
    });

    // Join Team Submission
    joinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = joinForm.querySelector('button');
        const inviteCode = document.getElementById('invite-code-input').value.trim(); // Original ID was 'invite-code-input'

        if (!inviteCode) {
            showAlert('Please enter an invite code', 'error');
            return;
        }

        setLoading(true, btn, 'Joining...');

        try {
            const response = await fetch(`${API_CONFIG.API_URL}/teams/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('ambiora_token')}`
                },
                body: JSON.stringify({ inviteCode })
            });

            const result = await response.json();

            if (result.success) {
                showAlert('Joined team successfully!', 'success');
                if (joinModal) joinModal.classList.remove('active');
                joinForm.reset();
                loadTeams();
            } else {
                // Handle specific payment error
                if (result.message.includes('must first register')) {
                    if (confirm(`${result.message}\n\nGo to Events page now?`)) {
                        window.location.href = '/events.html';
                    }
                } else if (result.message.includes('SAP ID')) {
                    if (confirm(`${result.message}\n\nGo to Profile page?`)) {
                        window.location.href = '/profile.html';
                    }
                } else {
                    showAlert(result.message, 'error');
                }
            }
        } catch (error) {
            console.error(error);
            showAlert('Failed to join team', 'error');
        } finally {
            setLoading(false, btn, 'Join Team');
        }
    });

    // Load Teams Function
    async function loadTeams() {
        try {
            const response = await fetch(`${API_CONFIG.API_URL}/teams`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('ambiora_token')}` }
            });
            const data = await response.json();

            if (data.success) {
                renderTeams(data.teams);
            } else {
                teamsList.innerHTML = '<p style="color:rgba(255,255,255,0.5); text-align:center;">Failed to load teams.</p>';
            }
        } catch (error) {
            console.error(error);
            teamsList.innerHTML = '<p style="color:rgba(255,255,255,0.5); text-align:center;">Network error.</p>';
        }
    }

    // Load Eligible Events for Creation
    async function loadEligibleEvents() {
        try {
            // Get user's registrations from backend
            const response = await fetch(`${API_CONFIG.API_URL}/registrations`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('ambiora_token')}` }
            });
            const data = await response.json();

            if (data.success) {
                // Flatten all registered events
                const registeredEventIds = new Set();
                data.registrations.forEach(reg => {
                    if (reg.paymentStatus && reg.paymentStatus.toUpperCase() === 'SUCCESS') {
                        reg.events.forEach(ev => registeredEventIds.add(ev.eventId));
                    }
                });

                // Filter eventsData for TEAM events that the user has registered for
                // User requirement: Include any event that is not strictly individual
                const eligibleEvents = eventsData.filter(ev => {
                    const isTeam = ev.isTeamEvent === true ||
                        (ev.priceNote && ev.priceNote.toLowerCase().includes('per team')) ||
                        (ev.teamSize && !ev.teamSize.toLowerCase().includes('solo') && !ev.teamSize.toLowerCase().includes('individual'));

                    return isTeam && registeredEventIds.has(ev.id);
                });

                // Populate Select
                eventSelect.innerHTML = '<option value="">Select an event...</option>';
                if (eligibleEvents.length === 0) {
                    const opt = document.createElement('option');
                    opt.disabled = true;
                    opt.text = "No team events registered";
                    eventSelect.appendChild(opt);
                } else {
                    eligibleEvents.forEach(ev => {
                        const opt = document.createElement('option');
                        opt.value = ev.id;
                        opt.text = ev.name;
                        eventSelect.appendChild(opt);
                    });
                }
            }
        } catch (error) {
            console.error("Error loading eligible events", error);
        }
    }

    function renderTeams(teams) {
        if (!teams || teams.length === 0) {
            teamsList.innerHTML = `
                <div style="text-align: center; color: rgba(255,255,255,0.4); padding: 3rem; background: rgba(255,255,255,0.02); border-radius: 12px;">
                    <p>You haven't joined any teams yet.</p>
                </div>
            `;
            return;
        }

        const userId = getIdFromToken(); // Helper to be implemented or decoded

        teamsList.innerHTML = teams.map(team => {
            const event = eventsData.find(e => e.id === team.eventId);
            const isLeader = team.leaderId === userId; // Check logic needed

            return `
                <div class="team-card">
                    <div class="team-header">
                        <div>
                            <div class="team-name">${team.name}</div>
                            <div class="team-event">${event ? event.name : 'Unknown Event'}</div>
                        </div>
                        <span class="team-role-badge">${isLeader ? 'Leader' : 'Member'}</span>
                    </div>

                    ${isLeader ? `
                    <div class="team-invite-section">
                        <span style="color: rgba(255,255,255,0.6); font-size: 0.9rem;">Invite Code:</span>
                        <div style="display: flex; gap: 1rem; align-items: center;">
                            <span class="invite-code">${team.inviteCode}</span>
                            <button class="copy-btn" onclick="navigator.clipboard.writeText('${team.inviteCode}').then(() => alert('Code copied!'))">
                                Copy
                            </button>
                        </div>
                    </div>` : ''}

                    <div style="margin-top: 1rem;">
                        <h4 style="color: rgba(255,255,255,0.6); font-size: 0.9rem; margin-bottom: 0.5rem;">Members (${team.members.length})</h4>
                        <ul class="member-list">
                            ${team.members.map(member => `
                                <li class="member-item">
                                    <div class="member-avatar">
                                        ${member.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div class="member-info">
                                        <span class="member-name">${member.name} ${member.userId === team.leaderId ? '👑' : ''}</span>
                                        <span class="member-sap">${member.sapId || 'No SAP ID'}</span>
                                    </div>
                                    ${member.status === 'pending' ? '<span style="color: orange; font-size: 0.8rem;">Pending</span>' : ''}
                                    
                                    ${isLeader && member.userId !== team.leaderId ? `
                                        <button class="remove-member-btn" data-team-id="${team._id}" data-user-id="${member.userId}" 
                                        style="background:none; border:none; color: #ff6b6b; cursor:pointer; font-size:0.9rem; margin-left: 1rem;"
                                        title="Remove Member">
                                            ✕
                                        </button>
                                    ` : ''}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            `;
        }).join('');

        // Attach event listeners for remove buttons
        document.querySelectorAll('.remove-member-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const teamId = e.target.closest('button').dataset.teamId;
                const userId = e.target.closest('button').dataset.userId;

                if (confirm('Are you sure you want to remove this member?')) {
                    await removeMember(teamId, userId);
                }
            });
        });
    }

    async function removeMember(teamId, userId) {
        try {
            const response = await fetch(`${API_CONFIG.API_URL}/teams/${teamId}/members/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('ambiora_token')}` }
            });
            const result = await response.json();

            if (result.success) {
                showAlert('Member removed successfully', 'success');
                loadTeams();
            } else {
                showAlert(result.message, 'error');
            }
        } catch (error) {
            console.error(error);
            showAlert('Failed to remove member', 'error');
        }
    }

    // Helper: decode JWT locally to get ID for UI logic (simplified)
    function getIdFromToken() {
        const token = localStorage.getItem('ambiora_token');
        if (!token) return null;
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload).id;
        } catch (e) {
            return null;
        }
    }

    function setLoading(isLoading, btn, defaultText) {
        if (isLoading) {
            btn.classList.add('loading');
            btn.disabled = true;
            btn.textContent = 'Please wait...';
        } else {
            btn.classList.remove('loading');
            btn.disabled = false;
            btn.textContent = defaultText;
        }
    }

    function showAlert(message, type) {
        const alert = document.getElementById('team-alert');
        const alertMsg = document.getElementById('team-alert-message');
        if (alert) {
            alertMsg.textContent = message;
            alert.className = `auth-alert ${type === 'success' ? 'success' : 'error'} visible`;
            setTimeout(() => alert.classList.remove('visible'), 3000);
        } else {
            alert(message);
        }
    }
}
