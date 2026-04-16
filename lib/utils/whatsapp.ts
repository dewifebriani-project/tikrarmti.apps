/**
 * Clean phone number: remove +62, spaces, dashes, parentheses
 */
export function cleanPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return '';
  
  let clean = phoneNumber.replace(/\D/g, '');

  // Convert to international format if starts with 0
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  }

  return clean;
}

/**
 * Generate WhatsApp URL with optional message
 */
export function getWhatsAppUrl(phoneNumber: string, name?: string, customMessage?: string): string {
  const cleanPhone = cleanPhoneNumber(phoneNumber);
  if (!cleanPhone) return '';

  const displayName = name || 'Thalibah';
  const message = customMessage || `Assalamu'alaikum ${displayName},\n\nIni adalah pesan dari admin Markaz Tikrar Indonesia terkait pendaftaran Program Tikrar Tahfidz MTI.\n\nJazakillahu khairan`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * Common Button Style for WhatsApp
 */
export const WHATSAPP_BTN_CLASS = "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl hover:bg-emerald-100 hover:border-emerald-200 transition-all shadow-sm";
