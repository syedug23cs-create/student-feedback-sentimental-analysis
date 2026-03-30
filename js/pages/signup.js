// ====================================
// SIGNUP PAGE SCRIPT (FIXED)
// ====================================

import { registerUser, validateEmail, validatePassword, getPasswordStrength } from '../auth.js';
import { showToast, showLoading, hideLoading } from '../utils.js';

const form                 = document.getElementById('signup-form');
const fullNameInput        = document.getElementById('fullName');
const emailInput           = document.getElementById('email');
const passwordInput        = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const strengthFill         = document.getElementById('strength-fill');
const strengthText         = document.getElementById('strength-text');
const termsCheckbox        = document.getElementById('terms');

// Password strength
passwordInput.addEventListener('input', () => {
    const strength = getPasswordStrength(passwordInput.value);
    strengthFill.className = `strength-fill ${strength}`;
    strengthText.textContent = `Strength: ${strength.charAt(0).toUpperCase() + strength.slice(1)}`;
});

// Form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName       = fullNameInput.value.trim();
    const email          = emailInput.value.trim();
    const password       = passwordInput.value;
    const confirmPassword= confirmPasswordInput.value;

    clearErrors();

    const errors = validateSignupForm(fullName, email, password, confirmPassword);
    if (Object.keys(errors).length > 0) {
        Object.keys(errors).forEach(field => showError(field, errors[field]));
        return;
    }

    if (!termsCheckbox.checked) {
        showError('terms', 'You must agree to the Terms of Service');
        return;
    }

    showLoading('Creating your account...');
    const result = await registerUser(email, password, fullName);
    hideLoading();

    if (result.success) {
        showToast('Account created! Redirecting to dashboard...', 'success');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
    } else {
        showToast(result.message, 'error');
        if (result.message.toLowerCase().includes('email')) {
            showError('email', result.message);
        }
    }
});

const validateSignupForm = (fullName, email, password, confirmPassword) => {
    const errors = {};
    if (!fullName)                     errors.fullName        = 'Full name is required';
    if (!email)                        errors.email           = 'Email is required';
    else if (!validateEmail(email))    errors.email           = 'Please enter a valid email';
    if (!password)                     errors.password        = 'Password is required';
    else if (!validatePassword(password)) errors.password     = 'Password must be at least 6 characters';
    if (!confirmPassword)              errors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
    return errors;
};

const showError = (fieldName, message) => {
    const input = document.getElementById(fieldName);
    const err   = document.getElementById(`${fieldName}-error`);
    if (input) input.classList.add('error');
    if (err) { err.textContent = message; err.classList.add('show'); }
};

const clearErrors = () => {
    document.querySelectorAll('.form-error').forEach(el => el.classList.remove('show'));
    document.querySelectorAll('input.error, select.error').forEach(el => el.classList.remove('error'));
};

const clearFieldError = (fieldName) => {
    const input = document.getElementById(fieldName);
    const err   = document.getElementById(`${fieldName}-error`);
    if (input) input.classList.remove('error');
    if (err)   err.classList.remove('show');
};

// Real-time validation
fullNameInput.addEventListener('blur', () => {
    if (!fullNameInput.value.trim()) showError('fullName', 'Full name is required');
    else clearFieldError('fullName');
});

emailInput.addEventListener('blur', () => {
    if (!emailInput.value.trim())         showError('email', 'Email is required');
    else if (!validateEmail(emailInput.value)) showError('email', 'Please enter a valid email');
    else clearFieldError('email');
});

passwordInput.addEventListener('blur', () => {
    if (!passwordInput.value)                   showError('password', 'Password is required');
    else if (!validatePassword(passwordInput.value)) showError('password', 'Password must be at least 6 characters');
    else clearFieldError('password');
});

confirmPasswordInput.addEventListener('blur', () => {
    if (!confirmPasswordInput.value) showError('confirmPassword', 'Please confirm your password');
    else if (passwordInput.value !== confirmPasswordInput.value) showError('confirmPassword', 'Passwords do not match');
    else clearFieldError('confirmPassword');
});

// Dark mode
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
}

console.log('Signup page loaded');
