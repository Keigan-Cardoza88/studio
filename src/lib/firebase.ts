
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  "projectId": "readysetplay-20",
  "appId": "1:677798802932:web:096ababc454659451b75a1",
  "storageBucket": "readysetplay-20.firebasestorage.app",
  "apiKey": "AIzaSyAu_OCOZYUtrmqXtVfBn9WxSNTbChPvIkY",
  "authDomain": "readysetplay-20.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "677798802932"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
