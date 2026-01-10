'use client';

import { useState, useEffect } from 'react';
import { Users, Clock, ArrowUp, Loader2, UserMinus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

interface HalaqahStudentsListProps {
  halaqahId: string;
  refreshTrigger?: number;
}

interface Student {
  id: string;
  thalibah_id: string;
  status: 'active' | 'waitlist' | 'graduated' | 'dropped';
  joined_waitlist_at?: string;
  promoted_from_waitlist_at?: string;
  created_at: string;
  thalibah?: {
    id: string;
    full_name?: string;
    email?: string;
  };
}

interface CapacityInfo {
  active_students: number;
  waitlist_students: number;
  max_students: number;
  spots_available: number;
  is_full: boolean;
}

export function HalaqahStudentsList({ halaqahId, refreshTrigger }: HalaqahStudentsListProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [capacity, setCapacity] = useState<CapacityInfo | null>(null);
  const [promoting, setPromoting] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    loadStudents();
  }, [halaqahId, refreshTrigger]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      // Fetch students with their info
      const { data: studentsData, error: studentsError } = await supabase
        .from('halaqah_students')
        .select(`
          *,
          thalibah:users!halaqah_students_thalibah_id_fkey(id, full_name, email)
        `)
        .eq('halaqah_id', halaqahId)
        .order('created_at', { ascending: true });

      if (studentsError) throw studentsError;

      // Fetch capacity info
      const activeCount = studentsData?.filter((s: Student) => s.status === 'active').length || 0;
      const waitlistCount = studentsData?.filter((s: Student) => s.status === 'waitlist').length || 0;

      // Get halaqah to find max students
      const { data: halaqah } = await supabase
        .from('halaqah')
        .select('max_students')
        .eq('id', halaqahId)
        .single();

      const maxStudents = halaqah?.max_students || 20;

      setStudents(studentsData || []);
      setCapacity({
        active_students: activeCount,
        waitlist_students: waitlistCount,
        max_students: maxStudents,
        spots_available: Math.max(0, maxStudents - activeCount),
        is_full: activeCount >= maxStudents,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handlePromote = async (studentId: string) => {
    setPromoting(studentId);
    try {
      const response = await fetch(`/api/halaqah/${halaqahId}/promote-waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to promote student');
      }

      toast.success('Student promoted to active');
      loadStudents();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to promote student');
    } finally {
      setPromoting(null);
    }
  };

  const handleRemove = async (studentId: string) => {
    if (!confirm('Are you sure you want to remove this student from the halaqah?')) {
      return;
    }

    setRemoving(studentId);
    try {
      const response = await fetch(`/api/halaqah/${halaqahId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thalibah_id: studentId, force: true }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove student');
      }

      toast.success('Student removed from halaqah');
      loadStudents();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove student');
    } finally {
      setRemoving(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const activeStudents = students.filter(s => s.status === 'active');
  const waitlistStudents = students.filter(s => s.status === 'waitlist').sort((a, b) =>
    new Date(a.joined_waitlist_at || 0).getTime() - new Date(b.joined_waitlist_at || 0).getTime()
  );

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Capacity Info */}
      {capacity && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Active Students</p>
                <p className="text-2xl font-bold text-green-900">{capacity.active_students}</p>
              </div>
              <Users className="w-8 h-8 text-green-200" />
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Capacity</p>
                <p className="text-2xl font-bold text-blue-900">
                  {capacity.active_students}/{capacity.max_students}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-200" />
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Waitlist</p>
                <p className="text-2xl font-bold text-yellow-900">{capacity.waitlist_students}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-200" />
            </div>
          </div>
          <div className={`border rounded-lg p-4 ${
            capacity.is_full
              ? 'bg-red-50 border-red-200'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${
                  capacity.is_full ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {capacity.is_full ? 'Full' : 'Available'}
                </p>
                <p className={`text-2xl font-bold ${
                  capacity.is_full ? 'text-red-900' : 'text-gray-900'
                }`}>
                  {capacity.spots_available}
                </p>
              </div>
              <Users className={`w-8 h-8 ${
                capacity.is_full ? 'text-red-200' : 'text-gray-300'
              }`} />
            </div>
          </div>
        </div>
      )}

      {/* Active Students */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Active Students</h3>
        {activeStudents.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">No active students</p>
        ) : (
          <div className="space-y-2">
            {activeStudents.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {student.thalibah?.full_name || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {student.thalibah?.email || 'No email'}
                  </p>
                  <p className="text-xs text-gray-400">
                    Joined: {formatDate(student.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => handleRemove(student.thalibah_id)}
                  disabled={removing === student.thalibah_id}
                  className="ml-3 p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                  title="Remove from halaqah"
                >
                  {removing === student.thalibah_id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserMinus className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Waitlist Students */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-yellow-600" />
          Waitlist Students
        </h3>
        {waitlistStudents.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">No students on waitlist</p>
        ) : (
          <div className="space-y-2">
            {waitlistStudents.map((student, index) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-yellow-200 text-yellow-800 rounded-full flex items-center justify-center text-xs font-bold">
                    #{index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">
                      {student.thalibah?.full_name || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {student.thalibah?.email || 'No email'}
                    </p>
                    <p className="text-xs text-gray-400">
                      Joined waitlist: {student.joined_waitlist_at ? formatDate(student.joined_waitlist_at) : 'N/A'}
                    </p>
                  </div>
                </div>
                {capacity && !capacity.is_full && (
                  <button
                    onClick={() => handlePromote(student.id)}
                    disabled={promoting === student.id}
                    className="ml-3 px-3 py-1.5 bg-green-900 text-white text-sm rounded-md hover:bg-green-800 transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    {promoting === student.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <ArrowUp className="w-3 h-3" />
                        Promote
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
