import re

with open("app/api/pendaftaran/tikrar/[id]/route.ts", "r") as f:
    content = f.read()

old_role_check = """    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('roles')
      .eq('id', user.id)
      .single();

    const isAdmin = userData?.roles?.includes('admin');"""

new_role_check = """    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('roles')
      .eq('id', user.id)
      .single();

    const roles = userData?.roles || [];
    const isAdmin = roles.some((r: string) => ['admin', 'owner', 'reviewer', 'pengajar'].includes(r));"""

content = content.replace(old_role_check, new_role_check)

with open("app/api/pendaftaran/tikrar/[id]/route.ts", "w") as f:
    f.write(content)
