const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', '(protected)', 'pilih-pasangan', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const selfMatchSearchStart = "              {formData.partner_type === 'self_match' && (";
const duplicateFamilyStart = "              {formData.partner_type === 'family' && (";
const duplicateTarteelStart = "              {formData.partner_type === 'tarteel' && (";
const actionButtonsStart = "              <div className=\"flex justify-between pt-6 border-t\">";

const selfMatchSearchIndex = content.indexOf(selfMatchSearchStart);
const duplicateFamilyIndex = content.lastIndexOf(duplicateFamilyStart); // There are two of these! We want the last one.
const actionButtonsIndex = content.indexOf(actionButtonsStart);

if (selfMatchSearchIndex === -1 || duplicateFamilyIndex === -1 || actionButtonsIndex === -1) {
  console.log("Could not find blocks");
  process.exit(1);
}

// 1. Extract the "Cari Pasangan" block
const selfMatchBlock = content.substring(selfMatchSearchIndex, duplicateFamilyIndex);

// 2. Remove "Cari Pasangan" + duplicate "Family" + duplicate "Tarteel" from the bottom
// We'll remove everything from selfMatchSearchIndex up to actionButtonsIndex
const chunkToRemove = content.substring(selfMatchSearchIndex, actionButtonsIndex);
let newContent = content.replace(chunkToRemove, "");

// 3. Insert the "Cari Pasangan" block inside the Self Match option box
const selfMatchOptionHtml = `
                {/* Self Match */}
                <div
                  className={\`border rounded-lg p-4 cursor-pointer transition-all \${
                    formData.partner_type === 'self_match'
                      ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-500'
                      : 'border-gray-200 hover:border-gray-300'
                  }\`}
                  onClick={() => setFormData(p => ({ ...p, partner_type: 'self_match', partner_user_id: '', partner_name: '', partner_relationship: '', partner_wa_phone: '', partner_notes: '' }))}
                >
                  <div className="flex items-start space-x-3">
                    <Users className="w-6 h-6 text-purple-600 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">Memilih Sendiri</h3>
                      <p className="text-sm text-gray-500 mt-1">Cari dan pilih pasangan dari daftar peserta yang tersedia dan cocok dengan Anda.</p>
                    </div>
                    <input
                      type="radio"
                      checked={formData.partner_type === 'self_match'}
                      readOnly
                      className="w-5 h-5 text-purple-600 mt-2"
                    />
                  </div>
                </div>`;

const modifiedSelfMatchOptionHtml = `
                {/* Self Match */}
                <div
                  className={\`border rounded-lg p-4 cursor-pointer transition-all \${
                    formData.partner_type === 'self_match'
                      ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-500'
                      : 'border-gray-200 hover:border-gray-300'
                  }\`}
                  onClick={() => setFormData(p => ({ ...p, partner_type: 'self_match', partner_user_id: '', partner_name: '', partner_relationship: '', partner_wa_phone: '', partner_notes: '' }))}
                >
                  <div className="flex items-start space-x-3">
                    <Users className="w-6 h-6 text-purple-600 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">Memilih Sendiri</h3>
                      <p className="text-sm text-gray-500 mt-1">Cari dan pilih pasangan dari daftar peserta yang tersedia dan cocok dengan Anda.</p>
                    </div>
                    <input
                      type="radio"
                      checked={formData.partner_type === 'self_match'}
                      readOnly
                      className="w-5 h-5 text-purple-600 mt-2"
                    />
                  </div>

                  {formData.partner_type === 'self_match' && (
                    <div className="mt-4">
${selfMatchBlock.substring(selfMatchBlock.indexOf('                <div className="bg-purple-50')).replace(/}$/, '                  }\n')}
                </div>`;

// Wait, selfMatchBlock string starts with:
/*
              {formData.partner_type === 'self_match' && (
                <div className="bg-purple-50 rounded-lg p-5 border border-purple-100">
*/
// It ends with:
/*
                </div>
              )}
*/
// Because I'm pasting it exactly as-is, I can just append the inner part or the whole block.
// Since it's already got the {formData.partner_type === 'self_match' && ( ... )} wrapper, let's just stick it directly inside the div!
// Yes, just put `selfMatchBlock` right before the closing `</div>` of the Self Match option box!

const selfMatchEndString = `className="w-5 h-5 text-purple-600 mt-2"
                    />
                  </div>
                </div>`;

// Oh wait, `selfMatchBlock` has its own `formData.partner_type === 'self_match' && (` inside it! So it works perfectly if pasted there. But wait, it's inside another `div`, so we don't need the `{formData.partner_type === 'self_match' && (` wrapper again if we just strip it.
// Actually, it's safer to just paste the whole `selfMatchBlock` exactly as is right before the `</div>`.

const newSelfMatchEndString = `className="w-5 h-5 text-purple-600 mt-2"
                    />
                  </div>
${selfMatchBlock}                </div>`;

newContent = newContent.replace(selfMatchEndString, newSelfMatchEndString);

fs.writeFileSync(filePath, newContent);
console.log("Successfully moved block!");

