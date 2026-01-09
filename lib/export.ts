import type { User } from '@/types';

// Export Users to CSV
export const exportUsersToCSV = (users: User[], filename: string = 'users_export') => {
  if (!users.length) {
    throw new Error('No users to export');
  }

  // Define CSV headers
  const headers = [
    'ID',
    'Nama Lengkap',
    'Email',
    'Role',
    'No Telepon',
    'Status Aktif',
    'Tanggal Gabung',
    'Terakhir Update'
  ];

  // Convert users to CSV rows
  const csvRows = users.map(user => [
    user.id,
    `"${user.full_name}"`,
    `"${user.email}"`,
    `"${user.roles?.[0] || (user as any)?.role || ''}"`,
    `"${user.phone || ''}"`,
    user.is_active ? 'Aktif' : 'Tidak Aktif',
    formatDate(new Date(user.created_at)),
    formatDate(new Date(user.updated_at))
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
    'Nama Lengkap',
    'Email',
    'Role',
    'No Telepon',
    'Status Aktif',
    'Tanggal Gabung',
    'Terakhir Update'
  ];

  const tabRows = users.map(user => [
    user.id,
    user.full_name,
    user.email,
    user.roles?.[0] || (user as any)?.role || '',
    user.phone || '',
    user.is_active ? 'Aktif' : 'Tidak Aktif',
    formatDate(new Date(user.created_at)),
    formatDate(new Date(user.updated_at))
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
    const role = user.roles?.[0] || (user as any)?.role || 'unknown';
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalUsers = users.length;
  const usersWithPhone = users.filter(u => u.phone).length;
  const activeUsers = users.filter(u => u.is_active).length;

  // Create statistics report
  const statsContent = `
USER STATISTICS REPORT
Generated on: ${new Date().toLocaleString('id-ID')}

OVERVIEW:
Total Users: ${totalUsers}
Active Users: ${activeUsers} (${((activeUsers/totalUsers)*100).toFixed(1)}%)
Users with Phone Number: ${usersWithPhone} (${((usersWithPhone/totalUsers)*100).toFixed(1)}%)

USER ROLES:
${Object.entries(roleStats).map(([role, count]) =>
  `${role.replace('_', ' ')}: ${count} (${((count/totalUsers)*100).toFixed(1)}%)`
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
function formatDate(date: Date | string): string {
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