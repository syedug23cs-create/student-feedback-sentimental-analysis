// ====================================
// FEEDBACK MODULE - Collect & Manage Feedback
// ====================================

import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    orderBy,
    deleteDoc,
    doc,
    updateDoc,
    getDoc,
    limit,
    startAfter
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { db, COLLECTIONS } from './firebase.js';
import { classifySentiment } from './sentiment.js';

/**
 * Submit new feedback
 */
export const submitFeedback = async (feedbackData) => {
    try {
        // Perform sentiment analysis
        const sentimentAnalysis = classifySentiment(feedbackData.feedback);

        // Prepare feedback document
        const feedbackDoc = {
            ...feedbackData,
            sentiment: sentimentAnalysis.sentiment,
            sentimentScore: sentimentAnalysis.score,
            sentimentConfidence: sentimentAnalysis.confidence,
            sentimentDetails: sentimentAnalysis.details,
            timestamp: new Date().toISOString(),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Add to Firestore
        const docRef = await addDoc(
            collection(db, COLLECTIONS.FEEDBACK),
            feedbackDoc
        );

        return {
            success: true,
            id: docRef.id,
            message: 'Feedback submitted successfully!',
            sentiment: sentimentAnalysis
        };
    } catch (error) {
        console.error('Error submitting feedback:', error);
        return {
            success: false,
            message: 'Failed to submit feedback',
            error: error
        };
    }
};

/**
 * Get all feedback (with optional filtering)
 */
export const getAllFeedback = async (filters = {}) => {
    try {
        let q = collection(db, COLLECTIONS.FEEDBACK);
        const constraints = [];

        // Add filters
        if (filters.subject) {
            constraints.push(where('subject', '==', filters.subject));
        }
        if (filters.faculty) {
            constraints.push(where('faculty', '==', filters.faculty));
        }
        if (filters.sentiment) {
            constraints.push(where('sentiment', '==', filters.sentiment));
        }
        if (filters.userId) {
            constraints.push(where('userId', '==', filters.userId));
        }

        // Order by newest first
        constraints.push(orderBy('timestamp', 'desc'));

        // Build query
        const queryConstraints = constraints.length > 0 ? query(q, ...constraints) : q;
        const querySnapshot = await getDocs(queryConstraints);

        const feedbackArray = [];
        querySnapshot.forEach((doc) => {
            feedbackArray.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return {
            success: true,
            data: feedbackArray
        };
    } catch (error) {
        console.error('Error getting feedback:', error);
        return {
            success: false,
            message: 'Failed to retrieve feedback',
            error: error
        };
    }
};

/**
 * Get user's feedback
 */
export const getUserFeedback = async (userId) => {
    try {
        const q = query(
            collection(db, COLLECTIONS.FEEDBACK),
            where('userId', '==', userId),
            orderBy('timestamp', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const feedbackArray = [];

        querySnapshot.forEach((doc) => {
            feedbackArray.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return {
            success: true,
            data: feedbackArray
        };
    } catch (error) {
        console.error('Error getting user feedback:', error);
        return {
            success: false,
            message: 'Failed to retrieve your feedback',
            error: error
        };
    }
};

/**
 * Get feedback statistics
 */
export const getFeedbackStats = async () => {
    try {
        const result = await getAllFeedback();

        if (!result.success) {
            return result;
        }

        const feedbacks = result.data;
        const stats = {
            totalFeedback: feedbacks.length,
            positiveFeedback: 0,
            negativeFeedback: 0,
            neutralFeedback: 0,
            averageRating: 0,
            bySubject: {},
            byFaculty: {},
            byDepartment: {}
        };

        let totalRating = 0;

        feedbacks.forEach(feedback => {
            // Count by sentiment
            if (feedback.sentiment === 'positive') stats.positiveFeedback++;
            else if (feedback.sentiment === 'negative') stats.negativeFeedback++;
            else stats.neutralFeedback++;

            // Calculate average rating
            if (feedback.rating) {
                totalRating += feedback.rating;
            }

            // Count by subject
            if (feedback.subject) {
                stats.bySubject[feedback.subject] = (stats.bySubject[feedback.subject] || 0) + 1;
            }

            // Count by faculty
            if (feedback.faculty) {
                stats.byFaculty[feedback.faculty] = (stats.byFaculty[feedback.faculty] || 0) + 1;
            }

            // Count by department
            if (feedback.department) {
                stats.byDepartment[feedback.department] = (stats.byDepartment[feedback.department] || 0) + 1;
            }
        });

        stats.averageRating = feedbacks.length > 0 ? (totalRating / feedbacks.length).toFixed(2) : 0;

        return {
            success: true,
            data: stats
        };
    } catch (error) {
        console.error('Error getting statistics:', error);
        return {
            success: false,
            message: 'Failed to retrieve statistics',
            error: error
        };
    }
};

/**
 * Get feedback by sentiment
 */
export const getFeedbackBySentiment = async (sentiment) => {
    try {
        const q = query(
            collection(db, COLLECTIONS.FEEDBACK),
            where('sentiment', '==', sentiment),
            orderBy('timestamp', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const feedbackArray = [];

        querySnapshot.forEach((doc) => {
            feedbackArray.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return {
            success: true,
            data: feedbackArray
        };
    } catch (error) {
        console.error('Error getting feedback by sentiment:', error);
        return {
            success: false,
            message: 'Failed to retrieve feedback',
            error: error
        };
    }
};

/**
 * Get feedback by subject
 */
export const getFeedbackBySubject = async (subject) => {
    try {
        const result = await getAllFeedback({ subject });
        return result;
    } catch (error) {
        console.error('Error getting feedback by subject:', error);
        return {
            success: false,
            message: 'Failed to retrieve feedback',
            error: error
        };
    }
};

/**
 * Get feedback by faculty
 */
export const getFeedbackByFaculty = async (faculty) => {
    try {
        const result = await getAllFeedback({ faculty });
        return result;
    } catch (error) {
        console.error('Error getting feedback by faculty:', error);
        return {
            success: false,
            message: 'Failed to retrieve feedback',
            error: error
        };
    }
};

/**
 * Search feedback by student name
 */
export const searchFeedback = async (searchTerm) => {
    try {
        const result = await getAllFeedback();

        if (!result.success) {
            return result;
        }

        const filtered = result.data.filter(feedback =>
            feedback.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            feedback.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            feedback.faculty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            feedback.feedback?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return {
            success: true,
            data: filtered
        };
    } catch (error) {
        console.error('Error searching feedback:', error);
        return {
            success: false,
            message: 'Failed to search feedback',
            error: error
        };
    }
};

/**
 * Delete feedback (admin only)
 */
export const deleteFeedback = async (feedbackId) => {
    try {
        await deleteDoc(doc(db, COLLECTIONS.FEEDBACK, feedbackId));
        
        return {
            success: true,
            message: 'Feedback deleted successfully!'
        };
    } catch (error) {
        console.error('Error deleting feedback:', error);
        return {
            success: false,
            message: 'Failed to delete feedback',
            error: error
        };
    }
};

/**
 * Update feedback
 */
export const updateFeedback = async (feedbackId, updates) => {
    try {
        const feedbackRef = doc(db, COLLECTIONS.FEEDBACK, feedbackId);
        
        // If feedback text is updated, re-analyze sentiment
        if (updates.feedback) {
            const sentimentAnalysis = classifySentiment(updates.feedback);
            updates.sentiment = sentimentAnalysis.sentiment;
            updates.sentimentScore = sentimentAnalysis.score;
            updates.sentimentConfidence = sentimentAnalysis.confidence;
            updates.sentimentDetails = sentimentAnalysis.details;
        }

        updates.updatedAt = new Date();

        await updateDoc(feedbackRef, updates);

        return {
            success: true,
            message: 'Feedback updated successfully!'
        };
    } catch (error) {
        console.error('Error updating feedback:', error);
        return {
            success: false,
            message: 'Failed to update feedback',
            error: error
        };
    }
};

/**
 * Get satisfaction percentage
 */
export const getSatisfactionPercentage = async () => {
    try {
        const stats = await getFeedbackStats();

        if (!stats.success) {
            return stats;
        }

        const total = stats.data.totalFeedback;
        const positive = stats.data.positiveFeedback;
        const percentage = total > 0 ? Math.round((positive / total) * 100) : 0;

        return {
            success: true,
            percentage: percentage,
            total: total,
            positive: positive
        };
    } catch (error) {
        console.error('Error calculating satisfaction:', error);
        return {
            success: false,
            message: 'Failed to calculate satisfaction',
            error: error
        };
    }
};

/**
 * Get trending subjects
 */
export const getTrendingSubjects = async (limit = 5) => {
    try {
        const stats = await getFeedbackStats();

        if (!stats.success) {
            return stats;
        }

        const subjects = Object.entries(stats.data.bySubject)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([subject, count]) => ({ subject, count }));

        return {
            success: true,
            data: subjects
        };
    } catch (error) {
        console.error('Error getting trending subjects:', error);
        return {
            success: false,
            message: 'Failed to get trending subjects',
            error: error
        };
    }
};

console.log('Feedback module loaded');
