import DOMPurify from 'dompurify';

// Configuration for DOMPurify
const CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: [],
  ALLOW_DATA_ATTR: false,
};

// Sanitize text input
export function sanitizeText(input: string | null | undefined): string {
  if (!input) return '';

  // Basic string sanitization
  let sanitized = input.trim();

  // Remove any potential script content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');

  return sanitized;
}

// Sanitize HTML content (if needed for rich text)
export function sanitizeHTML(input: string | null | undefined): string {
  if (!input) return '';

  return DOMPurify.sanitize(input, CONFIG);
}

// Validate and sanitize name
export function sanitizeName(input: string | null | undefined): string {
  if (!input) return '';

  const sanitized = sanitizeText(input);

  // Allow only letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\u00C0-\u024F\s\-\'\.]+$/;

  if (!nameRegex.test(sanitized)) {
    throw new Error('Invalid name format');
  }

  // Limit length
  if (sanitized.length > 100) {
    throw new Error('Name too long');
  }

  return sanitized;
}

// Validate and sanitize email
export function sanitizeEmail(input: string | null | undefined): string {
  if (!input) return '';

  const sanitized = sanitizeText(input.toLowerCase());

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format');
  }

  // Limit length
  if (sanitized.length > 254) {
    throw new Error('Email too long');
  }

  return sanitized;
}

// Validate and sanitize phone number (Indonesia format)
export function sanitizePhone(input: string | null | undefined): string {
  if (!input) return '';

  // Remove all non-digit characters except + and -
  let sanitized = input.replace(/[^\d\+\-]/g, '');

  // Convert common formats to +62
  if (sanitized.startsWith('0')) {
    sanitized = '+62' + sanitized.substring(1);
  } else if (sanitized.startsWith('62') && !sanitized.startsWith('+62')) {
    sanitized = '+' + sanitized;
  }

  // Validate Indonesian phone format
  const phoneRegex = /^\+62[1-9]\d{8,12}$/;

  if (!phoneRegex.test(sanitized)) {
    throw new Error('Invalid phone number format');
  }

  return sanitized;
}

// Validate and sanitize address
export function sanitizeAddress(input: string | null | undefined): string {
  if (!input) return '';

  const sanitized = sanitizeText(input);

  // Limit length
  if (sanitized.length > 500) {
    throw new Error('Address too long');
  }

  // Remove any URL or link attempts
  const urlRegex = /https?:\/\/[^\s]+/gi;
  const sanitizedAddress = sanitized.replace(urlRegex, '');

  return sanitizedAddress;
}

// Validate and sanitize city/province
export function sanitizeCity(input: string | null | undefined): string {
  if (!input) return '';

  const sanitized = sanitizeText(input);

  // Limit length
  if (sanitized.length > 100) {
    throw new Error('City name too long');
  }

  // Allow letters, spaces, and common punctuation
  const cityRegex = /^[a-zA-Z\u00C0-\u024F\s\-\.,\(\)]+$/;

  if (!cityRegex.test(sanitized)) {
    throw new Error('Invalid city format');
  }

  return sanitized;
}

// Sanitize UUID
export function sanitizeUUID(input: string | null | undefined): string {
  if (!input) return '';

  const sanitized = sanitizeText(input);

  // UUID v4 regex
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(sanitized)) {
    throw new Error('Invalid UUID format');
  }

  return sanitized;
}

// Sanitize textarea content
export function sanitizeTextarea(input: string | null | undefined): string {
  if (!input) return '';

  const sanitized = sanitizeText(input);

  // Limit length
  if (sanitized.length > 2000) {
    throw new Error('Content too long');
  }

  return sanitized;
}

// Generic sanitization for other fields
export function sanitizeGeneric(input: string | null | undefined, maxLength: number = 255): string {
  if (!input) return '';

  const sanitized = sanitizeText(input);

  if (sanitized.length > maxLength) {
    throw new Error(`Input exceeds maximum length of ${maxLength}`);
  }

  return sanitized;
}