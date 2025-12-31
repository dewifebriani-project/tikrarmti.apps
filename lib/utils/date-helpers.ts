/**
 * Date utility functions for Indonesian and Hijri calendar
 */

/**
 * Format date to Indonesian locale
 * @param dateString - ISO date string
 * @returns Formatted date (e.g., "31 Desember 2025")
 */
export function formatDateIndo(dateString: string): string {
  const date = new Date(dateString);
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Format date to Indonesian locale with day name
 * @param dateString - ISO date string
 * @returns Formatted date (e.g., "Rabu, 31 Desember 2025")
 */
export function formatDateWithDayIndo(dateString: string): string {
  const date = new Date(dateString);
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const dayName = days[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${dayName}, ${day} ${month} ${year}`;
}

/**
 * Get day name in Indonesian
 * @param dateString - ISO date string
 * @returns Day name (e.g., "Rabu")
 */
export function getDayNameIndo(dateString: string): string {
  const date = new Date(dateString);
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[date.getDay()];
}

/**
 * Convert Gregorian date to Hijri (approximate calculation)
 * Note: This is an approximation. For precise dates, consider using a library like 'hijri-date'
 * @param dateString - ISO date string
 * @returns Hijri date string (e.g., "6 Rajab 1446")
 */
export function toHijri(dateString: string): string {
  const date = new Date(dateString);

  // Reference: January 1, 2024 = 19 Rajab 1445
  // Hijri epoch: July 16, 622 CE (Julian calendar)
  const GREGORIAN_TO_HIJRI_EPOCH = 227014; // Days difference
  const HIJRI_YEAR_DAYS = 354.36667; // Average days in Hijri year
  const HIJRI_MONTH_DAYS = 29.5; // Average days in Hijri month

  // Calculate days since a known reference point
  // Using January 1, 2024 as reference (19 Rajab 1445)
  const referenceDate = new Date('2024-01-01');
  const referenceHijriYear = 1445;
  const referenceHijriMonth = 7; // Rajab is 7th month
  const referenceHijriDay = 19;

  const daysDiff = Math.floor((date.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));

  // Approximate Hijri date calculation
  let hijriYear = referenceHijriYear;
  let hijriMonth = referenceHijriMonth;
  let hijriDay = referenceHijriDay;

  // Add the days difference
  hijriDay += daysDiff;

  // Normalize days to month
  while (hijriDay > 30) {
    hijriDay -= 30;
    hijriMonth++;
  }

  // Normalize month to year
  while (hijriMonth > 12) {
    hijriMonth -= 12;
    hijriYear++;
  }

  // Handle negative days
  while (hijriDay < 1) {
    hijriMonth--;
    hijriDay += 30;
  }

  // Handle negative months
  while (hijriMonth < 1) {
    hijriMonth += 12;
    hijriYear--;
  }

  const hijriMonthNames = [
    'Muharram', 'Safar', 'Rabiul Awwal', 'Rabiul Akhir',
    'Jumadil Awwal', 'Jumadil Akhir', 'Rajab', 'Sya\'ban',
    'Ramadhan', 'Syawal', 'Dzulqaidah', 'Dzulhijjah'
  ];

  return `${hijriDay} ${hijriMonthNames[hijriMonth - 1]} ${hijriYear}`;
}

/**
 * Format date range to Indonesian
 * @param startDate - Start date ISO string
 * @param endDate - End date ISO string
 * @returns Formatted range (e.g., "31 Desember 2025 - 5 Januari 2026")
 */
export function formatDateRangeIndo(startDate: string, endDate: string): string {
  return `${formatDateIndo(startDate)} - ${formatDateIndo(endDate)}`;
}

/**
 * Format date with full details: day name, date, and hijri date
 * @param dateString - ISO date string
 * @returns Formatted date (e.g., "Rabu, 31 Desember 2025\n6 Rajab 1446")
 */
export function formatFullDateIndo(dateString: string): { day: string; date: string; hijriDate: string } {
  return {
    day: getDayNameIndo(dateString),
    date: formatDateIndo(dateString),
    hijriDate: toHijri(dateString)
  };
}
