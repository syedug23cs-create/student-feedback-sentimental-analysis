// ====================================
// AUTHENTICATION MODULE
// ====================================

import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut,
    setPersistence,
    browserLocalPersistence,
    sendPasswordResetEmail,
    updateProfile,
    onAuthStateChanged,
    createUserWithEmailAndPassword as createUser
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { auth, db, COLLECTIONS, USER_ROLES } from './firebase.js';

// ====================================
// FORM VALIDATION
// ====================================

export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

export const validatePassword = (password) => {
    return password.length >= 6;
};

export const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;
    
    if (strength === 0) return 'weak';
    if (strength <= 2) return 'fair';
    return 'strong';
};

// ====================================
// AUTHENTICATION FUNCTIONS
// ====================================

/**
 * Register a new user
 */
export const registerUser = async (email, password, fullName) => {
    try {
        // Enable persistence
        await setPersistence(auth, browserLocalPersistence);
        
        // Create user account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update user profile
        await updateProfile(user, {
            displayName: fullName
        });
        
        // Save user data to Firestore
        await setDoc(doc(db, COLLECTIONS.USERS, user.uid), {
            uid: user.uid,
            email: email,
            fullName: fullName,
            role: USER_ROLES.STUDENT,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            department: '',
            studentId: '',
            photoURL: null
        });
        
        return {
            success: true,
            user: user,
            message: 'Registration successful!'
        };
    } catch (error) {
        console.error('Registration error:', error);
        return {
            success: false,
            message: getAuthErrorMessage(error.code),
            error: error
        };
    }
};

/**
 * Login user
 */
export const loginUser = async (email, password) => {
    try {
        // Enable persistence
        await setPersistence(auth, browserLocalPersistence);
        
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return {
            success: true,
            user: userCredential.user,
            message: 'Login successful!'
        };
    } catch (error) {
        console.error('Login error:', error);
        return {
            success: false,
            message: getAuthErrorMessage(error.code),
            error: error
        };
    }
};

/**
 * Logout user
 */
export const logoutUser = async () => {
    try {
        await signOut(auth);
        return {
            success: true,
            message: 'Logout successful!'
        };
    } catch (error) {
        console.error('Logout error:', error);
        return {
            success: false,
            message: 'Failed to logout',
            error: error
        };
    }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email) => {
    try {
        await sendPasswordResetEmail(auth, email);
        return {
            success: true,
            message: 'Password reset email sent! Check your inbox.'
        };
    } catch (error) {
        console.error('Password reset error:', error);
        return {
            success: false,
            message: getAuthErrorMessage(error.code),
            error: error
        };
    }
};

/**
 * Get current user
 */
export const getCurrentUser = () => {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            unsubscribe();
            if (user) {
                try {
                    // Fetch user data from Firestore
                    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
                    resolve({
                        ...user,
                        userRole: userDoc.exists() ? userDoc.data().role : USER_ROLES.STUDENT
                    });
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    resolve(user);
                }
            } else {
                resolve(null);
            }
        });
    });
};

/**
 * Update user profile
 */
export const updateUserProfile = async (uid, updates) => {
    try {
        const userRef = doc(db, COLLECTIONS.USERS, uid);
        await setDoc(userRef, {
            ...updates,
            updatedAt: new Date().toISOString()
        }, { merge: true });
        
        return {
            success: true,
            message: 'Profile updated successfully!'
        };
    } catch (error) {
        console.error('Profile update error:', error);
        return {
            success: false,
            message: 'Failed to update profile',
            error: error
        };
    }
};

/**
 * Check if user is admin
 */
export const isAdmin = async (uid) => {
    try {
        const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, uid));
        return userDoc.exists() && userDoc.data().role === USER_ROLES.ADMIN;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
};

// ====================================
// ERROR MESSAGE MAPPING
// ====================================

const getAuthErrorMessage = (errorCode) => {
    const errorMessages = {
        'auth/user-not-found': 'User not found. Please check your email.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/user-disabled': 'This user account is disabled.',
        'auth/email-already-in-use': 'This email is already registered.',
        'auth/weak-password': 'Password should be at least 6 characters.',
        'auth/operation-not-allowed': 'Operation not allowed. Please contact support.',
        'auth/auth-domain-config-required': 'Auth domain is not configured properly.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
        'auth/invalid-credential': 'Invalid credentials provided.',
        'auth/too-many-requests': 'Too many failed login attempts. Please try again later.'
    };
    
    return errorMessages[errorCode] || 'An authentication error occurred. Please try again.';
};

// ====================================
// AUTH STATE LISTENER
// ====================================

export const subscribeToAuthChanges = (callback) => {
    return onAuthStateChanged(auth, callback);
};
