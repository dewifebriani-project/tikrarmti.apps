async function checkContent() {
  const urls = [
    'https://nmbvklixthlqtkkgqnjl.supabase.co/storage/v1/object/public/selection-audios/5dfde1f0-08fb-4d26-88d1-fc233d6bdec6_alfath29_1782786733602.webm',
    'https://nmbvklixthlqtkkgqnjl.supabase.co/storage/v1/object/public/selection-audios/feedback/3c1509b1-293d-412b-a3ec-14d6c6c2c077-1782918102051.webm'
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url);
      console.log(`URL: ${url}`);
      console.log(`Status: ${response.status}`);
      const text = await response.text();
      console.log(`Content: ${text.substring(0, 500)}`);
      console.log('-----------------------------');
    } catch (e: any) {
      console.error(`Failed for ${url}:`, e.message);
    }
  }
}

checkContent();
