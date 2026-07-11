import re

with open('app/(protected)/daftar-ulang/page.tsx', 'r') as f:
    content = f.read()

# 1. Update AkadUploadStep call
content = content.replace(
    '''            {currentStep === 'akad' && (
              <AkadUploadStep
                formData={formData}
                onUpload={handleAkadUpload}
                onRemove={handleRemoveAkadFile}
                isLoading={isLoading}
                existingSubmission={existingSubmission}
                reregQuestions={reregQuestions}
              />
            )}''',
    '''            {currentStep === 'akad' && (
              <AkadUploadStep
                formData={formData}
                halaqahData={halaqahData}
                registrationData={registrationData}
                onUpload={handleAkadUpload}
                onRemove={handleRemoveAkadFile}
                isLoading={isLoading}
                existingSubmission={existingSubmission}
                reregQuestions={reregQuestions}
              />
            )}'''
)

# 2. Update AkadUploadStep definition
content = content.replace(
    '''function AkadUploadStep({
  formData,
  onUpload,
  onRemove,
  isLoading,
  existingSubmission,
  reregQuestions
}: {
  formData: any
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemove: (index: number) => void
  isLoading: boolean
  existingSubmission?: any
  reregQuestions: any[]
}) {''',
    '''import { generateAkadPDF } from '@/lib/pdfAkadGenerator'
import { Download } from 'lucide-react'

function AkadUploadStep({
  formData,
  halaqahData,
  registrationData,
  onUpload,
  onRemove,
  isLoading,
  existingSubmission,
  reregQuestions
}: {
  formData: any
  halaqahData: any[]
  registrationData: any
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemove: (index: number) => void
  isLoading: boolean
  existingSubmission?: any
  reregQuestions: any[]
}) {'''
)

# We have an issue: imports at the function level. Let's fix that.
content = content.replace('import { generateAkadPDF } from \'@/lib/pdfAkadGenerator\'\nimport { Download } from \'lucide-react\'\n\nfunction AkadUploadStep', 'function AkadUploadStep')

# Add imports at the top
if 'import { generateAkadPDF }' not in content:
    content = content.replace("import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'", "import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'\nimport { generateAkadPDF } from '@/lib/pdfAkadGenerator'")
if 'Download' not in content:
    content = content.replace("Upload,", "Upload, Download,") # Assuming lucide-react imports exist

with open('app/(protected)/daftar-ulang/page.tsx', 'w') as f:
    f.write(content)
