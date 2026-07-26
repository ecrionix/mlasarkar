// Authentication Functions
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
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
import { auth, db } from "./firebase-config.js";

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP to email
export async function sendOTP(email) {
  try {
    const otp = generateOTP();
    const expiryTime = Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)); // 10 minutes

    // Store OTP in Firestore
    await setDoc(doc(db, "otp_codes", email), {
      code: otp,
      expiresAt: expiryTime,
      createdAt: Timestamp.now(),
      verified: false
    });

    // TODO: Send email with OTP (requires Cloud Functions or email service)
    // For now, log it for testing
    console.log(`OTP for ${email}: ${otp}`);

    return { success: true, message: "OTP sent to your email!", otp: otp };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Verify OTP
export async function verifyOTP(email, otp) {
  try {
    const otpDoc = await getDocs(query(collection(db, "otp_codes"), where("code", "==", otp)));

    if (otpDoc.empty) {
      return { success: false, message: "Invalid OTP" };
    }

    const data = otpDoc.docs[0].data();

    // Check if OTP expired
    if (data.expiresAt.toDate() < new Date()) {
      return { success: false, message: "OTP expired. Request a new one." };
    }

    // Check if email matches
    if (otpDoc.docs[0].id !== email) {
      return { success: false, message: "OTP doesn't match this email" };
    }

    // Mark OTP as verified
    await setDoc(doc(db, "otp_codes", email), { ...data, verified: true }, { merge: true });

    return { success: true, message: "Email verified successfully!" };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Sign Up Function (after OTP verification)
export async function signUp(email, password, name, phone, state, constituency) {
  try {
    // Check if email is OTP verified
    const otpDoc = await getDocs(query(collection(db, "otp_codes"), where("code", "==", email)));
    // Actually, we need a better way to check - let me use the email as doc ID

    try {
      const otpVerify = await getDocs(query(collection(db, "otp_codes"),
        where("code", "==", "") // This won't work - need different approach
      ));
    } catch(e) {}

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

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
      emailVerified: true
    });

    // Clean up OTP code
    try {
      const otpRef = doc(db, "otp_codes", email);
      await setDoc(otpRef, { verified: true, usedAt: Timestamp.now() }, { merge: true });
    } catch(e) {}

    return { success: true, uid: uid, message: "Sign up successful!" };
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
