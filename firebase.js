// firebase.js - Autrobook
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyBkT_BYBUagMck5z0bLSVRsL_uJs9KUaJI",
  authDomain: "autrobook-ad3d5.firebaseapp.com",
  projectId: "autrobook-ad3d5",
  storageBucket: "autrobook-ad3d5.firebasestorage.app",
  messagingSenderId: "554222945815",
  appId: "1:554222945815:web:0ba445f3f6ee6de6f1fe52",
  measurementId: "G-Z8QM0NVR6W"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
