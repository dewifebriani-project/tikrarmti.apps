import re

with open("app/api/batches/[id]/route.ts", "r") as f:
    content = f.read()

import_stmt = "import { revalidateTag } from 'next/cache';\n"
if "revalidateTag" not in content:
    content = content.replace("import { NextRequest } from 'next/server'", "import { NextRequest } from 'next/server'\n" + import_stmt)

# Wait, app/api/batches/[id]/route.ts only has GET and PUT? Let's check it first
