import re

with open('components/admin/muallimah-v2/MuallimahAnalysisTab.tsx', 'r') as f:
    content = f.read()

# remove interface MatchingAnalysis
content = re.sub(r"interface MatchingAnalysis \{.*?\}\n\n", "", content, flags=re.DOTALL)

# remove the button block manually
button_block = """        <button
          onClick={() => { setActiveTab('matching'); setLoading(true); }}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'matching'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Matching Pasangan
        </button>"""

button_block_2 = """        <button
          onClick={() => { setActiveTab('matching'); setLoading(true); }}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'matching'
              ? 'border-green-600 text-green-700'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Matching Pasangan
        </button>"""

content = content.replace(button_block, "")
content = content.replace(button_block_2, "")

with open('components/admin/muallimah-v2/MuallimahAnalysisTab.tsx', 'w') as f:
    f.write(content)
