// ====================================
// ANALYTICS MODULE - Dashboard & Charts
// ====================================

import { getFeedbackStats, getAllFeedback, getSatisfactionPercentage } from './feedback.js';

/**
 * Prepare data for pie chart (sentiment distribution)
 */
export const getPieChartData = async () => {
    try {
        const stats = await getFeedbackStats();

        if (!stats.success) {
            return null;
        }

        return {
            labels: ['Positive', 'Neutral', 'Negative'],
            datasets: [{
                data: [
                    stats.data.positiveFeedback,
                    stats.data.neutralFeedback,
                    stats.data.negativeFeedback
                ],
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                borderColor: ['#059669', '#d97706', '#dc2626'],
                borderWidth: 2
            }]
        };
    } catch (error) {
        console.error('Error preparing pie chart data:', error);
        return null;
    }
};

/**
 * Prepare data for bar chart (subject-wise feedback)
 */
export const getBarChartData = async () => {
    try {
        const stats = await getFeedbackStats();

        if (!stats.success) {
            return null;
        }

        const subjects = Object.keys(stats.data.bySubject);
        const counts = Object.values(stats.data.bySubject);

        return {
            labels: subjects,
            datasets: [{
                label: 'Feedback Count',
                data: counts,
                backgroundColor: '#6366f1',
                borderColor: '#4f46e5',
                borderWidth: 1,
                borderRadius: 5
            }]
        };
    } catch (error) {
        console.error('Error preparing bar chart data:', error);
        return null;
    }
};

/**
 * Prepare data for line chart (feedback over time)
 */
export const getLineChartData = async () => {
    try {
        const result = await getAllFeedback();

        if (!result.success) {
            return null;
        }

        // Group feedbacks by date
        const feedbackByDate = {};

        result.data.forEach(feedback => {
            const date = new Date(feedback.timestamp).toISOString().split('T')[0];
            feedbackByDate[date] = (feedbackByDate[date] || 0) + 1;
        });

        // Sort by date
        const sortedDates = Object.keys(feedbackByDate).sort();
        const counts = sortedDates.map(date => feedbackByDate[date]);

        // Calculate cumulative counts
        let cumulative = 0;
        const cumulativeCounts = counts.map(count => {
            cumulative += count;
            return cumulative;
        });

        return {
            labels: sortedDates,
            datasets: [{
                label: 'Total Feedback (Cumulative)',
                data: cumulativeCounts,
                borderColor: '#ec4899',
                backgroundColor: 'rgba(236, 72, 153, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 3,
                pointRadius: 5,
                pointBackgroundColor: '#ec4899',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        };
    } catch (error) {
        console.error('Error preparing line chart data:', error);
        return null;
    }
};

/**
 * Prepare data for faculty-wise feedback chart
 */
export const getFacultyChartData = async () => {
    try {
        const stats = await getFeedbackStats();

        if (!stats.success) {
            return null;
        }

        const faculties = Object.keys(stats.data.byFaculty);
        const counts = Object.values(stats.data.byFaculty);

        return {
            labels: faculties,
            datasets: [{
                label: 'Feedback Count',
                data: counts,
                backgroundColor: [
                    '#6366f1',
                    '#ec4899',
                    '#10b981',
                    '#f59e0b',
                    '#ef4444',
                    '#8b5cf6'
                ],
                borderWidth: 1
            }]
        };
    } catch (error) {
        console.error('Error preparing faculty chart data:', error);
        return null;
    }
};

/**
 * Prepare data for department-wise feedback chart
 */
export const getDepartmentChartData = async () => {
    try {
        const stats = await getFeedbackStats();

        if (!stats.success) {
            return null;
        }

        const departments = Object.keys(stats.data.byDepartment);
        const counts = Object.values(stats.data.byDepartment);

        return {
            labels: departments,
            datasets: [{
                label: 'Feedback Count',
                data: counts,
                backgroundColor: '#10b981',
                borderColor: '#059669',
                borderWidth: 1,
                borderRadius: 5
            }]
        };
    } catch (error) {
        console.error('Error preparing department chart data:', error);
        return null;
    }
};

/**
 * Prepare sentiment trend data
 */
export const getSentimentTrendData = async () => {
    try {
        const result = await getAllFeedback();

        if (!result.success) {
            return null;
        }

        // Group by date and sentiment
        const trendByDate = {};

        result.data.forEach(feedback => {
            const date = new Date(feedback.timestamp).toISOString().split('T')[0];
            if (!trendByDate[date]) {
                trendByDate[date] = { positive: 0, neutral: 0, negative: 0 };
            }
            trendByDate[date][feedback.sentiment]++;
        });

        const sortedDates = Object.keys(trendByDate).sort();

        return {
            labels: sortedDates,
            datasets: [
                {
                    label: 'Positive',
                    data: sortedDates.map(date => trendByDate[date].positive),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Neutral',
                    data: sortedDates.map(date => trendByDate[date].neutral),
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Negative',
                    data: sortedDates.map(date => trendByDate[date].negative),
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4
                }
            ]
        };
    } catch (error) {
        console.error('Error preparing sentiment trend data:', error);
        return null;
    }
};

/**
 * Get all dashboard stats
 */
export const getDashboardStats = async () => {
    try {
        const statsResult = await getFeedbackStats();
        const satisfactionResult = await getSatisfactionPercentage();

        if (!statsResult.success) {
            return statsResult;
        }

        return {
            success: true,
            data: {
                total: statsResult.data.totalFeedback,
                positive: statsResult.data.positiveFeedback,
                negative: statsResult.data.negativeFeedback,
                neutral: statsResult.data.neutralFeedback,
                averageRating: statsResult.data.averageRating,
                satisfactionPercentage: satisfactionResult.success ? satisfactionResult.percentage : 0,
                topSubjects: Object.entries(statsResult.data.bySubject)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5),
                topFaculty: Object.entries(statsResult.data.byFaculty)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
            }
        };
    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        return {
            success: false,
            message: 'Failed to get dashboard statistics',
            error: error
        };
    }
};

/**
 * Format chart options
 */
export const getChartOptions = (chartType = 'line') => {
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    font: {
                        size: 12,
                        weight: 'bold'
                    },
                    padding: 15
                }
            }
        }
    };

    const typeSpecificOptions = {
        line: {
            ...commonOptions,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        },
        bar: {
            ...commonOptions,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        },
        pie: {
            ...commonOptions,
            plugins: {
                ...commonOptions.plugins,
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(2);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    };

    return typeSpecificOptions[chartType] || commonOptions;
};

console.log('Analytics module loaded');
