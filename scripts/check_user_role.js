const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Basic .env parser
function loadEnv(filePath) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    content.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        process.env[key] = value;
      }
    });
  }
}

loadEnv(path.join(process.cwd(), '.env.local'));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser(email) {
  console.log(`Checking user: ${email}...`);
  
  try {
    // 1. Check public.users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);
      
    if (userError) {
      console.error('Error fetching public.users:', userError.message);
    } else if (userData && userData.length > 0) {
      console.log('--- public.users data ---');
      userData.forEach(u => {
        console.log('ID:', u.id);
        console.log('Role (legacy):', u.role);
        console.log('Roles (array):', u.roles);
      });
    } else {
      console.log('User not found in public.users');
    }

    // 2. Check auth.users
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth.users:', authError.message);
    } else {
      const authUser = users.find(u => u.email === email);
      if (authUser) {
        console.log('--- auth.users profile ---');
        console.log('ID:', authUser.id);
        console.log('App Metadata:', authUser.app_metadata);
        console.log('User Metadata:', authUser.user_metadata);
      } else {
        console.log('User not found in auth.users');
      }
    }
  } catch (err) {
    console.error('Unexpected error:', err.message);
  }
}

const emailToCheck = 'dewifebriani@gmail.com';
checkUser(emailToCheck);
