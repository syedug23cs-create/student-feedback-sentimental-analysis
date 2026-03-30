// ====================================
// PROFILE PAGE SCRIPT (FIXED)
// ====================================

import { getCurrentUser, logoutUser, updateUserProfile } from '../auth.js';
import { getUserFeedback } from '../feedback.js';
import { showToast, showLoading, hideLoading, initializeDarkMode, toggleDarkMode, getInitials, formatDate, exportToCSV, formatFeedbackForCSV, truncateText } from '../utils.js';

let currentUser = null;
let userFeedback = [];

const initPage = async () => {
    try {
        const user = await getCurrentUser();
        if (!user) { window.location.href = 'login.html'; return; }
        currentUser = user;
        await loadProfileData();
    } catch (error) {
        console.error('Error:', error);
        window.location.href = 'login.html';
    }
};

const loadProfileData = async () => {
    showLoading('Loading profile...');
    try {
        const feedbackResult = await getUserFeedback(currentUser.uid);
        hideLoading();
        if (feedbackResult.success) userFeedback = feedbackResult.data;
        updateProfileUI();
        updateFeedbackStats();
        displayFeedbackHistory();
        setupEventListeners();
    } catch (error) {
        hideLoading();
        showToast('Error loading profile data', 'error');
    }
};

const updateProfileUI = () => {
    const initials = getInitials(currentUser.displayName || 'Student');
    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setEl('user-avatar', initials);
    setEl('user-name', currentUser.displayName || 'Student');
    setEl('profile-avatar-large', initials);
    setEl('profile-name', currentUser.displayName || 'Student');
    setEl('profile-email', currentUser.email);
    setEl('info-name', currentUser.displayName || '—');
    setEl('info-email', currentUser.email || '—');
    setEl('info-joined', formatDate(currentUser.metadata?.creationTime || new Date()));
    setEl('info-student-id', currentUser.studentId || '—');
    setEl('info-department', currentUser.department || '—');
    setEl('info-year', currentUser.year || '—');
};

const updateFeedbackStats = () => {
    let positive = 0, neutral = 0, negative = 0, totalRating = 0;
    userFeedback.forEach(f => {
        if (f.sentiment === 'positive') positive++;
        else if (f.sentiment === 'neutral') neutral++;
        else negative++;
        if (f.rating) totalRating += f.rating;
    });
    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setEl('stat-total', userFeedback.length);
    setEl('stat-positive', positive);
    setEl('stat-neutral', neutral);
    setEl('stat-negative', negative);
    setEl('stat-avg-rating', userFeedback.length > 0 ? (totalRating / userFeedback.length).toFixed(1) + ' ★' : '—');
};

const displayFeedbackHistory = () => {
    const list = document.getElementById('feedback-list');
    if (!list) return;
    list.innerHTML = '';
    if (userFeedback.length === 0) {
        list.innerHTML = `<div style="text-align:center;padding:2.5rem;color:var(--text-muted);">
            <i class="fas fa-inbox" style="font-size:2.5rem;opacity:.4;display:block;margin-bottom:.75rem;"></i>
            <p>No feedback submitted yet.</p>
            <a href="feedback.html" class="btn btn-primary" style="margin-top:1rem;display:inline-flex;">
                <i class="fas fa-pen"></i> Submit Feedback
            </a></div>`;
        return;
    }
    userFeedback.forEach(feedback => {
        const badgeClass = feedback.sentiment === 'positive' ? 'badge-success' : feedback.sentiment === 'negative' ? 'badge-danger' : 'badge-warning';
        const el = document.createElement('div');
        el.className = 'feedback-item';
        el.innerHTML = `
            <div class="feedback-item-header">
                <div>
                    <div class="feedback-item-subject">${feedback.subject||'—'}</div>
                    <div class="feedback-item-date">${formatDate(feedback.timestamp)}</div>
                </div>
                <span class="badge ${badgeClass}" style="margin-left:auto;">${feedback.sentiment||'neutral'}</span>
            </div>
            <div class="feedback-item-content">${truncateText(feedback.feedback||'', 150)}</div>
            <div class="feedback-item-footer">
                <div class="feedback-rating">
                    ${Array.from({length:5}).map((_,i)=>`<span style="color:${i<(feedback.rating||0)?'var(--warning)':'var(--border)'}"><i class="fas fa-star"></i></span>`).join('')}
                </div>
                <small style="color:var(--text-muted);">${feedback.faculty||''}</small>
            </div>`;
        list.appendChild(el);
    });
};

const setupEventListeners = () => {
    document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
        const nameInput = document.getElementById('edit-fullName');
        if (nameInput) nameInput.value = currentUser.displayName || '';
        document.getElementById('edit-profile-modal')?.classList.add('show');
    });
    ['close-edit-modal','cancel-edit-btn'].forEach(id => {
        document.getElementById(id)?.addEventListener('click', () => document.getElementById('edit-profile-modal')?.classList.remove('show'));
    });
    document.getElementById('edit-profile-modal')?.addEventListener('click', e => {
        if (e.target.id === 'edit-profile-modal') document.getElementById('edit-profile-modal').classList.remove('show');
    });
    document.getElementById('edit-profile-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const updates = { fullName: document.getElementById('edit-fullName')?.value.trim() };
        if (!updates.fullName) { showToast('Full name is required', 'error'); return; }
        showLoading('Updating profile...');
        const result = await updateUserProfile(currentUser.uid, updates);
        hideLoading();
        if (result.success) {
            showToast(result.message, 'success');
            currentUser.displayName = updates.fullName;
            updateProfileUI();
            document.getElementById('edit-profile-modal')?.classList.remove('show');
        } else { showToast(result.message, 'error'); }
    });
    document.getElementById('export-feedback-btn')?.addEventListener('click', () => {
        if (!userFeedback.length) { showToast('No feedback to export', 'warning'); return; }
        exportToCSV(formatFeedbackForCSV(userFeedback), `my-feedback-${new Date().toISOString().split('T')[0]}.csv`);
    });
    document.getElementById('change-password-btn')?.addEventListener('click', () => showToast('Coming soon', 'info'));
    document.getElementById('export-profile-btn')?.addEventListener('click', () => {
        exportToCSV([
            {Field:'Name', Value:currentUser.displayName||'—'},
            {Field:'Email', Value:currentUser.email||'—'},
            {Field:'Total Feedback', Value:userFeedback.length},
            {Field:'Member Since', Value:formatDate(currentUser.metadata?.creationTime||new Date())}
        ], `profile-${new Date().toISOString().split('T')[0]}.csv`);
    });
    document.getElementById('delete-account-btn')?.addEventListener('click', () => {
        if (confirm('Are you sure? This cannot be undone.')) showToast('Account deletion coming soon', 'info');
    });
    document.getElementById('logout-btn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        showLoading('Logging out...');
        const result = await logoutUser();
        hideLoading();
        if (result.success) { showToast('Logged out', 'success'); setTimeout(() => window.location.href = '../index.html', 500); }
    });
    document.getElementById('dark-mode-btn')?.addEventListener('click', () => {
        const d = toggleDarkMode();
        const btn = document.getElementById('dark-mode-btn');
        if (btn) btn.innerHTML = d ? '<i class="fas fa-sun"></i> <span>Light Mode</span>' : '<i class="fas fa-moon"></i> <span>Dark Mode</span>';
    });
    document.getElementById('user-profile-icon')?.addEventListener('click', () => showToast('You are already on your profile page', 'info'));
};

if (initializeDarkMode()) {
    const btn = document.getElementById('dark-mode-btn');
    if (btn) btn.innerHTML = '<i class="fas fa-sun"></i> <span>Light Mode</span>';
}

initPage();
console.log('Profile page loaded');
