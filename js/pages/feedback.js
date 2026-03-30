// ====================================
// FEEDBACK PAGE SCRIPT (FIXED)
// ====================================

import { submitFeedback } from '../feedback.js';
import { classifySentiment } from '../sentiment.js';
import { getCurrentUser, logoutUser } from '../auth.js';
import { showToast, showLoading, hideLoading, initializeDarkMode, toggleDarkMode, getInitials } from '../utils.js';

const form             = document.getElementById('feedback-form');
const feedbackTextarea = document.getElementById('feedback');
const charCountSpan    = document.getElementById('char-count');
const sentimentPreview = document.getElementById('sentiment-preview');
const resetBtn         = document.getElementById('reset-btn');
const logoutBtn        = document.getElementById('logout-btn');
const darkModeBtn      = document.getElementById('dark-mode-btn');
const userAvatarEl     = document.getElementById('user-avatar');
const userNameEl       = document.getElementById('user-name');
const stars            = document.querySelectorAll('.star');
const ratingInput      = document.getElementById('rating');
const successContainer = document.getElementById('success-container');
const formCard         = document.querySelector('.form-card');
const starsContainer   = document.querySelector('.star-rating');

let currentUser   = null;
let selectedRating = 0;

// Initialize
const initPage = async () => {
    try {
        const user = await getCurrentUser();
        if (!user) { window.location.href = 'login.html'; return; }
        currentUser = user;
        updateUserInfo();
    } catch (error) {
        console.error('Error initializing page:', error);
        window.location.href = 'login.html';
    }
};

const updateUserInfo = () => {
    if (!currentUser) return;
    const initials = getInitials(currentUser.displayName || 'Student');
    if (userAvatarEl) userAvatarEl.textContent = initials;
    if (userNameEl)   userNameEl.textContent   = currentUser.displayName || 'Student';
};

// Character count & sentiment preview
feedbackTextarea.addEventListener('input', () => {
    const count = Math.min(feedbackTextarea.value.length, 1000);
    feedbackTextarea.value = feedbackTextarea.value.substring(0, 1000);
    if (charCountSpan) charCountSpan.textContent = count;

    if (count >= 20) updateSentimentPreview();
    else sentimentPreview.classList.remove('show');
});

const updateSentimentPreview = () => {
    const analysis = classifySentiment(feedbackTextarea.value);
    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setEl('sentiment-positive', analysis.details.positive + '%');
    setEl('sentiment-neutral',  analysis.details.neutral  + '%');
    setEl('sentiment-negative', analysis.details.negative + '%');
    sentimentPreview.classList.add('show');
};

// Star rating
stars.forEach(star => {
    star.addEventListener('click', () => {
        selectedRating = parseInt(star.dataset.rating);
        ratingInput.value = selectedRating;
        updateStars();
        updateRatingDisplay();
    });
    star.addEventListener('mouseover', () => {
        const hover = parseInt(star.dataset.rating);
        stars.forEach(s => {
            s.classList.toggle('active', parseInt(s.dataset.rating) <= hover);
        });
    });
});

if (starsContainer) starsContainer.addEventListener('mouseleave', updateStars);

const updateStars = () => {
    stars.forEach(s => {
        s.classList.toggle('active', parseInt(s.dataset.rating) <= selectedRating);
    });
};

const updateRatingDisplay = () => {
    const el = document.querySelector('.rating-value');
    if (el) el.textContent = `${selectedRating} / 5`;
};

// Form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        studentName: document.getElementById('studentName').value.trim(),
        studentId:   document.getElementById('studentId').value.trim(),
        department:  document.getElementById('department').value,
        year:        document.getElementById('year').value,
        subject:     document.getElementById('subject').value.trim(),
        faculty:     document.getElementById('faculty').value.trim(),
        rating:      parseInt(ratingInput.value),
        feedback:    feedbackTextarea.value.trim(),
        userId:      currentUser.uid
    };

    const errors = validateForm(formData);
    if (errors.length > 0) {
        errors.forEach(err => showToast(err, 'error'));
        return;
    }

    showLoading('Submitting your feedback...');
    const result = await submitFeedback(formData);
    hideLoading();

    if (result.success) {
        showToast('Feedback submitted successfully!', 'success');
        if (formCard)         formCard.style.display = 'none';
        if (successContainer) successContainer.classList.add('show');
    } else {
        showToast(result.message || 'Failed to submit feedback', 'error');
    }
});

const validateForm = (data) => {
    const errors = [];
    if (!data.studentName)          errors.push('Student name is required');
    if (!data.studentId)            errors.push('Student ID is required');
    if (!data.department)           errors.push('Department is required');
    if (!data.year)                 errors.push('Year/Semester is required');
    if (!data.subject)              errors.push('Subject name is required');
    if (!data.faculty)              errors.push('Faculty name is required');
    if (data.rating === 0)          errors.push('Please select a rating');
    if (data.feedback.length < 20)  errors.push('Feedback must be at least 20 characters');
    return errors;
};

// Reset
if (resetBtn) resetBtn.addEventListener('click', () => {
    form.reset();
    selectedRating = 0;
    ratingInput.value = 0;
    updateStars();
    updateRatingDisplay();
    sentimentPreview.classList.remove('show');
    if (charCountSpan) charCountSpan.textContent = '0';
});

// Logout
if (logoutBtn) logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    showLoading('Logging out...');
    const result = await logoutUser();
    hideLoading();
    if (result.success) {
        showToast('Logged out successfully', 'success');
        setTimeout(() => window.location.href = '../index.html', 500);
    }
});

// Dark mode
if (darkModeBtn) darkModeBtn.addEventListener('click', () => {
    const isDark = toggleDarkMode();
    darkModeBtn.innerHTML = isDark
        ? '<i class="fas fa-sun"></i> <span>Light Mode</span>'
        : '<i class="fas fa-moon"></i> <span>Dark Mode</span>';
});

// Profile icon (guarded)
const profileIcon = document.getElementById('user-profile-icon');
if (profileIcon) profileIcon.addEventListener('click', () => window.location.href = 'profile.html');

// Init dark mode
if (initializeDarkMode()) {
    if (darkModeBtn) darkModeBtn.innerHTML = '<i class="fas fa-sun"></i> <span>Light Mode</span>';
}

initPage();
console.log('Feedback page loaded');
