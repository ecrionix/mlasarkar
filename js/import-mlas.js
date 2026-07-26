// Bulk Import MLAs to Firestore
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

// Import MLA data
export async function importMLAsFromJSON(mlasData) {
  try {
    let successCount = 0;
    let errorCount = 0;

    console.log(`Starting import of ${mlasData.length} MLAs...`);

    for (const mla of mlasData) {
      try {
        // Add to Firestore
        await addDoc(collection(db, "mlas"), {
          name: mla.name,
          constituency: mla.constituency,
          district: mla.district,
          state: mla.state,
          party: mla.party,
          email: mla.email,
          phone: mla.phone,
          issuesReported: mla.issuesReported || 0,
          issuesResolved: mla.issuesResolved || 0,
          score: mla.score || 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        successCount++;
        console.log(`✓ Added: ${mla.name} (${mla.constituency})`);
      } catch (error) {
        errorCount++;
        console.error(`✗ Error adding ${mla.name}:`, error.message);
      }
    }

    console.log(`\n✅ Import Complete!`);
    console.log(`✓ Success: ${successCount}`);
    console.log(`✗ Errors: ${errorCount}`);
    console.log(`Total: ${successCount + errorCount}/${mlasData.length}`);

    return {
      success: true,
      successCount,
      errorCount,
      total: mlasData.length,
      message: `Successfully imported ${successCount}/${mlasData.length} MLAs`
    };
  } catch (error) {
    console.error("Import failed:", error);
    return {
      success: false,
      message: error.message
    };
  }
}

// Usage in browser console:
// import { importMLAsFromJSON } from './js/import-mlas.js';
// fetch('./data/mlas.json')
//   .then(res => res.json())
//   .then(data => importMLAsFromJSON(data))
//   .then(result => console.log(result));
