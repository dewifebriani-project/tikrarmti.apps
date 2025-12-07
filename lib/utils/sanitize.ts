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

import { countryCodes } from '@/lib/data/country-codes';

export function sanitizePhone(input: string | null | undefined, countryCode?: string): string {
  if (!input) return '';

  // Remove all non-digit characters except + and -
  let sanitized = input.replace(/[^\d\+\-]/g, '');

  // If country code is provided, ensure proper format
  if (countryCode) {
    const country = countryCodes.find(c => c.code === countryCode || c.name === countryCode);
    if (country && !sanitized.startsWith(country.dialCode)) {
      // If input doesn't start with country code, add it
      if (sanitized.startsWith('0')) {
        // Remove leading 0 and add country code
        sanitized = country.dialCode + sanitized.substring(1);
      } else if (!sanitized.startsWith('+')) {
        // Add country code if not present
        sanitized = country.dialCode + sanitized;
      }
    } else if (sanitized.startsWith('+') && !sanitized.startsWith(country.dialCode)) {
      // Check if the country code matches the input
      const matchingCountry = countryCodes.find(c => sanitized.startsWith(c.dialCode));
      if (matchingCountry) {
        throw new Error(`Phone number country code (${matchingCountry.dialCode}) doesn't match selected country (${country.dialCode})`);
      }
    }
  }

  // Ensure it starts with +
  if (!sanitized.startsWith('+')) {
    // Try to guess the country based on the number format
    if (sanitized.startsWith('0')) {
      // Default to Indonesia for numbers starting with 0
      sanitized = '+62' + sanitized.substring(1);
    } else if (!sanitized.includes('+')) {
      // For international format without +
      sanitized = '+' + sanitized;
    }
  }

  // Validate phone number format
  const phoneRegex = /^\+\d{8,15}$/;

  if (!phoneRegex.test(sanitized)) {
    throw new Error('Invalid phone number format. Please enter a valid international phone number.');
  }

  return sanitized;
}

export function validatePhoneNumberFormat(phoneNumber: string, countryCode?: string): boolean {
  try {
    const sanitized = sanitizePhone(phoneNumber, countryCode);

    // Basic validation: should be 8-15 digits after +
    const digits = sanitized.substring(1);
    if (digits.length < 8 || digits.length > 15) {
      return false;
    }

    // If country code is specified, validate specific format
    if (countryCode) {
      const country = countryCodes.find(c => c.code === countryCode || c.name === countryCode);
      if (country) {
        // Check if phone number starts with correct country code
        if (!sanitized.startsWith(country.dialCode)) {
          return false;
        }
      }
    }

    return true;
  } catch {
    return false;
  }
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