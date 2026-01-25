/**
 * Format utilities for displaying data consistently across the app
 */

/**
 * Format class type for display
 * Maps class type codes to human-readable labels
 */
export function formatClassType(classType: string | null | undefined): string {
  if (!classType) return '-';

  const classTypeMap: Record<string, string> = {
    'tashih_ujian': 'Kelas Tashih + Ujian',
    'tashih_only': 'Kelas Tashih Saja',
    'ujian_only': 'Kelas Ujian Saja'
  };

  return classTypeMap[classType] || classType;
}

/**
 * Format schedule for display with colored day names
 * Handles both plain text and JSON formats
 */
export function formatSchedule(scheduleStr: string | null | undefined): string {
  if (!scheduleStr) return '-';

  // Map day names to Indonesian with colors
  const dayConfig: Record<string, { name: string; color: string }> = {
    'senin': { name: 'Senin', color: '#EF4444' },    // Red
    'selasa': { name: 'Selasa', color: '#F97316' },  // Orange
    'rabu': { name: 'Rabu', color: '#FBBF24' },      // Yellow
    'kamis': { name: 'Kamis', color: '#10B981' },    // Green
    'jumat': { name: 'Jumat', color: '#3B82F6' },    // Blue
    'sabtu': { name: 'Sabtu', color: '#6366F1' },    // Indigo
    'minggu': { name: 'Minggu', color: '#8B5CF6' },  // Purple
    'monday': { name: 'Senin', color: '#EF4444' },
    'tuesday': { name: 'Selasa', color: '#F97316' },
    'wednesday': { name: 'Rabu', color: '#FBBF24' },
    'thursday': { name: 'Kamis', color: '#10B981' },
    'friday': { name: 'Jumat', color: '#3B82F6' },
    'saturday': { name: 'Sabtu', color: '#6366F1' },
    'sunday': { name: 'Minggu', color: '#8B5CF6' }
  };

  const getColoredDay = (dayStr: string) => {
    const dayLower = dayStr.toLowerCase();
    const config = dayConfig[dayLower];
    if (config) {
      return `<span style="color: ${config.color}; font-weight: 600;">${config.name}</span>`;
    }
    return dayStr;
  };

  // If already in readable format (not JSON), translate and color day name
  if (!scheduleStr.startsWith('[') && !scheduleStr.startsWith('{')) {
    let result = scheduleStr;
    for (const [key, config] of Object.entries(dayConfig)) {
      const regex = new RegExp(`\\b${key}\\b`, 'gi');
      result = result.replace(regex, `<span style="color: ${config.color}; font-weight: 600;">${config.name}</span>`);
    }
    return result;
  }

  try {
    const schedule = JSON.parse(scheduleStr);

    // Handle single object: {"day":"Sabtu","time_start":"09:30","time_end":"11:00"}
    if (schedule && typeof schedule === 'object' && !Array.isArray(schedule)) {
      const dayRaw = schedule.day || '';
      const dayHtml = getColoredDay(dayRaw);
      const timeStart = schedule.time_start || '';
      const timeEnd = schedule.time_end || '';
      return `${dayHtml} ${timeStart}-${timeEnd}`;
    }

    // Handle array: [{...}, {...}]
    if (Array.isArray(schedule) && schedule.length > 0) {
      const formatted = schedule.map((s: any) => {
        const dayRaw = s.day || '';
        const dayHtml = getColoredDay(dayRaw);
        const timeStart = s.time_start || '';
        const timeEnd = s.time_end || '';
        return `${dayHtml} ${timeStart}-${timeEnd}`;
      });
      // Join with line breaks for multiple schedules
      return formatted.join('\n');
    }

    return scheduleStr;
  } catch {
    // If parse fails, return original string
    return scheduleStr;
  }
}
