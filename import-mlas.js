#!/usr/bin/env node

// Bulk MLA Import Script for Track MLA Platform
// Usage: node import-mlas.js

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Initialize Firebase Admin
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT || './firebase-service-account.json';

if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ Error: Firebase service account file not found at:', serviceAccountPath);
    console.error('📌 Please set FIREBASE_SERVICE_ACCOUNT env var or place file at:', serviceAccountPath);
    process.exit(1);
}

try {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
    });
} catch (error) {
    console.error('❌ Error initializing Firebase:', error.message);
    process.exit(1);
}

const db = admin.firestore();

async function importMLAs() {
    try {
        console.log('🚀 Starting MLA Import...\n');

        // Read all-mlas.json
        const mlasPath = './data/all-mlas.json';
        if (!fs.existsSync(mlasPath)) {
            console.error('❌ MLA data file not found at:', mlasPath);
            process.exit(1);
        }

        const mlas = JSON.parse(fs.readFileSync(mlasPath, 'utf8'));
        console.log(`📋 Found ${mlas.length} MLAs to import\n`);

        let successCount = 0;
        let errorCount = 0;
        const batch = db.batch();
        let batchCount = 0;
        const BATCH_SIZE = 100;

        for (let i = 0; i < mlas.length; i++) {
            const mla = mlas[i];

            try {
                const docRef = db.collection('mlas').doc(mla.id);
                batch.set(docRef, {
                    id: mla.id,
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
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });

                batchCount++;
                successCount++;

                // Commit batch every 100 records
                if (batchCount === BATCH_SIZE || i === mlas.length - 1) {
                    await batch.commit();
                    console.log(`✅ Batch committed: ${Math.min(successCount, (Math.floor(i / BATCH_SIZE) + 1) * BATCH_SIZE)}/${mlas.length}`);
                    batchCount = 0;
                }

                // Progress indicator
                if ((i + 1) % 50 === 0) {
                    console.log(`   Processing... ${i + 1}/${mlas.length}`);
                }

            } catch (error) {
                errorCount++;
                console.error(`   ❌ Error importing MLA ${mla.id}:`, error.message);
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log('✨ IMPORT COMPLETE!');
        console.log('='.repeat(50));
        console.log(`✅ Successfully imported: ${successCount}/${mlas.length} MLAs`);
        if (errorCount > 0) {
            console.log(`❌ Failed: ${errorCount} MLAs`);
        }
        console.log('='.repeat(50) + '\n');

        // Display sample data
        console.log('📊 Sample Imported MLAs:');
        console.log('─'.repeat(80));
        mlas.slice(0, 5).forEach(mla => {
            console.log(`  • ${mla.name} (${mla.constituency}, ${mla.party})`);
        });
        console.log('  ...');
        mlas.slice(-5).forEach(mla => {
            console.log(`  • ${mla.name} (${mla.constituency}, ${mla.party})`);
        });
        console.log('─'.repeat(80) + '\n');

        await admin.app().delete();
        console.log('✨ Database connection closed. All done!\n');

    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        process.exit(1);
    }
}

// Run import
importMLAs().catch(error => {
    console.error('❌ Import failed:', error);
    process.exit(1);
});
