import os

filepath = "app/(protected)/seleksi/kuis-akad/page.tsx"
with open(filepath, 'r') as f:
    content = f.read()

# We need to insert useEffect for autosave after the answers state declaration
state_declaration = "const [answers, setAnswers] = useState<Record<string, string>>({});"
autosave_code = """
  // Load autosaved answers on mount
  useEffect(() => {
    const saved = localStorage.getItem('akadQuizAutosave');
    if (saved) {
      try {
        setAnswers(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse autosave', e);
      }
    }
  }, []);

  // Autosave when answers change
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem('akadQuizAutosave', JSON.stringify(answers));
    }
  }, [answers]);
"""

# Insert autosave code
if "akadQuizAutosave" not in content:
    content = content.replace(state_declaration, state_declaration + "\n" + autosave_code)

# Clear autosave when passed
if "localStorage.removeItem('akadQuizAutosave');" not in content:
    content = content.replace(
        "setHasPassed(true);\n        toast.success('Selamat! Anda lulus Kuis Pemahaman Akad!');",
        "setHasPassed(true);\n        localStorage.removeItem('akadQuizAutosave');\n        toast.success('Selamat! Anda lulus Kuis Pemahaman Akad!');"
    )

with open(filepath, 'w') as f:
    f.write(content)
print("Patched kuis-akad/page.tsx with autosave")
