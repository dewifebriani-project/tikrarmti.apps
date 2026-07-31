const http = require('http');

http.get('http://localhost:3006/api/admin/analysis/halaqah-availability?batch_id=314b9a7c-63b7-4a11-a83b-9e4860b09339&mode=daftar_ulang&program_tab=semua', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('API Response:', JSON.stringify(parsed).slice(0, 500));
    } catch (e) {
      console.error(e);
      console.log(data.slice(0, 500));
    }
  });
}).on('error', (e) => {
  console.error('Error fetching API:', e);
});
