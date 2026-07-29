import re
import sys

def main():
    try:
        with open('app/(protected)/daftar-ulang/page.tsx', 'r') as f:
            content = f.read()

        # Remove 'pengabdian' from Step type
        content = re.sub(r"'pengabdian' \| ", "", content)

        # Remove 'pengabdian' from steps arrays
        content = re.sub(r"'pengabdian', ", "", content)
        content = re.sub(r"\{\s*key: 'pengabdian', label: 'Pengabdian'\s*\},\s*", "", content)

        # Remove setCurrentStep('pengabdian')
        content = re.sub(r"setCurrentStep\('pengabdian'\)", "setCurrentStep('akad')", content)

        # Remove pengabdian validation block in handleNext
        validation_block = r"\} else if \(currentStep === 'pengabdian'\) \{.*?setCurrentStep\('akad'\)"
        content = re.sub(validation_block, "", content, flags=re.DOTALL)

        # Remove PengabdianStep render
        render_block = r"\{\s*currentStep === 'pengabdian' && \(\s*<PengabdianStep.*?/>\s*\)\s*\}"
        content = re.sub(render_block, "", content, flags=re.DOTALL)

        # Remove PengabdianStep function completely
        func_block = r"function PengabdianStep\(.*?\}\s*\)\s*\n\}"
        content = re.sub(func_block, "", content, flags=re.DOTALL)

        with open('app/(protected)/daftar-ulang/page.tsx', 'w') as f:
            f.write(content)
        print("Success")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
