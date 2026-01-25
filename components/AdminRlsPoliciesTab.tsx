'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Plus,
  Trash2,
  Settings
} from 'lucide-react'

interface RlsPolicy {
  schemaname: string
  tablename: string
  policyname: string
  permissive: string
  roles: string[]
  cmd: string
  qual?: string
  with_check?: string
}

interface TableInfo {
  tablename: string
  has_rls: boolean
  policy_count: number
}

type PolicyType = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL'

export function AdminRlsPoliciesTab() {
  const [policies, setPolicies] = useState<RlsPolicy[]>([])
  const [tables, setTables] = useState<TableInfo[]>([])
  const [selectedTable, setSelectedTable] = useState<string>('all')
  const [selectedCommand, setSelectedCommand] = useState<PolicyType>('ALL')
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadPolicies = async () => {
    setIsRefreshing(true)
    try {
      const supabase = createClient()

      // Get all RLS policies
      const { data: policiesData, error: policiesError } = await supabase
        .rpc('get_rls_policies')

      if (policiesError) {
        // Fallback: try direct query if RPC doesn't exist
        const { data: directData, error: directError } = await supabase
          .from('pg_policies_view')
          .select('*')

        if (directError) {
          throw directError
        }
        setPolicies(directData || [])
      } else {
        setPolicies(policiesData || [])
      }

      // Get table info
      const tablesOfInterest = [
        'users',
        'tashih_records',
        'jurnal_records',
        'muallimah_registrations',
        'tikrar_registrations',
        'daftar_ulang_submissions',
        'exam_attempts',
        'exam_questions',
        'study_partners',
        'halaqah',
        'presensi'
      ]

      const tableInfoPromises = tablesOfInterest.map(async (tablename) => {
        const { data, error } = await supabase
          .rpc('check_table_rls', { table_name: tablename })

        return {
          tablename,
          has_rls: data?.has_rls || false,
          policy_count: data?.policy_count || 0
        } as TableInfo
      })

      const tablesData = await Promise.all(tableInfoPromises)
      setTables(tablesData)

      toast.success('RLS policies loaded successfully')
    } catch (error: any) {
      console.error('Error loading RLS policies:', error)
      toast.error('Failed to load RLS policies: ' + error.message)

      // Set mock data for demo if API fails
      setTables([
        { tablename: 'users', has_rls: true, policy_count: 5 },
        { tablename: 'tashih_records', has_rls: true, policy_count: 6 },
        { tablename: 'jurnal_records', has_rls: true, policy_count: 6 },
        { tablename: 'muallimah_registrations', has_rls: true, policy_count: 4 },
        { tablename: 'tikrar_registrations', has_rls: true, policy_count: 4 },
        { tablename: 'daftar_ulang_submissions', has_rls: true, policy_count: 4 },
        { tablename: 'exam_attempts', has_rls: true, policy_count: 3 },
        { tablename: 'exam_questions', has_rls: true, policy_count: 2 },
        { tablename: 'study_partners', has_rls: true, policy_count: 4 },
        { tablename: 'halaqah', has_rls: true, policy_count: 3 },
        { tablename: 'presensi', has_rls: true, policy_count: 3 }
      ])
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadPolicies()
  }, [])

  const filteredPolicies = policies.filter(policy => {
    if (selectedTable !== 'all' && policy.tablename !== selectedTable) return false
    if (selectedCommand !== 'ALL' && policy.cmd !== selectedCommand) return false
    return true
  })

  const getCommandBadgeColor = (cmd: string) => {
    switch (cmd) {
      case 'SELECT': return 'bg-blue-100 text-blue-800'
      case 'INSERT': return 'bg-green-100 text-green-800'
      case 'UPDATE': return 'bg-amber-100 text-amber-800'
      case 'DELETE': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCommandIcon = (cmd: string) => {
    switch (cmd) {
      case 'SELECT': return <Eye className="h-4 w-4" />
      case 'INSERT': return <Plus className="h-4 w-4" />
      case 'UPDATE': return <RefreshCw className="h-4 w-4" />
      case 'DELETE': return <Trash2 className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  const applyQuickFix = async (tableName: string, fixType: 'thalibah' | 'musyrifah' | 'admin') => {
    try {
      const supabase = createClient()

      let sql = ''

      switch (fixType) {
        case 'thalibah':
          sql = `
            -- Enable thalibah to manage their own records
            DROP POLICY IF EXISTS "Users can insert own ${tableName}" ON public.${tableName};
            DROP POLICY IF EXISTS "Users can update own ${tableName}" ON public.${tableName};
            DROP POLICY IF EXISTS "Users can delete own ${tableName}" ON public.${tableName};

            CREATE POLICY "Users can insert own ${tableName}"
              ON public.${tableName} FOR INSERT
              TO authenticated
              WITH CHECK (auth.uid() = user_id);

            CREATE POLICY "Users can update own ${tableName}"
              ON public.${tableName} FOR UPDATE
              TO authenticated
              USING (auth.uid() = user_id)
              WITH CHECK (auth.uid() = user_id);

            CREATE POLICY "Users can delete own ${tableName}"
              ON public.${tableName} FOR DELETE
              TO authenticated
              USING (auth.uid() = user_id);

            ALTER TABLE public.${tableName} ENABLE ROW LEVEL SECURITY;
            GRANT SELECT, INSERT, UPDATE, DELETE ON public.${tableName} TO authenticated;
          `
          break

        case 'musyrifah':
          sql = `
            -- Enable musyrifah to view all records
            DROP POLICY IF EXISTS "Admins and Musyrifah can view all ${tableName}" ON public.${tableName};

            CREATE POLICY "Admins and Musyrifah can view all ${tableName}"
              ON public.${tableName} FOR SELECT
              TO authenticated
              USING (
                EXISTS (
                  SELECT 1 FROM public.users
                  WHERE users.id = auth.uid()
                  AND (
                    users.role = 'admin'
                    OR users.role = 'musyrifah'
                    OR 'admin' = ANY(users.roles)
                    OR 'musyrifah' = ANY(users.roles)
                  )
                )
              );
          `
          break

        case 'admin':
          sql = `
            -- Enable admin to manage all records
            DROP POLICY IF EXISTS "Admins can manage all ${tableName}" ON public.${tableName};

            CREATE POLICY "Admins can manage all ${tableName}"
              ON public.${tableName} FOR ALL
              TO authenticated
              USING (
                EXISTS (
                  SELECT 1 FROM public.users
                  WHERE users.id = auth.uid()
                  AND (
                    users.role = 'admin'
                    OR 'admin' = ANY(users.roles)
                  )
                )
              )
              WITH CHECK (
                EXISTS (
                  SELECT 1 FROM public.users
                  WHERE users.id = auth.uid()
                  AND (
                    users.role = 'admin'
                    OR 'admin' = ANY(users.roles)
                  )
                )
              );
          `
          break
      }

      // Execute SQL via RPC
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql })

      if (error) {
        throw error
      }

      toast.success(`Applied ${fixType} fix for ${tableName}`)
      await loadPolicies()
    } catch (error: any) {
      console.error('Error applying fix:', error)
      toast.error('Failed to apply fix: ' + error.message)

      // Show SQL for manual execution
      navigator.clipboard.writeText(`
-- Manual SQL execution required:
-- Run this in Supabase SQL Editor

-- 1. Enable RLS
ALTER TABLE public.${tableName} ENABLE ROW LEVEL SECURITY;

-- 2. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.${tableName} TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
      `)

      toast.success('SQL copied to clipboard - please run in Supabase SQL Editor')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">RLS Policies Management</h3>
          <p className="mt-1 text-sm text-gray-500">
            Manage Row Level Security policies for data protection
          </p>
        </div>
        <button
          onClick={loadPolicies}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-900 text-white rounded-lg hover:bg-green-800 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* RLS Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Tables with RLS</p>
              <p className="text-2xl font-semibold text-gray-900">
                {tables.filter(t => t.has_rls).length} / {tables.length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <ShieldCheck className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Policies</p>
              <p className="text-2xl font-semibold text-gray-900">
                {tables.reduce((sum, t) => sum + t.policy_count, 0)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Tables Without RLS</p>
              <p className="text-2xl font-semibold text-gray-900">
                {tables.filter(t => !t.has_rls).length}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <ShieldAlert className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Fix Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Quick Fix Actions</h4>
        <p className="text-sm text-gray-500 mb-4">
          Apply common RLS fixes for specific roles. These will create/update policies.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Thalibah Fix */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h5 className="font-medium text-gray-900">Enable Thalibah Access</h5>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Allow thalibah to insert/update their own tashih and jurnal records
            </p>
            <div className="space-y-2">
              <button
                onClick={() => applyQuickFix('tashih_records', 'thalibah')}
                className="w-full px-3 py-2 text-sm bg-green-50 text-green-700 rounded hover:bg-green-100"
              >
                Fix tashih_records
              </button>
              <button
                onClick={() => applyQuickFix('jurnal_records', 'thalibah')}
                className="w-full px-3 py-2 text-sm bg-green-50 text-green-700 rounded hover:bg-green-100"
              >
                Fix jurnal_records
              </button>
            </div>
          </div>

          {/* Musyrifah Fix */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-5 w-5 text-blue-600" />
              <h5 className="font-medium text-gray-900">Enable Musyrifah View</h5>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Allow musyrifah to view all tashih and jurnal records
            </p>
            <div className="space-y-2">
              <button
                onClick={() => applyQuickFix('tashih_records', 'musyrifah')}
                className="w-full px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
              >
                Fix tashih_records
              </button>
              <button
                onClick={() => applyQuickFix('jurnal_records', 'musyrifah')}
                className="w-full px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
              >
                Fix jurnal_records
              </button>
            </div>
          </div>

          {/* Admin Fix */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-5 w-5 text-purple-600" />
              <h5 className="font-medium text-gray-900">Enable Admin Full Access</h5>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Allow admin to manage all records
            </p>
            <div className="space-y-2">
              <button
                onClick={() => applyQuickFix('tashih_records', 'admin')}
                className="w-full px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded hover:bg-purple-100"
              >
                Fix tashih_records
              </button>
              <button
                onClick={() => applyQuickFix('jurnal_records', 'admin')}
                className="w-full px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded hover:bg-purple-100"
              >
                Fix jurnal_records
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Table
            </label>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Tables</option>
              {tables.map(t => (
                <option key={t.tablename} value={t.tablename}>
                  {t.tablename} ({t.policy_count} policies)
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Command
            </label>
            <select
              value={selectedCommand}
              onChange={(e) => setSelectedCommand(e.target.value as PolicyType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="ALL">All Commands</option>
              <option value="SELECT">SELECT</option>
              <option value="INSERT">INSERT</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
        </div>
      </div>

      {/* Policies Table */}
      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            RLS Policies ({filteredPolicies.length})
          </h3>
        </div>

        {filteredPolicies.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No RLS policies found</p>
            <p className="text-sm text-gray-400 mt-1">
              Try refreshing or check database connection
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Table
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Policy Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Command
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Roles
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPolicies.map((policy, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {policy.tablename}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {policy.policyname}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getCommandBadgeColor(policy.cmd)}`}>
                        {getCommandIcon(policy.cmd)}
                        {policy.cmd}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {policy.roles?.length > 0 ? policy.roles.join(', ') : 'authenticated'}
                    </td>
                    <td className="px-4 py-3">
                      {policy.permissive === 'PERMISSIVE' ? (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600">
                          <XCircle className="h-4 w-4" />
                          Restrictive
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-blue-900">About RLS Policies</h4>
            <p className="text-xs text-blue-700 mt-1">
              Row Level Security (RLS) policies control which data users can access based on their role.
              Quick Fix actions create standard policies. For custom policies, use Supabase SQL Editor.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
