import re

with open("app/(protected)/daftar-ulang/page.tsx", "r") as f:
    content = f.read()

content = content.replace("user?.user_metadata", "(user as any)?.user_metadata")

with open("app/(protected)/daftar-ulang/page.tsx", "w") as f:
    f.write(content)
