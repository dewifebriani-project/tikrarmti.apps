/**
 * Test script to verify musyrifah jurnal API response
 * Run: node scripts/test-api-response.js
 */

const fetch = require('node-fetch');

async function testAPI() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  console.log('Testing musyrifah jurnal API...');
  console.log('URL:', `${baseUrl}/api/musyrifah/jurnal`);
  console.log('');

  try {
    // This would require auth - just showing what to check
    console.log('Manual test needed:');
    console.log('1. Open browser DevTools (F12)');
    console.log('2. Go to Network tab');
    console.log('3. Navigate to /panel-musyrifah');
    console.log('4. Find the API call to /api/musyrifah/jurnal');
    console.log('5. Check the response for weekly_status');
    console.log('');
    console.log('Expected response for Aam Ummu Rifki (Juz 30A):');
    console.log('  weekly_status[0].week_number = 1, completed_blocks = 4');
    console.log('  weekly_status[0].blocks = H1A, H1B, H1C, H1D');
    console.log('  weekly_status[1].week_number = 2, completed_blocks = 4');
    console.log('  weekly_status[1].blocks = H2A, H2B, H2C, H2D');
    console.log('  weekly_status[2].week_number = 3, completed_blocks = 4');
    console.log('  weekly_status[2].blocks = H3A, H3B, H3C, H3D');
    console.log('  weekly_status[3].week_number = 4, completed_blocks = 4');
    console.log('  weekly_status[3].blocks = H4A, H4B, H4C, H4D');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();
