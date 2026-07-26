// Firestore Operations
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

// ===== ISSUES =====

// Submit a new issue
export async function submitIssue(issueData) {
  try {
    const docRef = await addDoc(collection(db, "issues"), {
      ...issueData,
      status: "PENDING",
      resolved: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      views: 0,
      supportCount: 0
    });
    return { success: true, id: docRef.id, message: "Issue submitted successfully!" };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Get all approved issues (for leaderboard)
export async function getApprovedIssues(constituency = null, state = null) {
  try {
    let q;
    const constraints = [where("status", "==", "APPROVED")];

    if (constituency) constraints.push(where("constituency", "==", constituency));
    if (state) constraints.push(where("state", "==", state));

    q = query(collection(db, "issues"), ...constraints, orderBy("createdAt", "desc"));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching issues:", error);
    return [];
  }
}

// Get user's issues
export async function getUserIssues(uid) {
  try {
    const q = query(
      collection(db, "issues"),
      where("userId", "==", uid),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching user issues:", error);
    return [];
  }
}

// Get issues by constituency (for MLA stats)
export async function getIssuesByConstituency(constituency) {
  try {
    const q = query(
      collection(db, "issues"),
      where("constituency", "==", constituency),
      where("status", "==", "APPROVED")
    );
    const snapshot = await getDocs(q);
    const issues = snapshot.docs.map(doc => doc.data());

    return {
      total: issues.length,
      resolved: issues.filter(i => i.resolved).length,
      pending: issues.filter(i => !i.resolved).length
    };
  } catch (error) {
    console.error("Error fetching constituency issues:", error);
    return { total: 0, resolved: 0, pending: 0 };
  }
}

// ===== MLA DATA =====

// Add MLA to database
export async function addMLA(mlaData) {
  try {
    const docRef = await addDoc(collection(db, "mlas"), {
      ...mlaData,
      issuesReported: 0,
      issuesResolved: 0,
      score: 0,
      createdAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Get all MLAs
export async function getAllMLAs() {
  try {
    const snapshot = await getDocs(collection(db, "mlas"));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching MLAs:", error);
    return [];
  }
}

// Get MLA by constituency
export async function getMLAByConstituency(constituency) {
  try {
    const q = query(
      collection(db, "mlas"),
      where("constituency", "==", constituency)
    );
    const snapshot = await getDocs(q);
    return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  } catch (error) {
    console.error("Error fetching MLA:", error);
    return null;
  }
}

// Get MLAs by state
export async function getMLAsByState(state) {
  try {
    const q = query(
      collection(db, "mlas"),
      where("state", "==", state)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching MLAs by state:", error);
    return [];
  }
}

// Update MLA stats
export async function updateMLAStats(mlaId) {
  try {
    const mla = await getMLAByConstituency(mlaId);
    if (!mla) return;

    const issues = await getIssuesByConstituency(mla.constituency);
    const resolutionRate = issues.total > 0
      ? Math.round((issues.resolved / issues.total) * 100)
      : 0;

    const docRef = doc(db, "mlas", mlaId);
    await updateDoc(docRef, {
      issuesReported: issues.total,
      issuesResolved: issues.resolved,
      score: resolutionRate,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// ===== LEADERBOARD =====

// Get leaderboard data (all MLAs with stats)
export async function getLeaderboard(state = null) {
  try {
    let mlas = state
      ? await getMLAsByState(state)
      : await getAllMLAs();

    // Sort by score (descending)
    mlas.sort((a, b) => (b.score || 0) - (a.score || 0));

    // Add rank
    return mlas.map((mla, index) => ({
      ...mla,
      rank: index + 1
    }));
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }
}

// ===== MODERATION =====

// Get pending issues (for moderation)
export async function getPendingIssues() {
  try {
    const q = query(
      collection(db, "issues"),
      where("status", "==", "PENDING")
    );
    const snapshot = await getDocs(q);
    const issues = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Sort by createdAt in client (no index needed)
    return issues.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error("Error fetching pending issues:", error);
    return [];
  }
}

// Approve an issue
export async function approveIssue(issueId) {
  try {
    const docRef = doc(db, "issues", issueId);
    await updateDoc(docRef, {
      status: "APPROVED",
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Reject an issue
export async function rejectIssue(issueId, reason) {
  try {
    const docRef = doc(db, "issues", issueId);
    await updateDoc(docRef, {
      status: "REJECTED",
      rejectionReason: reason,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Mark issue as resolved
export async function resolveIssue(issueId) {
  try {
    const docRef = doc(db, "issues", issueId);
    await updateDoc(docRef, {
      resolved: true,
      resolvedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// ===== USER DATA =====

// Update user stats
export async function updateUserStats(uid) {
  try {
    const issues = await getUserIssues(uid);
    const q = query(collection(db, "users"), where("uid", "==", uid));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const userDoc = snapshot.docs[0];
      await updateDoc(userDoc.ref, {
        issuesReported: issues.length,
        updatedAt: serverTimestamp()
      });
    }

    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// ===== HELPER FUNCTIONS =====

// Calculate MLA score based on issues
export function calculateMLAScore(issuesReported, issuesResolved) {
  if (issuesReported === 0) return 0;
  return Math.round((issuesResolved / issuesReported) * 100);
}

// Format date for display
export function formatDate(timestamp) {
  if (!timestamp) return "N/A";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const days = Math.floor((now - date) / (24 * 60 * 60 * 1000));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? 's' : ''} ago`;
}
