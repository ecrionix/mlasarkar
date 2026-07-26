// Authentication Functions
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-functions.js";
import { auth, db } from "./firebase-config.js";

// Send verification email (Firebase built-in)
export async function sendVerificationEmail(user) {
  try {
    await sendEmailVerification(user);
    return { success: true, message: "Verification email sent!" };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Sign Up Function
export async function signUp(email, password, name, phone, state, constituency) {
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;
    const user = userCredential.user;

    // Send verification email
    await sendEmailVerification(user);

    // Add user data to Firestore
    await addDoc(collection(db, "users"), {
      uid: uid,
      email: email,
      name: name,
      phone: phone,
      state: state,
      constituency: constituency,
      createdAt: new Date(),
      issuesReported: 0,
      isPremium: false,
      emailVerified: false
    });

    return { success: true, uid: uid, message: "Account created! Check your email to verify." };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Sign In Function
export async function signIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, uid: userCredential.user.uid, message: "Login successful!" };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Sign Out Function
export async function logOut() {
  try {
    await signOut(auth);
    return { success: true, message: "Logged out successfully!" };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Get Current User
export function getCurrentUser() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      resolve(user);
    });
  });
}

// Get User Data from Firestore
export async function getUserData(uid) {
  try {
    const q = query(collection(db, "users"), where("uid", "==", uid));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    return querySnapshot.docs[0].data();
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
}

// Check if user is authenticated
export async function isUserAuthenticated() {
  const user = await getCurrentUser();
  return user !== null;
}
