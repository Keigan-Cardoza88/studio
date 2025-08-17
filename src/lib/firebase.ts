
// This file is currently not used for any core functionality,
// but is kept for potential future use with Firebase services.
// The app is currently configured to be a fully static application.

import { initializeApp, getApp, getApps } from 'firebase/app';

// This is a placeholder config.
// For any real Firebase integration, you would replace this with your actual project's config.
const firebaseConfig = {
  "projectId": "readysetplay-20",
  "appId": "1:677798802932:web:096ababc454659451b75a1",
  "storageBucket": "readysetplay-20.firebasestorage.app",
  "apiKey": "AIzaSyAu_OCOZYUtrmqXtVfBn9WxSNTbChPvIkY",
  "authDomain": "readysetplay-20.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "677798802932"
};


// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export { app };
