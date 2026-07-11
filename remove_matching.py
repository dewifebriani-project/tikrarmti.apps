import re

with open('components/admin/muallimah-v2/MuallimahAnalysisTab.tsx', 'r') as f:
    content = f.read()

# 1. Change type
content = re.sub(r"type AnalysisTabType = 'overview' \| 'matching';", "type AnalysisTabType = 'overview';", content)

# 2. Remove matchingData state
content = re.sub(r"  const \[matchingData, setMatchingData\] = useState<MatchingAnalysis\[\]>\(\[\]\);\n", "", content)

# 3. Remove else if for matching in useEffect
content = re.sub(r"      } else if \(activeTab === 'matching'\) \{\n        loadMatchingAnalysis\(selectedBatchId\);\n      \}\n", "      }\n", content)

# 4. Remove loadMatchingAnalysis function
# It starts with `const loadMatchingAnalysis` and ends before `return (` or something similar.
content = re.sub(r"  const loadMatchingAnalysis = async \(batchId: string\) => \{.*?  \};\n\n", "", content, flags=re.DOTALL)

# 5. Remove loading matching text block
#   if (loading && matchingData.length === 0 && activeTab === 'matching') { ... }
content = re.sub(r"  if \(loading && matchingData\.length === 0 && activeTab === 'matching'\) \{.*?  \}\n\n", "", content, flags=re.DOTALL)

# 6. Change subtitle text
content = content.replace("Analisis kecukupan muallimah, matching pasangan belajar, dan ketersediaan halaqah", "Analisis kecukupan muallimah dan ketersediaan halaqah")

# 7. Remove the Tab Nav for Matching
#         <button
#           onClick={() => { setActiveTab('matching'); setLoading(true); }}
#           className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
#             activeTab === 'matching'
#               ? 'border-green-600 text-green-700'
#               : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
#           }`}
#         >
#           Matching Pasangan
#         </button>
content = re.sub(r"        <button\n          onClick=\{.*?setActiveTab\('matching'\).*?</button>\n", "", content, flags=re.DOTALL)

# 8. Remove the content block for matching
#       {activeTab === 'matching' && (
#         <> ... </>
#       )}
content = re.sub(r"      \{activeTab === 'matching' && \(\n        <>\n.*?        </>\n      \)\}\n\n", "", content, flags=re.DOTALL)

with open('components/admin/muallimah-v2/MuallimahAnalysisTab.tsx', 'w') as f:
    f.write(content)

