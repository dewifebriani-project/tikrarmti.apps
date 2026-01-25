import re

# Read the admin page
with open(r'd:\tikrarmti.apps\app\(protected)\admin\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add the HalaqahManagementTab import
import_section = "import AdminOrphanedUsers from '@/components/AdminOrphanedUsers';"

new_import = """import AdminOrphanedUsers from '@/components/AdminOrphanedUsers';
import { HalaqahManagementTab } from '@/components/HalaqahManagementTab';"""

content = content.replace(import_section, new_import)

# 2. Update the TabType to include 'halaqah'
old_tabtype = "type TabType = 'overview' | 'users' | 'batches' | 'programs' | 'presensi' | 'tikrar' | 'exam-questions' | 'reports';"
new_tabtype = "type TabType = 'overview' | 'users' | 'batches' | 'programs' | 'halaqah' | 'presensi' | 'tikrar' | 'exam-questions' | 'reports';"
content = content.replace(old_tabtype, new_tabtype)

# 3. Add the Halaqah tab to the tabs array (after programs, before presensi)
old_tabs = """    { id: 'programs' as TabType, name: 'Programs', icon: BookOpen },
    { id: 'presensi' as TabType, name: 'Presensi', icon: Clock },"""

new_tabs = """    { id: 'programs' as TabType, name: 'Programs', icon: BookOpen },
    { id: 'halaqah' as TabType, name: 'Halaqah', icon: Users },
    { id: 'presensi' as TabType, name: 'Presensi', icon: Clock },"""

content = content.replace(old_tabs, new_tabs)

# 4. Add the Halaqah tab content rendering (before reports tab)
# Find the reports tab line and add halaqah before it
old_reports_render = "        {activeTab === 'reports' && <ReportsTab />}"
new_halaqah_render = """        {activeTab === 'halaqah' && <HalaqahManagementTab />}
        {activeTab === 'reports' && <ReportsTab />}"""

content = content.replace(old_reports_render, new_halaqah_render)

# Write the updated content back
with open(r'd:\tikrarmti.apps\app\(protected)\admin\page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully added Halaqah tab to admin page")
