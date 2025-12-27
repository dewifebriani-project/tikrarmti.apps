'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { AlertTriangle, Users, UserCheck, Trash2, RefreshCw, Loader2 } from 'lucide-react';

interface OrphanedAuthUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  metadata: any;
  issue: string;
}

interface OrphanedPendaftaranUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  metadata: any;
  issue: string;
  registration_types?: string[];
}

interface CheckResult {
  summary: {
    total_auth_users: number;
    orphaned_auth_users: number;
    orphaned_pendaftaran: number;
    complete_users: number;
  };
  orphaned_auth_users: OrphanedAuthUser[];
  orphaned_pendaftaran: OrphanedPendaftaranUser[];
  complete_users: any[];
}

export default function AdminOrphanedUsers() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<CheckResult | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);

  const checkOrphanedUsers = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/admin/check-orphaned-users');
      const result = await response.json();

      if (response.ok) {
        setData(result);
        toast.success(`Found ${result.summary.orphaned_auth_users} orphaned auth users`);
      } else {
        toast.error(result.error || 'Failed to check orphaned users');
      }
    } catch (error) {
      console.error('Error checking orphaned users:', error);
      toast.error('Failed to check orphaned users');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const syncUser = async (userId: string, action: 'create_users_record' | 'delete_auth_user', email: string) => {
    try {
      setSyncing(userId);
      const response = await fetch('/api/admin/sync-orphaned-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action })
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || 'User synced successfully');
        // Refresh the list
        checkOrphanedUsers();
      } else {
        toast.error(result.error || 'Failed to sync user');
      }
    } catch (error) {
      console.error('Error syncing user:', error);
      toast.error('Failed to sync user');
    } finally {
      setSyncing(null);
    }
  };

  useEffect(() => {
    checkOrphanedUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Orphaned Users</h2>
          <p className="text-sm text-gray-600 mt-1">
            Users that exist in Auth but not in database tables
          </p>
        </div>
        <button
          onClick={checkOrphanedUsers}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Auth Users</p>
                <p className="text-2xl font-bold text-gray-900">{data.summary.total_auth_users}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Orphaned Auth</p>
                <p className="text-2xl font-bold text-red-600">{data.summary.orphaned_auth_users}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">No Pendaftaran</p>
                <p className="text-2xl font-bold text-yellow-600">{data.summary.orphaned_pendaftaran}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <UserCheck className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Complete Users</p>
                <p className="text-2xl font-bold text-green-600">{data.summary.complete_users}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orphaned Auth Users Table */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Orphaned Auth Users (Not in users table)
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            These users exist in Supabase Auth but have no record in the users table
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Sign In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.orphaned_auth_users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No orphaned auth users found
                  </td>
                </tr>
              ) : (
                data?.orphaned_auth_users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{user.email}</div>
                      <div className="text-xs text-gray-500">{user.id.slice(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('id-ID') : 'Never'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => syncUser(user.id, 'create_users_record', user.email)}
                          disabled={syncing === user.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          {syncing === user.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <UserCheck className="w-3 h-3" />
                          )}
                          Create Record
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete auth user ${user.email}?`)) {
                              syncUser(user.id, 'delete_auth_user', user.email);
                            }
                          }}
                          disabled={syncing === user.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          {syncing === user.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Orphaned Pendaftaran Table */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-yellow-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Users Without Any Registration
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            These users have accounts but haven't registered for any program (Tikrar Tahfidz, Muallimah, or Musyrifah)
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Sign In</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data?.orphaned_pendaftaran.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    No users without registrations found
                  </td>
                </tr>
              ) : (
                data?.orphaned_pendaftaran.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{user.email}</div>
                      <div className="text-xs text-gray-500">{user.id.slice(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('id-ID') : 'Never'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
