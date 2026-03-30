// ====================================
// UTILITY MODULE - UI & Helper Functions
// ====================================

/**
 * Show toast notification
 */
export const showToast = (message, type = 'info', duration = 3000) => {
    const container = document.getElementById('toast-container') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${message}</span>
        <button class="toast-close">&times;</button>
    `;
    
    container.appendChild(toast);
    
    // Auto-remove after duration
    setTimeout(() => {
        toast.remove();
    }, duration);
    
    // Manual close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });
};

/**
 * Create toast container if it doesn't exist
 */
const createToastContainer = () => {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
};

/**
 * Show loading spinner
 */
export const showLoading = (message = 'Loading...') => {
    const loader = document.createElement('div');
    loader.id = 'global-loader';
    loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        flex-direction: column;
        gap: 1rem;
    `;
    loader.innerHTML = `
        <div class="spinner"></div>
        <p style="color: white; font-size: 1rem;">${message}</p>
    `;
    document.body.appendChild(loader);
    return loader;
};

/**
 * Hide loading spinner
 */
export const hideLoading = () => {
    const loader = document.getElementById('global-loader');
    if (loader) loader.remove();
};

/**
 * Format date
 */
export const formatDate = (date) => {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(date);
};

/**
 * Format date and time
 */
export const formatDateTime = (date) => {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
};

/**
 * Truncate text
 */
export const truncateText = (text, length = 100) => {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
};

/**
 * Export data to CSV
 */
export const exportToCSV = (data, filename = 'export.csv') => {
    if (!data || data.length === 0) {
        showToast('No data to export', 'warning');
        return;
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    let csv = headers.join(',') + '\n';
    
    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header];
            // Handle commas and quotes in values
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value || '';
        });
        csv += values.join(',') + '\n';
    });

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Data exported as ${filename}`, 'success');
};

/**
 * Toggle dark mode
 */
export const toggleDarkMode = () => {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDark);
    return isDark;
};

/**
 * Initialize dark mode from localStorage
 */
export const initializeDarkMode = () => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
    }
    return isDark;
};

/**
 * Get dark mode status
 */
export const isDarkMode = () => {
    return document.body.classList.contains('dark-mode');
};

/**
 * Debounce function
 */
export const debounce = (func, wait = 300) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

/**
 * Throttle function
 */
export const throttle = (func, limit = 300) => {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

/**
 * Format feedback data for CSV export
 */
export const formatFeedbackForCSV = (feedbackArray) => {
    return feedbackArray.map((feedback, index) => ({
        'S.No': index + 1,
        'Student Name': feedback.studentName || '',
        'Student ID': feedback.studentId || '',
        'Department': feedback.department || '',
        'Subject': feedback.subject || '',
        'Faculty': feedback.faculty || '',
        'Rating': feedback.rating || '',
        'Sentiment': feedback.sentiment || '',
        'Feedback': feedback.feedback || '',
        'Date': formatDate(feedback.timestamp),
        'Time': new Date(feedback.timestamp).toLocaleTimeString()
    }));
};

/**
 * Get random quote
 */
export const getRandomQuote = () => {
    const quotes = [
        "Your feedback shapes the future of education",
        "Every opinion matters",
        "Speak up. Improve together.",
        "Education thrives on honest feedback",
        "Your voice, our growth",
        "Feedback is the breakfast of champions",
        "Quality education starts with your input",
        "Together, we make education better",
        "Your thoughts, our improvements",
        "Empowering education through feedback",
        "Students speak, we listen, we improve",
        "Honest feedback, better tomorrow",
        "Your satisfaction is our mission",
        "Communication is key to excellence",
        "Learning grows with open feedback"
    ];
    
    return quotes[Math.floor(Math.random() * quotes.length)];
};

/**
 * Validate form before submission
 */
export const validateForm = (formData, requiredFields) => {
    const errors = {};
    
    requiredFields.forEach(field => {
        if (!formData[field] || formData[field].toString().trim() === '') {
            errors[field] = `${field} is required`;
        }
    });
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors: errors
    };
};

/**
 * Show form errors
 */
export const showFormErrors = (errors, form) => {
    // Clear previous errors
    form.querySelectorAll('.form-error').forEach(el => el.classList.remove('show'));
    form.querySelectorAll('input.error, select.error, textarea.error').forEach(el => el.classList.remove('error'));
    
    // Show new errors
    Object.keys(errors).forEach(field => {
        const input = form.querySelector(`[name="${field}"]`);
        const errorElement = form.querySelector(`#${field}-error`);
        
        if (input) {
            input.classList.add('error');
        }
        if (errorElement) {
            errorElement.textContent = errors[field];
            errorElement.classList.add('show');
        }
    });
};

/**
 * Clear form errors
 */
export const clearFormErrors = (form) => {
    form.querySelectorAll('.form-error').forEach(el => {
        el.classList.remove('show');
    });
    form.querySelectorAll('input.error, select.error, textarea.error').forEach(el => {
        el.classList.remove('error');
    });
};

/**
 * Animate element
 */
export const animateElement = (element, animationClass, duration = 500) => {
    element.classList.add(animationClass);
    
    setTimeout(() => {
        element.classList.remove(animationClass);
    }, duration);
};

/**
 * Copy to clipboard
 */
export const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!', 'success', 2000);
    }).catch(() => {
        showToast('Failed to copy', 'error');
    });
};

/**
 * Get initials from name
 */
export const getInitials = (name) => {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
};

/**
 * Format number
 */
export const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
};

/**
 * Redirect to URL
 */
export const redirect = (url, delay = 0) => {
    setTimeout(() => {
        window.location.href = url;
    }, delay);
};

/**
 * Check if online
 */
export const isOnline = () => {
    return navigator.onLine;
};

/**
 * Get browser info
 */
export const getBrowserInfo = () => {
    return {
        name: navigator.appName,
        version: navigator.appVersion,
        online: navigator.onLine,
        platform: navigator.platform,
        language: navigator.language
    };
};

console.log('Utility module loaded');
