// ====================================
// LOGIN PAGE SCRIPT (FIXED)
// ====================================

import { loginUser } from '../auth.js';
import { showToast, showLoading, hideLoading } from '../utils.js';

const form         = document.getElementById('login-form');
const emailInput   = document.getElementById('email');
const passwordInput= document.getElementById('password');

// Form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email    = emailInput.value.trim();
    const password = passwordInput.value;

    clearErrors();

    if (!email)    { showError('email',    'Email is required');    return; }
    if (!password) { showError('password', 'Password is required'); return; }

    showLoading('Signing in...');
    const result = await loginUser(email, password);
    hideLoading();

    if (result.success) {
        showToast('Login successful! Redirecting...', 'success');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
    } else {
        showToast(result.message, 'error');
        showError('email', result.message);
    }
});

// Helpers
const showError = (fieldName, message) => {
    const input = document.getElementById(fieldName);
    const err   = document.getElementById(`${fieldName}-error`);
    if (input) input.classList.add('error');
    if (err) { err.textContent = message; err.classList.add('show'); }
};

const clearErrors = () => {
    document.querySelectorAll('.form-error').forEach(el => el.classList.remove('show'));
    document.querySelectorAll('input.error').forEach(el => el.classList.remove('error'));
};

const clearFieldError = (fieldName) => {
    const input = document.getElementById(fieldName);
    const err   = document.getElementById(`${fieldName}-error`);
    if (input) input.classList.remove('error');
    if (err)   err.classList.remove('show');
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Real-time validation
emailInput.addEventListener('blur', () => {
    if (!emailInput.value.trim())          showError('email', 'Email is required');
    else if (!isValidEmail(emailInput.value)) showError('email', 'Please enter a valid email');
    else clearFieldError('email');
});

passwordInput.addEventListener('blur', () => {
    if (!passwordInput.value) showError('password', 'Password is required');
    else clearFieldError('password');
});

// Dark mode
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
}

console.log('Login page loaded');
