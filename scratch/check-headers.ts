async function checkHeaders() {
  const urls = [
    'https://nmbvklixthlqtkkgqnjl.supabase.co/storage/v1/object/public/selection-audios/5dfde1f0-08fb-4d26-88d1-fc233d6bdec6_alfath29_1782786733602.webm',
    'https://nmbvklixthlqtkkgqnjl.supabase.co/storage/v1/object/public/selection-audios/feedback/3c1509b1-293d-412b-a3ec-14d6c6c2c077-1782918102051.webm'
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      console.log(`URL: ${url}`);
      console.log(`Status: ${response.status}`);
      console.log(`Content-Type: ${response.headers.get('content-type')}`);
      console.log(`Content-Length: ${response.headers.get('content-length')}`);
      console.log('-----------------------------');
    } catch (e: any) {
      console.error(`Failed for ${url}:`, e.message);
    }
  }
}

checkHeaders();
