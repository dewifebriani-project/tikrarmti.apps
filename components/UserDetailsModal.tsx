'use client';

import { useState, useEffect } from 'react';
import type { User } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Clock,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Shield,
  Globe,
  MessageSquare
} from 'lucide-react';

interface UserDetailsModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (user: User) => void;
  onDelete?: (userId: string) => void;
}

export default function UserDetailsModal({
  user,
  isOpen,
  onClose,
  onEdit,
  onDelete
}: UserDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'admin': 'destructive',
      'tim_seleksi': 'secondary',
      'tim_ujian_akhir': 'outline',
      'muallimah': 'default',
      'musyrifah': 'secondary',
      'thalibah': 'default',
      'calon_thalibah': 'outline',
      'donatur': 'default'
    };
    return variants[role] || 'outline';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user.avatar_url} alt={user.full_name} />
              <AvatarFallback className="text-lg">
                {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                {user.full_name}
              </DialogTitle>
              <p className="text-gray-500">{user.email}</p>
              <Badge variant={getRoleBadgeVariant(user.role)} className="mt-1">
                {user.role.replace('_', ' ')}
              </Badge>
            </div>
          </div>
          <div className="flex space-x-2">
            {onEdit && (
              <button
                onClick={() => onEdit(user)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit User"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(user.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete User"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </DialogHeader>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'profile'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <UserIcon className="w-4 h-4" />
                <span>Profil</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'settings'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Pengaturan</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <UserIcon className="w-5 h-5 mr-2 text-green-600" />
                  Informasi Dasar
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">ID User</span>
                    <span className="font-mono text-sm">{user.id}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Email</span>
                    <span className="flex items-center">
                      <Mail className="w-4 h-4 mr-1 text-gray-400" />
                      {user.email}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">No Telepon</span>
                    <span className="flex items-center">
                      <Phone className="w-4 h-4 mr-1 text-gray-400" />
                      {user.phone || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Status</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Aktif
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  Informasi Pribadi
                </h3>
                <div className="space-y-3">
                  <>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Nama Lengkap</span>
                        <span>{user.namaLengkap || user.full_name || '-'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Nama Panggilan</span>
                        <span>{user.namaPanggilan || '-'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Tanggal Lahir</span>
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                          {user.tanggalLahir || '-'}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">Alamat</span>
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                          {user.alamat || '-'}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-600">WhatsApp</span>
                        <span className="flex items-center">
                          <Phone className="w-4 h-4 mr-1 text-gray-400" />
                          {user.phone || '-'}
                        </span>
                      </div>
                    </>
                  </div>
              </div>

              {/* Account Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-purple-600" />
                  Informasi Akun
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Tanggal Gabung</span>
                    <span>{formatDate(user.createdAt)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Terakhir Update</span>
                    <span>{formatDate(user.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-red-600" />
                Pengaturan & Keamanan
              </h3>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Perhatian</h4>
                    <p className="text-yellow-700 text-sm mt-1">
                      Modifikasi pengaturan akun dapat mempengaruhi akses pengguna ke sistem.
                      Pastikan Ukhti memiliki izin yang cukup sebelum melakukan perubahan.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Status Akun</h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={true}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        readOnly
                      />
                      <span className="text-gray-700">Akun Aktif</span>
                    </label>
                    <p className="text-sm text-gray-500">
                      Akun ini saat ini aktif dan dapat mengakses sistem.
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Izin Akses</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Role saat ini:</span>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      Role menentukan tingkat akses pengguna ke berbagai fitur sistem.
                    </p>
                  </div>
                </div>

                {onEdit && onDelete && (
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Tindakan Akun</h4>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => onEdit(user)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Pengguna
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Apakah Ukhti yakin ingin menghapus pengguna ini?')) {
                            onDelete(user.id);
                            onClose();
                          }
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Hapus Pengguna
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}