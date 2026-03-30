// ====================================
// DASHBOARD PAGE SCRIPT (FIXED)
// ====================================

import { getDashboardStats, getPieChartData, getBarChartData, getChartOptions } from '../analytics.js';
import { getAllFeedback } from '../feedback.js';
import { getCurrentUser, logoutUser, isAdmin } from '../auth.js';
import { showToast, showLoading, hideLoading, initializeDarkMode, toggleDarkMode, getInitials, formatDate, truncateText, exportToCSV, formatFeedbackForCSV, debounce } from '../utils.js';

let currentUser = null;
let allFeedback = [];
let chartInstances = {};

// Initialize
const initPage = async () => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        currentUser = user;
        updateUserInfo();

        // Check admin role
        const admin = await isAdmin(user.uid);
        if (admin) {
            document.getElementById('admin-panel').style.display = 'flex';
        }

        await loadDashboardData();
    } catch (error) {
        console.error('Error initializing page:', error);
        window.location.href = 'login.html';
    }
};

const updateUserInfo = () => {
    if (!currentUser) return;
    const initials = getInitials(currentUser.displayName || 'Student');

    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setEl('user-avatar', initials);
    setEl('user-name', currentUser.displayName || 'Student');
    setEl('greeting-name', currentUser.displayName || 'Student');
    setEl('profile-name', currentUser.displayName || 'Student');
    setEl('profile-role', currentUser.userRole || 'Student');
};

// Load Dashboard Data
const loadDashboardData = async () => {
    showLoading('Loading dashboard...');
    try {
        const [statsResult, feedbackResult] = await Promise.all([
            getDashboardStats(),
            getAllFeedback()
        ]);
        hideLoading();

        if (!statsResult.success || !feedbackResult.success) {
            showToast('Failed to load dashboard data', 'error');
            return;
        }

        allFeedback = feedbackResult.data;
        updateStatistics(statsResult.data);
        await loadCharts();
        populateFilters();
        displayFeedbackTable(allFeedback);

        const dateEl = document.getElementById('current-date');
        if (dateEl) {
            dateEl.textContent = new Date().toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric'
            });
        }
    } catch (error) {
        hideLoading();
        console.error('Error loading dashboard:', error);
        showToast('Error loading dashboard data', 'error');
    }
};

// Update Statistics
const updateStatistics = (stats) => {
    const total = stats.total || 1;
    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setEl('total-feedback', stats.total);
    setEl('positive-percentage', Math.round((stats.positive / total) * 100) + '%');
    setEl('neutral-percentage',  Math.round((stats.neutral  / total) * 100) + '%');
    setEl('negative-percentage', Math.round((stats.negative / total) * 100) + '%');
};

// Load Charts — FIXED: removed duplicate pie chart block
const loadCharts = async () => {
    try {
        // Pie / Doughnut Chart
        const pieData = await getPieChartData();
        if (pieData) {
            const pieCtx = document.getElementById('sentiment-pie-chart').getContext('2d');
            if (chartInstances.pie) chartInstances.pie.destroy();
            chartInstances.pie = new Chart(pieCtx, {
                type: 'doughnut',
                data: pieData,
                options: getChartOptions('pie')
            });
        }

        // Subject Bar Chart
        const barData = await getBarChartData();
        if (barData) {
            const barCtx = document.getElementById('subject-bar-chart').getContext('2d');
            if (chartInstances.bar) chartInstances.bar.destroy();
            chartInstances.bar = new Chart(barCtx, {
                type: 'bar',
                data: barData,
                options: getChartOptions('bar')
            });
        }
    } catch (error) {
        console.error('Error loading charts:', error);
    }
};

// Display Feedback Table
const displayFeedbackTable = (feedback) => {
    const tbody = document.getElementById('feedback-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (feedback.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--text-muted);">No feedback available yet</td></tr>';
        return;
    }

    feedback.slice(0, 10).forEach(item => {
        const sentimentEmoji = item.sentiment === 'positive' ? '😊' : item.sentiment === 'negative' ? '😞' : '😐';
        const badgeClass = item.sentiment === 'positive' ? 'badge-success' : item.sentiment === 'negative' ? 'badge-danger' : 'badge-warning';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.studentName || '-'}</td>
            <td>${item.subject || '-'}</td>
            <td>${item.faculty || '-'}</td>
            <td>${item.rating || '-'}</td>
            <td><span class="badge ${badgeClass}">${sentimentEmoji} ${item.sentiment || 'neutral'}</span></td>
            <td title="${item.feedback || ''}">${truncateText(item.feedback || '', 50)}</td>
            <td>${formatDate(item.timestamp)}</td>
            <td>
                <div class="table-actions">
                    <button class="table-action-btn" onclick="window.viewFeedback('${item.id}')">View</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
};

// Populate Filters
const populateFilters = () => {
    const subjects = new Set();
    const faculties = new Set();
    allFeedback.forEach(f => {
        if (f.subject) subjects.add(f.subject);
        if (f.faculty)  faculties.add(f.faculty);
    });

    const subjectFilter = document.getElementById('subject-filter');
    const facultyFilter = document.getElementById('faculty-filter');

    subjects.forEach(s => {
        const o = document.createElement('option');
        o.value = s; o.textContent = s;
        subjectFilter.appendChild(o);
    });
    faculties.forEach(f => {
        const o = document.createElement('option');
        o.value = f; o.textContent = f;
        facultyFilter.appendChild(o);
    });
};

// Filter Handlers
const applyFilters = debounce(() => {
    const sentiment = document.getElementById('sentiment-filter').value;
    const subject   = document.getElementById('subject-filter').value;
    const faculty   = document.getElementById('faculty-filter').value;

    let filtered = [...allFeedback];
    if (sentiment) filtered = filtered.filter(f => f.sentiment === sentiment);
    if (subject)   filtered = filtered.filter(f => f.subject   === subject);
    if (faculty)   filtered = filtered.filter(f => f.faculty   === faculty);
    displayFeedbackTable(filtered);
}, 300);

// Attach listeners after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Filters
    ['sentiment-filter','subject-filter','faculty-filter'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', applyFilters);
    });

    // Search
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            const term = e.target.value.toLowerCase();
            const filtered = allFeedback.filter(f =>
                f.studentName?.toLowerCase().includes(term) ||
                f.subject?.toLowerCase().includes(term) ||
                f.faculty?.toLowerCase().includes(term) ||
                f.feedback?.toLowerCase().includes(term)
            );
            displayFeedbackTable(filtered);
        }, 300));
    }

    // Export CSV
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const data = formatFeedbackForCSV(allFeedback);
            exportToCSV(data, `feedback-export-${new Date().toISOString().split('T')[0]}.csv`);
        });
    }

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            showLoading('Logging out...');
            const result = await logoutUser();
            hideLoading();
            if (result.success) {
                showToast('Logged out successfully', 'success');
                setTimeout(() => window.location.href = '../index.html', 500);
            }
        });
    }

    // Dark mode
    const darkBtn = document.getElementById('dark-mode-btn');
    if (darkBtn) {
        darkBtn.addEventListener('click', () => {
            const isDark = toggleDarkMode();
            darkBtn.innerHTML = isDark
                ? '<i class="fas fa-sun"></i> <span>Light Mode</span>'
                : '<i class="fas fa-moon"></i> <span>Dark Mode</span>';
        });
    }

    // Profile icon
    const profileIcon = document.getElementById('user-profile-icon');
    if (profileIcon) {
        profileIcon.addEventListener('click', () => window.location.href = 'profile.html');
    }

    // Init dark mode
    if (initializeDarkMode()) {
        const btn = document.getElementById('dark-mode-btn');
        if (btn) btn.innerHTML = '<i class="fas fa-sun"></i> <span>Light Mode</span>';
    }
});

// View feedback (global for inline onclick)
window.viewFeedback = (feedbackId) => {
    showToast('Feedback ID: ' + feedbackId, 'info');
};

// Initialize page
initPage();
console.log('Dashboard page loaded');
