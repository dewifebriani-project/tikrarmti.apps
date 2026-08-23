import re

with open('components/dashboard/SitInModal.tsx', 'r') as f:
    content = f.read()

content = content.replace("halaqah_id: halaqahId,", "halaqah_id: halaqahId,\n          target_user_id: user.id,")
content = content.replace("fetch('/api/alumni/sit-in', {\n        method: 'DELETE'", "fetch(`/api/alumni/sit-in?target_user_id=${user.id}`, {\n        method: 'DELETE'")

with open('components/dashboard/SitInModal.tsx', 'w') as f:
    f.write(content)
