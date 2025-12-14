const supabaseUrl = 'http://localhost:3001';
const testEmail = 'test@example.com';
const testUserId = '00000000-0000-0000-0000-000000000000';

// Test 1: Check if API responds correctly
async function testCheckRegistration() {
  try {
    const response = await fetch(`${supabaseUrl}/api/auth/check-registration-simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: testUserId,
        email: testEmail
      })
    });

    const data = await response.json();
    console.log('Test 1 - Check Registration API:', {
      status: response.status,
      data
    });
  } catch (error) {
    console.error('Test 1 Error:', error);
  }
}

// Test 2: Test the get registration by ID API
async function testGetRegistration(id = '00000000-0000-0000-0000-000000000000') {
  try {
    const response = await fetch(`${supabaseUrl}/api/pendaftaran/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();
    console.log('Test 2 - Get Registration by ID API:', {
      status: response.status,
      data
    });
  } catch (error) {
    console.error('Test 2 Error:', error);
  }
}

// Run tests
testCheckRegistration();
testGetRegistration();