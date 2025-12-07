export interface CountryCode {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

export const countryCodes: CountryCode[] = [
  // Indonesia
  { code: 'ID', name: 'Indonesia', dialCode: '+62', flag: '🇮🇩' },

  // Asia Tenggara
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾' },
  { code: 'SG', name: 'Singapura', dialCode: '+65', flag: '🇸🇬' },
  { code: 'BN', name: 'Brunei Darussalam', dialCode: '+673', flag: '🇧🇳' },
  { code: 'TH', name: 'Thailand', dialCode: '+66', flag: '🇹🇭' },
  { code: 'PH', name: 'Filipina', dialCode: '+63', flag: '🇵🇭' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84', flag: '🇻🇳' },
  { code: 'MM', name: 'Myanmar', dialCode: '+95', flag: '🇲🇲' },
  { code: 'KH', name: 'Kamboja', dialCode: '+855', flag: '🇰🇭' },
  { code: 'LA', name: 'Laos', dialCode: '+856', flag: '🇱🇦' },
  { code: 'TL', name: 'Timor Leste', dialCode: '+670', flag: '🇹🇱' },

  // Asia Selatan
  { code: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩' },
  { code: 'LK', name: 'Sri Lanka', dialCode: '+94', flag: '🇱🇰' },

  // Asia Timur
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷' },

  // Timur Tengah
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
  { code: 'AE', name: 'UAE', dialCode: '+971', flag: '🇦🇪' },
  { code: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦' },
  { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬' },
  { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷' },

  // Eropa
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱' },

  // Oseania
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿' },

  // Amerika
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
];

export const getCountryCodeByName = (countryName: string): CountryCode | undefined => {
  return countryCodes.find(country => country.name === countryName);
};

export const getCountryCodeByDial = (dialCode: string): CountryCode | undefined => {
  return countryCodes.find(country => country.dialCode === dialCode);
};