// ====================================
// FIREBASE CONFIG & INITIALIZATION
// ====================================

// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore, connectFirestoreEmulator } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { getStorage, connectStorageEmulator } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js";

// Firebase Configuration - REPLACE WITH YOUR CONFIG
 const firebaseConfig = {
    apiKey: "AIzaSyArF0UYLK-1LiLmG4PTfTlKqWHSaZpeylo",
    authDomain: "sesa-webapp.firebaseapp.com",
    projectId: "sesa-webapp",
    storageBucket: "sesa-webapp.firebasestorage.app",
    messagingSenderId: "656007409420",
    appId: "1:656007409420:web:29d76ab3d3743bf588a329",
    measurementId: "G-RW2VXVSN4D"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore
export const db = getFirestore(app);

// Initialize Cloud Storage
export const storage = getStorage(app);

// Enable emulator for local development (optional - comment out for production)
// connectAuthEmulator(auth, "http://localhost:9099");
// connectFirestoreEmulator(db, 'localhost', 8080);
// connectStorageEmulator(storage, "http://localhost:9199");

export default app;

// ====================================
// FIRESTORE COLLECTION REFERENCES
// ====================================

export const COLLECTIONS = {
    USERS: 'users',
    FEEDBACK: 'feedback',
    ANALYTICS: 'analytics'
};

// Default user role
export const USER_ROLES = {
    STUDENT: 'student',
    ADMIN: 'admin'
};

console.log('Firebase initialized successfully');
