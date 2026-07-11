import re

with open('components/AnalysisTab.tsx', 'r') as f:
    content = f.read()

# Rename component
content = content.replace('export function AnalysisTab()', 'export function MuallimahAnalysisTab()')

# Common style replacements
replacements = [
    ('rounded-lg shadow', 'rounded-2xl shadow-sm border border-gray-100'),
    ('rounded-md', 'rounded-xl'),
    ('shadow-sm', 'shadow-sm'),
    ('border-gray-200', 'border-gray-100'),
    ('border-gray-300', 'border-gray-200'),
    ('bg-gray-50', 'bg-gray-50/50'),
    ('ring-green-900', 'ring-green-600/20 focus:border-green-600'),
    ('border-green-900', 'border-green-600'),
    ('text-green-900', 'text-green-700'),
    ('bg-green-900', 'bg-green-700'),
    ('hover:bg-green-800', 'hover:bg-green-800'),
    ('bg-white rounded-2xl shadow-sm border border-gray-100 p-4', 'bg-white rounded-3xl shadow-sm border border-gray-100 p-6'),
    ('bg-white rounded-2xl shadow-sm border border-gray-100 p-6', 'bg-white rounded-3xl shadow-sm border border-gray-100 p-6'),
    ('bg-white rounded-2xl shadow-sm border border-gray-100', 'bg-white rounded-3xl shadow-sm border border-gray-100'),
    # Table styling updates
    ('divide-y divide-gray-100', 'divide-y divide-gray-50'),
    ('bg-gray-50/50 text-left', 'bg-gray-50/30 text-left'),
    ('text-xs font-medium text-gray-500 uppercase tracking-wider', 'text-[10px] font-black text-gray-500 uppercase tracking-wider py-4'),
    ('whitespace-nowrap', 'whitespace-nowrap'),
    ('px-6 py-4', 'px-6 py-4'),
    ('px-6 py-3', 'px-6 py-4'),
    ('text-sm text-gray-900', 'text-sm font-medium text-gray-900'),
    ('text-sm text-gray-500', 'text-sm text-gray-500'),
]

for old, new in replacements:
    content = content.replace(old, new)

# Write to new file
with open('components/admin/muallimah-v2/MuallimahAnalysisTab.tsx', 'w') as f:
    f.write(content)

