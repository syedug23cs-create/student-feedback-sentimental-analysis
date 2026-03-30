// ====================================
// FORGOT PASSWORD PAGE SCRIPT
// ====================================

import { resetPassword, validateEmail } from '../auth.js';
import { showToast, showLoading, hideLoading } from '../utils.js';

const resetForm = document.getElementById('reset-form');
const emailInput = document.getElementById('reset-email');
const emailStep = document.getElementById('email-step');
const successStep = document.getElementById('success-step');
const errorStep = document.getElementById('error-step');

// Form submission
resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();

    // Validation
    if (!email) {
        showError('email', 'Email is required');
        return;
    }

    if (!validateEmail(email)) {
        showError('email', 'Please enter a valid email');
        return;
    }

    // Show loading
    showLoading('Sending reset link...');

    // Send reset email
    const result = await resetPassword(email);
    hideLoading();

    if (result.success) {
        showToast(result.message, 'success');
        switchStep('success');
    } else {
        showToast(result.message, 'error');
        // Show error step with message
        document.getElementById('error-message').textContent = result.message;
        switchStep('error');
    }
});

// Real-time validation
emailInput.addEventListener('blur', () => {
    if (!emailInput.value.trim()) {
        showError('email', 'Email is required');
    } else if (!validateEmail(emailInput.value)) {
        showError('email', 'Please enter a valid email');
    } else {
        clearFieldError('email');
    }
});

// Helper Functions
const showError = (fieldName, message) => {
    const input = document.getElementById('reset-' + fieldName);
    const errorElement = document.getElementById(`${fieldName}-error`);
    
    if (input) {
        input.classList.add('error');
    }
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
};

const clearFieldError = (fieldName) => {
    const input = document.getElementById('reset-' + fieldName);
    const errorElement = document.getElementById(`${fieldName}-error`);
    
    if (input) {
        input.classList.remove('error');
    }
    if (errorElement) {
        errorElement.classList.remove('show');
    }
};

const switchStep = (stepName) => {
    // Hide all steps
    emailStep.classList.remove('active');
    successStep.classList.remove('active');
    errorStep.classList.remove('active');

    // Show selected step
    if (stepName === 'email') {
        emailStep.classList.add('active');
    } else if (stepName === 'success') {
        successStep.classList.add('active');
    } else if (stepName === 'error') {
        errorStep.classList.add('active');
    }
};

// Initialize dark mode
const isDark = localStorage.getItem('darkMode') === 'true';
if (isDark) {
    document.body.classList.add('dark-mode');
}

console.log('Forgot password page loaded');
