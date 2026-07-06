import re
import os

if os.path.exists('types/supabase.ts'):
    with open('types/supabase.ts', 'r') as f:
        content = f.read()
    
    if 'needs_revision' not in content:
        # Add to Row
        content = re.sub(
            r"(pendaftaran_tikrar_tahfidz:\s*\{\s*Row:\s*\{[^\}]*)(\s*\})",
            r"\1\n          needs_revision: boolean | null\2",
            content
        )
        # Add to Insert
        content = re.sub(
            r"(pendaftaran_tikrar_tahfidz:\s*\{\s*Row:\s*\{.*?\}\s*Insert:\s*\{[^\}]*)(\s*\})",
            r"\1\n          needs_revision?: boolean | null\2",
            content,
            flags=re.DOTALL
        )
        # Add to Update
        content = re.sub(
            r"(pendaftaran_tikrar_tahfidz:\s*\{\s*Row:\s*\{.*?\}\s*Insert:\s*\{.*?\}\s*Update:\s*\{[^\}]*)(\s*\})",
            r"\1\n          needs_revision?: boolean | null\2",
            content,
            flags=re.DOTALL
        )
        
        with open('types/supabase.ts', 'w') as f:
            f.write(content)
