const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3003,
  path: '/api/batch/default/',  // Added trailing slash
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  }
};

console.log('Testing API: http://localhost:3003/api/batch/default\n');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', JSON.stringify(res.headers, null, 2));
    console.log('\nResponse Body:');

    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));

      // Verify the important fields
      console.log('\n✅ Key Fields:');
      console.log('  - is_free:', json.is_free);
      console.log('  - price:', json.price);
      console.log('  - total_quota:', json.total_quota);
      console.log('  - registered_count:', json.registered_count);
      console.log('  - scholarship_quota:', json.scholarship_quota);
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.end();
