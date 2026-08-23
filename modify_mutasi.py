import re

with open('app/(protected)/admin/mutasi-jadwal/MutasiJadwalClient.tsx', 'r') as f:
    content = f.read()

# Add state
content = content.replace("const [loadingId, setLoadingId] = useState<string | null>(null);", "const [loadingId, setLoadingId] = useState<string | null>(null);\n  const [editingSitInUser, setEditingSitInUser] = useState<any>(null);")

# Add import
if "SitInModal" not in content:
    content = content.replace("import { Card, CardContent } from '@/components/ui/card';", "import { Card, CardContent } from '@/components/ui/card';\nimport { SitInModal } from '@/components/dashboard/SitInModal';")

# Add modal rendering
modal_code = """
      {editingSitInUser && (
        <SitInModal
          isOpen={!!editingSitInUser}
          onClose={() => {
            setEditingSitInUser(null);
            fetchRequests(); // refresh when modal closes
          }}
          user={editingSitInUser.user}
          activeBatch={activeBatch}
          currentHalaqah={editingSitInUser.currentHalaqah}
        />
      )}
    </div>
  );
}
"""
content = re.sub(r"    </div>\n  \);\n}\n$", modal_code, content)

with open('app/(protected)/admin/mutasi-jadwal/MutasiJadwalClient.tsx', 'w') as f:
    f.write(content)
