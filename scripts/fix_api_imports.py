import os
import re

# List of files to fix
files_to_fix = [
    r'd:\tikrarmti.apps\app\api\halaqah\route.ts',
    r'd:\tikrarmti.apps\app\api\halaqah\auto-create\route.ts',
    r'd:\tikrarmti.apps\app\api\halaqah\[id]\join\route.ts',
    r'd:\tikrarmti.apps\app\api\halaqah\[id]\leave\route.ts',
    r'd:\tikrarmti.apps\app\api\halaqah\[id]\promote-waitlist\route.ts',
    r'd:\tikrarmti.apps\app\api\halaqah\available-for-thalibah\route.ts',
    r'd:\tikrarmti.apps\app\api\thalibah\eligibility\route.ts',
]

for file_path in files_to_fix:
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        continue

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace the old import with new imports
    old_import = "import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';\nimport { cookies } from 'next/headers';"

    new_import = """import { createServerClient } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase';"""

    if old_import in content:
        content = content.replace(old_import, new_import)

        # Also replace createRouteHandlerClient({ cookies }) with createServerClient()
        content = content.replace('const supabase = createRouteHandlerClient({ cookies });',
                                   'const supabase = createServerClient();')

        # Add supabaseAdmin constant if it doesn't exist and createSupabaseAdmin is imported
        if 'createSupabaseAdmin' in new_import and 'const supabaseAdmin' not in content:
            # Find the export function line and insert supabaseAdmin before it
            export_match = re.search(r'export async function', content)
            if export_match:
                insert_pos = export_match.start()
                content = content[:insert_pos] + 'const supabaseAdmin = createSupabaseAdmin();\n\n' + content[insert_pos:]

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed: {file_path}")
    else:
        print(f"Skipped (no old import found): {file_path}")

print("Done!")
