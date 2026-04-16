require('dotenv').config({ path: '.env.local' });

const headers = {
  apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
  Prefer: 'count=exact'
};
fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/users?select=id,full_name&limit=2&offset=0`, { headers })
  .then(res => res.text())
  .then(text => require('fs').writeFileSync('users.json', text));
