'use client'

import { useState, useEffect } from 'react'
import { X, Shield, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface User {
  id?: string
  email?: string | null
  full_name?: string | null
  role?: string | null
  roles?: string[] | null
}

interface EditRoleModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  user: User | null
}

// Available roles
const AVAILABLE_ROLES = [
  { id: 'admin', label: 'Admin', description: 'Full system access', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { id: 'muallimah', label: 'Muallimah', description: 'Teacher/Ustadzah', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { id: 'musyrifah', label: 'Musyrifah', description: 'Supervisor', color: 'bg-green-100 text-green-800 border-green-300' },
  { id: 'thalibah', label: 'Thalibah', description: 'Student', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { id: 'calon_thalibah', label: 'Calon Thalibah', description: 'Prospective Student', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  { id: 'pengurus', label: 'Pengurus', description: 'Management', color: 'bg-pink-100 text-pink-800 border-pink-300' },
]

export function EditRoleModal({ isOpen, onClose, onSuccess, user }: EditRoleModalProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [primaryRole, setPrimaryRole] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)

  // Initialize with user's current roles when modal opens
  useEffect(() => {
    if (isOpen && user) {
      setSelectedRoles(user.roles || [])
      setPrimaryRole(user.role || '')
    }
  }, [isOpen, user])

  const toggleRole = (roleId: string) => {
    setSelectedRoles(prev => {
      if (prev.includes(roleId)) {
        // Don't allow removing the last role
        if (prev.length === 1) {
          toast.error('User must have at least one role')
          return prev
        }
        // If removing primary role, set new primary
        if (roleId === primaryRole && prev.length > 1) {
          const newRoles = prev.filter(r => r !== roleId)
          setPrimaryRole(newRoles[0])
          return newRoles
        }
        return prev.filter(r => r !== roleId)
      } else {
        // If first role or replacing empty, set as primary
        if (prev.length === 0 || primaryRole === '') {
          setPrimaryRole(roleId)
        }
        return [...prev, roleId]
      }
    })
  }

  const setAsPrimary = (roleId: string) => {
    if (selectedRoles.includes(roleId)) {
      setPrimaryRole(roleId)
    }
  }

  const handleSave = async () => {
    if (!user) return

    // Validate: at least one role
    if (selectedRoles.length === 0) {
      toast.error('User must have at least one role')
      return
    }

    // Validate: primary role must be in selected roles
    if (!selectedRoles.includes(primaryRole)) {
      toast.error('Primary role must be one of the selected roles')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch(`/api/admin/users/${user.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: primaryRole,
          roles: selectedRoles,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update roles')
      }

      toast.success('Roles updated successfully')
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error updating roles:', error)
      toast.error(error.message || 'Failed to update roles')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Edit User Roles</h2>
              <p className="text-sm text-gray-500">
                {user?.full_name || user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Role
            </label>
            <p className="text-xs text-gray-500 mb-3">
              The main role that determines default permissions and display
            </p>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_ROLES.map(role => (
                <button
                  key={role.id}
                  onClick={() => setAsPrimary(role.id)}
                  disabled={!selectedRoles.includes(role.id)}
                  className={`
                    px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all
                    ${primaryRole === role.id
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : selectedRoles.includes(role.id)
                        ? 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                        : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                    }
                    ${!selectedRoles.includes(role.id) ? 'opacity-50' : ''}
                  `}
                >
                  <div className="flex items-center gap-2">
                    {primaryRole === role.id && <Check className="h-3 w-3" />}
                    {role.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              All Roles
            </label>
            <p className="text-xs text-gray-500 mb-3">
              A user can have multiple roles. Select all that apply.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {AVAILABLE_ROLES.map(role => (
                <button
                  key={role.id}
                  onClick={() => toggleRole(role.id)}
                  className={`
                    p-4 rounded-lg border-2 text-left transition-all
                    ${selectedRoles.includes(role.id)
                      ? `${role.color} border-current`
                      : 'border-gray-200 bg-white hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {selectedRoles.includes(role.id) && (
                          <Check className="h-4 w-4 flex-shrink-0" />
                        )}
                        <span className="font-medium">{role.label}</span>
                      </div>
                      <p className="text-xs opacity-75">{role.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Roles Summary */}
          {selectedRoles.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Selected Roles ({selectedRoles.length}):
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedRoles.map(roleId => {
                  const role = AVAILABLE_ROLES.find(r => r.id === roleId)
                  return (
                    <span
                      key={roleId}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${role?.color || ''}`}
                    >
                      {role?.label}
                      {roleId === primaryRole && ' (Primary)'}
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || selectedRoles.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
