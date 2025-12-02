import type { User } from '@/types';

// Export Users to CSV
export const exportUsersToCSV = (users: User[], filename: string = 'users_export') => {
  if (!users.length) {
    throw new Error('No users to export');
  }

  // Define CSV headers
  const headers = [
    'ID',
    'Nama',
    'Email',
    'Role',
    'No Telepon',
    'Tanggal Gabung',
    'Terakhir Update',
    'Nama Lengkap',
    'Nama Panggilan',
    'Tanggal Lahir',
    'Alamat',
    'Kota',
    'Provinsi',
    'No WhatsApp',
    'Telegram',
    'Timezone'
  ];

  // Convert users to CSV rows
  const csvRows = users.map(user => [
    user.id,
    `"${user.name}"`,
    `"${user.email}"`,
    `"${user.role}"`,
    `"${user.phone || ''}"`,
    formatDate(user.createdAt),
    formatDate(user.updatedAt),
    `"${user.personalInfo?.fullName || ''}"`,
    `"${user.personalInfo?.nickname || ''}"`,
    `"${user.personalInfo?.birthDate || ''}"`,
    `"${user.personalInfo?.address || ''}"`,
    `"${user.personalInfo?.city || ''}"`,
    `"${user.personalInfo?.province || ''}"`,
    `"${user.personalInfo?.whatsapp || ''}"`,
    `"${user.personalInfo?.telegram || ''}"`,
    `"${user.personalInfo?.timezone || ''}"`
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...csvRows.map(row => row.join(','))
  ].join('\n');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export Users to Excel (XLSX) format
export const exportUsersToExcel = async (users: User[], filename: string = 'users_export') => {
  if (!users.length) {
    throw new Error('No users to export');
  }

  // For now, we'll create a tab-separated values file that Excel can open
  // In a real implementation, you might use a library like xlsx or exceljs
  const headers = [
    'ID',
    'Nama',
    'Email',
    'Role',
    'No Telepon',
    'Tanggal Gabung',
    'Terakhir Update',
    'Nama Lengkap',
    'Nama Panggilan',
    'Tanggal Lahir',
    'Alamat',
    'Kota',
    'Provinsi',
    'No WhatsApp',
    'Telegram',
    'Timezone'
  ];

  const tabRows = users.map(user => [
    user.id,
    user.name,
    user.email,
    user.role,
    user.phone || '',
    formatDate(user.createdAt),
    formatDate(user.updatedAt),
    user.personalInfo?.fullName || '',
    user.personalInfo?.nickname || '',
    user.personalInfo?.birthDate || '',
    user.personalInfo?.address || '',
    user.personalInfo?.city || '',
    user.personalInfo?.province || '',
    user.personalInfo?.whatsapp || '',
    user.personalInfo?.telegram || '',
    user.personalInfo?.timezone || ''
  ]);

  const tabContent = [
    headers.join('\t'),
    ...tabRows.map(row => row.join('\t'))
  ].join('\n');

  const blob = new Blob([tabContent], { type: 'text/tab-separated-values;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.tsv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export summary statistics
export const exportUserStatistics = (users: User[], filename: string = 'user_statistics') => {
  if (!users.length) {
    throw new Error('No users to analyze');
  }

  // Calculate statistics
  const roleStats = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const cityStats = users.reduce((acc, user) => {
    const city = user.personalInfo?.city || 'Unknown';
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalUsers = users.length;
  const usersWithPhone = users.filter(u => u.phone).length;
  const usersWithAddress = users.filter(u => u.personalInfo?.address).length;

  // Create statistics report
  const statsContent = `
USER STATISTICS REPORT
Generated on: ${new Date().toLocaleString('id-ID')}

OVERVIEW:
Total Users: ${totalUsers}
Users with Phone Number: ${usersWithPhone} (${((usersWithPhone/totalUsers)*100).toFixed(1)}%)
Users with Address: ${usersWithAddress} (${((usersWithAddress/totalUsers)*100).toFixed(1)}%)

USER ROLES:
${Object.entries(roleStats).map(([role, count]) =>
  `${role.replace('_', ' ')}: ${count} (${((count/totalUsers)*100).toFixed(1)}%)`
).join('\n')}

CITIES:
${Object.entries(cityStats).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([city, count]) =>
  `${city}: ${count} users`
).join('\n')}
  `.trim();

  const blob = new Blob([statsContent], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.txt`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Format date helper function
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Export specific fields only
export const exportUsersSelectedFields = (
  users: User[],
  fields: string[],
  filename: string = 'users_export'
) => {
  if (!users.length) {
    throw new Error('No users to export');
  }

  const headers = fields;

  const csvRows = users.map(user =>
    fields.map(field => {
      const value = getNestedValue(user, field);
      return value ? `"${String(value).replace(/"/g, '""')}"` : '';
    })
  );

  const csvContent = [
    headers.join(','),
    ...csvRows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Helper function to get nested object values
function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : '';
  }, obj);
}