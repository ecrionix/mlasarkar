// Firebase SDK Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBD-leq-vEuTOHliamgJcX1unUYSVIlXa0",
  authDomain: "mlasarkar.firebaseapp.com",
  projectId: "mlasarkar",
  storageBucket: "mlasarkar.firebasestorage.app",
  messagingSenderId: "694345100091",
  appId: "1:694345100091:web:9c68505a4e37cab801251e",
  measurementId: "G-T4Y2T0M6N0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
