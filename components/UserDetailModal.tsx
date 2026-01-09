'use client';

import { useState, useEffect } from 'react';
import { X, User, Calendar, MapPin, Phone, Mail, Award, Users, ClipboardCheck, Activity, Loader2 } from 'lucide-react';

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export function UserDetailModal({ isOpen, onClose, userId }: UserDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'registrations' | 'halaqah' | 'attendance' | 'activity'>('profile');

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetails();
    }
  }, [isOpen, userId]);

  const fetchUserDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${userId}/details`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    if (!time) return '-';
    return time.substring(0, 5);
  };

  const getDayName = (day: number) => {
    const days = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    return days[day] || '-';
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-green-900">
          <h2 className="text-xl font-semibold text-white">User Details</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-green-900 animate-spin" />
              <p className="mt-2 text-sm text-gray-600">Loading user details...</p>
            </div>
          )}

          {error && (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && data && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-6 bg-gray-50">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-green-900">{data.stats.totalRegistrations}</div>
                  <div className="text-xs text-gray-600">Registrations</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-blue-900">{data.stats.activeHalaqahs}</div>
                  <div className="text-xs text-gray-600">Active Halaqah</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-purple-900">{data.stats.totalAttendance}</div>
                  <div className="text-xs text-gray-600">Attendance</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-yellow-900">{data.stats.attendanceRate}%</div>
                  <div className="text-xs text-gray-600">Attendance Rate</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="text-2xl font-bold text-pink-900">{data.stats.mentorRoles}</div>
                  <div className="text-xs text-gray-600">Mentor Roles</div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex gap-x-8 px-6" aria-label="Tabs">
                  {[
                    { id: 'profile', label: 'Profile', icon: User },
                    { id: 'registrations', label: 'Registrations', icon: ClipboardCheck },
                    { id: 'halaqah', label: 'Halaqah', icon: Users },
                    { id: 'attendance', label: 'Attendance', icon: Calendar },
                    { id: 'activity', label: 'Activity', icon: Activity },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`
                          flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                          ${activeTab === tab.id
                            ? 'border-green-900 text-green-900'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }
                        `}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                      <dl className="space-y-3">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                          <dd className="mt-1 text-sm text-gray-900">{data.user.full_name || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Email</dt>
                          <dd className="mt-1 text-sm text-gray-900">{data.user.email}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Role</dt>
                          <dd className="mt-1">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                              ${(() => {
                                const primaryRole = data.user.roles?.[0] || (data.user as any)?.role;
                                return primaryRole === 'admin' ? 'bg-purple-100 text-purple-800' :
                                  primaryRole === 'ustadzah' ? 'bg-blue-100 text-blue-800' :
                                  primaryRole === 'musyrifah' ? 'bg-green-100 text-green-800' :
                                  primaryRole === 'thalibah' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800';
                              })()}`}>
                              {data.user.roles?.[0] || (data.user as any)?.role || 'User'}
                            </span>
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Status</dt>
                          <dd className="mt-1">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                              ${data.user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {data.user.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Gender</dt>
                          <dd className="mt-1 text-sm text-gray-900">{data.user.jenis_kelamin || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Birth Date & Place</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {data.user.tempat_lahir}, {formatDate(data.user.tanggal_lahir)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Occupation</dt>
                          <dd className="mt-1 text-sm text-gray-900">{data.user.pekerjaan || '-'}</dd>
                        </div>
                      </dl>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Contact & Location</h3>
                      <dl className="space-y-3">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">WhatsApp</dt>
                          <dd className="mt-1 text-sm text-gray-900">{data.user.whatsapp || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Telegram</dt>
                          <dd className="mt-1 text-sm text-gray-900">{data.user.telegram || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Country</dt>
                          <dd className="mt-1 text-sm text-gray-900">{data.user.negara || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Province</dt>
                          <dd className="mt-1 text-sm text-gray-900">{data.user.provinsi || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">City</dt>
                          <dd className="mt-1 text-sm text-gray-900">{data.user.kota || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Address</dt>
                          <dd className="mt-1 text-sm text-gray-900">{data.user.alamat || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Timezone</dt>
                          <dd className="mt-1 text-sm text-gray-900">{data.user.zona_waktu || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Registration Reason</dt>
                          <dd className="mt-1 text-sm text-gray-900">{data.user.alasan_daftar || '-'}</dd>
                        </div>
                      </dl>

                      <h3 className="text-lg font-semibold mb-4 mt-6">Account Information</h3>
                      <dl className="space-y-3">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Created At</dt>
                          <dd className="mt-1 text-sm text-gray-900">{formatDate(data.user.created_at)}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                          <dd className="mt-1 text-sm text-gray-900">{formatDate(data.user.updated_at)}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                )}

                {/* Registrations Tab */}
                {activeTab === 'registrations' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Tikrar Registrations</h3>
                    {data.tikrarRegistrations.length === 0 ? (
                      <p className="text-sm text-gray-500">No registrations found</p>
                    ) : (
                      <div className="space-y-4">
                        {data.tikrarRegistrations.map((reg: any) => (
                          <div key={reg.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-medium text-gray-900">{reg.batch?.name || reg.batch_name}</h4>
                                <p className="text-sm text-gray-500">{reg.program?.name || '-'}</p>
                              </div>
                              <div className="flex gap-2">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full
                                  ${reg.status === 'approved' ? 'bg-green-100 text-green-800' :
                                    reg.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                    reg.status === 'withdrawn' ? 'bg-gray-100 text-gray-800' :
                                    'bg-yellow-100 text-yellow-800'}`}>
                                  {reg.status}
                                </span>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full
                                  ${reg.selection_status === 'selected' ? 'bg-blue-100 text-blue-800' :
                                    reg.selection_status === 'not_selected' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'}`}>
                                  {reg.selection_status}
                                </span>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                              <div>
                                <span className="text-gray-500">Chosen Juz:</span>
                                <span className="ml-2 font-medium">{reg.chosen_juz}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Submitted:</span>
                                <span className="ml-2">{formatDate(reg.created_at)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Halaqah Tab */}
                {activeTab === 'halaqah' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Halaqah Assignments</h3>
                    {data.halaqahAssignments.length === 0 && data.mentorAssignments.length === 0 ? (
                      <p className="text-sm text-gray-500">No halaqah assignments found</p>
                    ) : (
                      <div className="space-y-6">
                        {/* Student Assignments */}
                        {data.halaqahAssignments.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-700 mb-3">As Student</h4>
                            <div className="space-y-3">
                              {data.halaqahAssignments.map((assignment: any) => (
                                <div key={assignment.id} className="border border-gray-200 rounded-lg p-4">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h5 className="font-medium text-gray-900">{assignment.halaqah?.name}</h5>
                                      <p className="text-sm text-gray-500">{assignment.halaqah?.program?.name}</p>
                                      <p className="text-xs text-gray-400">{assignment.halaqah?.program?.batch?.name}</p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full
                                      ${assignment.status === 'active' ? 'bg-green-100 text-green-800' :
                                        assignment.status === 'graduated' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'}`}>
                                      {assignment.status}
                                    </span>
                                  </div>
                                  <div className="mt-2 text-sm text-gray-600">
                                    {getDayName(assignment.halaqah?.day_of_week)}, {formatTime(assignment.halaqah?.start_time)} - {formatTime(assignment.halaqah?.end_time)}
                                  </div>
                                  <div className="mt-1 text-xs text-gray-500">
                                    Assigned: {formatDate(assignment.assigned_at)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Mentor Assignments */}
                        {data.mentorAssignments.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-700 mb-3">As Mentor</h4>
                            <div className="space-y-3">
                              {data.mentorAssignments.map((assignment: any) => (
                                <div key={assignment.id} className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h5 className="font-medium text-gray-900">{assignment.halaqah?.name}</h5>
                                      <p className="text-sm text-gray-500">{assignment.halaqah?.program?.name}</p>
                                      <p className="text-xs text-gray-400">{assignment.halaqah?.program?.batch?.name}</p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full
                                      ${assignment.role === 'ustadzah' ? 'bg-purple-100 text-purple-800' :
                                        'bg-green-100 text-green-800'}`}>
                                      {assignment.role}
                                      {assignment.is_primary && ' (Primary)'}
                                    </span>
                                  </div>
                                  <div className="mt-1 text-xs text-gray-500">
                                    Assigned: {formatDate(assignment.assigned_at)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Attendance Tab */}
                {activeTab === 'attendance' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Attendance Records (Last 50)</h3>
                    {data.presensiRecords.length === 0 ? (
                      <p className="text-sm text-gray-500">No attendance records found</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Halaqah</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {data.presensiRecords.map((record: any) => (
                              <tr key={record.id}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                  {formatDate(record.date)}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500">
                                  {record.halaqah?.name || '-'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                    ${record.status === 'hadir' ? 'bg-green-100 text-green-800' :
                                      record.status === 'izin' ? 'bg-yellow-100 text-yellow-800' :
                                      record.status === 'sakit' ? 'bg-blue-100 text-blue-800' :
                                      'bg-red-100 text-red-800'}`}>
                                    {record.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500">
                                  {record.notes || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Activity Tab */}
                {activeTab === 'activity' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Activity Logs (Last 100)</h3>
                    {data.activityLogs.length === 0 ? (
                      <p className="text-sm text-gray-500">No activity logs found</p>
                    ) : (
                      <div className="space-y-2">
                        {data.activityLogs.map((log: any) => (
                          <div key={log.id} className="border-l-4 border-gray-300 pl-4 py-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{log.action}</p>
                                <p className="text-xs text-gray-500">{log.resource}</p>
                              </div>
                              <span className={`px-2 py-1 text-xs font-semibold rounded
                                ${log.level === 'INFO' ? 'bg-blue-100 text-blue-800' :
                                  log.level === 'WARN' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'}`}>
                                {log.level}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDate(log.timestamp)} - {log.ip_address || 'N/A'}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
