import os
import glob

files_to_fix = [
    "app/api/exam/submit/route.ts",
    "app/api/exam/start/route.ts",
    "app/api/exam/eligibility/route.ts",
    "app/api/exam/attempts/route.ts",
    "app/api/exam/attempts/[attemptId]/route.ts",
    "app/api/exam/questions/for-user/route.ts",
    "app/api/exam/questions/analytics/route.ts"
]

for filepath in files_to_fix:
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            content = f.read()
        
        # Replace only the ones that we changed
        content = content.replace("status: 'completed'", "status: 'submitted'")
        content = content.replace("status', 'completed'", "status', 'submitted'")
        content = content.replace("status === 'completed'", "status === 'submitted'")
        content = content.replace("status !== 'completed'", "status !== 'submitted'")
        
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Fixed {filepath}")
