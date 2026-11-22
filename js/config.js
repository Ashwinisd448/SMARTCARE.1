/**
 * SMARTCARE – Firebase Configuration & Initialization
 * 
 * Instructions for Beginners:
 * 1. Go to https://console.firebase.google.com/
 * 2. Create a new project called "smartcare" (or your preferred name).
 * 3. In Project Settings > General, scroll down to "Your apps" and click the Web icon (</>).
 * 4. Copy the firebaseConfig values and replace the placeholder values below.
 * 5. Enable Phone Authentication:
 *    - Go to Authentication > Sign-in method > Phone > Enable.
 *    - (Optional & Recommended for testing): Add Phone numbers for testing (e.g. +91 9876543210 with OTP 123456)
 *      so SMS is free and instant without using your quota!
 * 6. Enable Cloud Firestore:
 *    - Go to Firestore Database > Create Database > Start in test mode.
 * 7. If you leave the keys below as "YOUR_API_KEY", SMARTCARE will automatically run in
 *    "Demo Mode" with rich interactive mock data so you can test all features immediately!
 */

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  // Web Push Certificate Key pair (VAPID Key) for Firebase Cloud Messaging
  vapidKey: "YOUR_PUBLIC_VAPID_KEY"
};

// Google Maps API Configuration
const googleMapsConfig = {
  apiKey: localStorage.getItem('smartcare_gmaps_api_key') || "YOUR_GOOGLE_MAPS_API_KEY",
  defaultCenter: { lat: 12.9716, lng: 77.5946 }, // Bengaluru, Karnataka (default reference center)
  defaultZoom: 12,
  libraries: ["places", "geometry"]
};

// Check if live Firebase is configured with real credentials
function isFirebaseConfigured() {
  return firebaseConfig.apiKey && 
         firebaseConfig.apiKey !== "YOUR_API_KEY" && 
         firebaseConfig.projectId !== "YOUR_PROJECT_ID";
}

// Check if a real Google Maps API key is configured
function isGoogleMapsConfigured() {
  const key = localStorage.getItem('smartcare_gmaps_api_key') || googleMapsConfig.apiKey;
  return key && key !== "YOUR_GOOGLE_MAPS_API_KEY" && key.trim().length > 15;
}

let firebaseApp = null;
let firebaseAuth = null;
let firestoreDb = null;
let firebaseMessaging = null;

if (isFirebaseConfigured() && typeof firebase !== 'undefined') {
  try {
    firebaseApp = firebase.initializeApp(firebaseConfig);
    firebaseAuth = firebase.auth();
    firestoreDb = firebase.firestore();
    
    // Enable offline persistence in Firestore for smooth offline experience
    firestoreDb.enablePersistence().catch((err) => {
      if (err.code == 'failed-precondition') {
        console.warn('Firestore persistence failed: Multiple tabs open.');
      } else if (err.code == 'unimplemented') {
        console.warn('Firestore persistence not supported in this browser.');
      }
    });

    if (firebase.messaging && firebase.messaging.isSupported()) {
      firebaseMessaging = firebase.messaging();
    }
    console.log('%c[SMARTCARE] Live Firebase Connected Successfully!', 'color: #10b981; font-weight: bold;');
  } catch (error) {
    console.error('[SMARTCARE] Firebase Initialization Error:', error);
  }
} else {
  console.log('%c[SMARTCARE] Running in Demo Mode (Mock Data Active)', 'color: #0284c7; font-weight: bold;');
}

window.SMARTCARE_CONFIG = {
  firebaseConfig,
  googleMapsConfig,
  isFirebaseConfigured,
  isGoogleMapsConfigured,
  getGoogleMapsApiKey: () => localStorage.getItem('smartcare_gmaps_api_key') || googleMapsConfig.apiKey,
  setGoogleMapsApiKey: (key) => {
    localStorage.setItem('smartcare_gmaps_api_key', key.trim());
    googleMapsConfig.apiKey = key.trim();
  },
  getApp: () => firebaseApp,
  getAuth: () => firebaseAuth,
  getDb: () => firestoreDb,
  getMessaging: () => firebaseMessaging
};
