#!/usr/bin/env node

/**
 * Script to reset QR counter to sync with database
 * Run this in the browser console or as a Node.js script
 */

const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function resetQRCounter() {
  try {
    console.log('🔍 Checking database for latest QR-ID...');
    
    const sql = neon(process.env.DATABASE_URL);
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Get the latest request ID from the requests table
    const result = await sql`
      SELECT request_id 
      FROM requests 
      ORDER BY CAST(SUBSTRING(request_id FROM 4) AS INTEGER) DESC 
      LIMIT 1
    `;
    
    if (result.length === 0) {
      console.log('✅ No existing requests found. Counter can start at 2.');
      return 2;
    }
    
    const latestId = result[0].request_id;
    const latestNumber = parseInt(latestId.replace('QR-', ''));
    
    console.log(`📊 Latest QR-ID in database: ${latestId} (number: ${latestNumber})`);
    console.log(`🔄 Next QR-ID should be: QR-${(latestNumber + 1).toString().padStart(3, '0')}`);
    
    return latestNumber + 1;
    
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
    return 2; // Default fallback
  }
}

// If running as Node.js script
if (typeof window === 'undefined') {
  resetQRCounter().then(nextNumber => {
    console.log(`\n💡 To reset your localStorage counter, run this in your browser console:`);
    console.log(`localStorage.setItem('qr_counter_${process.env.NODE_ENV === 'development' ? 'dev' : 'prod'}', '${nextNumber - 1}');`);
    console.log(`\nOr visit: http://localhost:3000 and run:`);
    console.log(`window.resetQRCounter(${nextNumber});`);
  });
}

// Export for browser use
if (typeof window !== 'undefined') {
  window.resetQRCounter = function(targetNumber) {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const counterKey = isDevelopment ? 'qr_counter_dev' : 'qr_counter_prod';
    localStorage.setItem(counterKey, (targetNumber - 1).toString());
    console.log(`✅ QR counter reset to ${targetNumber - 1}. Next ID will be QR-${targetNumber.toString().padStart(3, '0')}`);
  };
}
