'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Users, Calendar, Clock, MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

interface AddHalaqahModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface Batch {
  id: string;
  name: string;
  status: string;
}

interface Program {
  id: string;
  name: string;
  class_type: string;
  batch_id: string;
}

interface Muallimah {
  id: string;
  full_name: string;
  email?: string;
  user_id: string;
  preferred_juz?: string;
}

interface HalaqahFormData {
  name: string;
  description: string;
  program_id: string;
  muallimah_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  location: string;
  max_students: number;
}

const DAYS = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu'
];

export function AddHalaqahModal({ onClose, onSuccess }: AddHalaqahModalProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [muallimahs, setMuallimahs] = useState<Muallimah[]>([]);

  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [formData, setFormData] = useState<HalaqahFormData>({
    name: '',
    description: '',
    program_id: '',
    muallimah_id: '',
    day_of_week: 1,
    start_time: '',
    end_time: '',
    location: '',
    max_students: 10,
  });

  useEffect(() => {
    loadBatches();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      loadPrograms();
      loadMuallimahs();
    } else {
      setPrograms([]);
      setMuallimahs([]);
      setFormData(prev => ({ ...prev, program_id: '', muallimah_id: '' }));
    }
  }, [selectedBatch]);

  const loadBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBatches(data || []);
    } catch (error: any) {
      toast.error('Failed to load batches: ' + error.message);
    }
  };

  const loadPrograms = async () => {
    if (!selectedBatch) return;

    try {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('batch_id', selectedBatch)
        .in('status', ['open', 'ongoing']);

      if (error) throw error;
      setPrograms(data || []);
    } catch (error: any) {
      toast.error('Failed to load programs: ' + error.message);
    }
  };

  const loadMuallimahs = async () => {
    if (!selectedBatch) return;

    try {
      const { data, error } = await supabase
        .from('muallimah_registrations')
        .select('id, full_name, email, user_id, preferred_juz')
        .eq('batch_id', selectedBatch)
        .eq('status', 'approved');

      if (error) throw error;
      setMuallimahs(data || []);
    } catch (error: any) {
      toast.error('Failed to load muallimahs: ' + error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error('Please enter halaqah name');
      return;
    }
    if (!formData.program_id) {
      toast.error('Please select a program');
      return;
    }
    if (!formData.muallimah_id) {
      toast.error('Please select a muallimah');
      return;
    }
    if (!formData.start_time || !formData.end_time) {
      toast.error('Please enter start and end time');
      return;
    }

    setLoading(true);

    try {
      // Create halaqah
      const { data: halaqah, error: halaqahError } = await supabase
        .from('halaqah')
        .insert({
          program_id: formData.program_id,
          muallimah_id: formData.muallimah_id,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          day_of_week: formData.day_of_week,
          start_time: formData.start_time,
          end_time: formData.end_time,
          location: formData.location.trim() || null,
          max_students: formData.max_students || null,
          status: 'active',
        })
        .select()
        .single();

      if (halaqahError) throw halaqahError;

      toast.success('Halaqah created successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating halaqah:', error);
      toast.error('Failed to create halaqah: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Add Halaqah</h2>
            <p className="text-sm text-gray-600 mt-1">
              Create a new halaqah (study group)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Batch Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Batch *
            </label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-900 focus:border-transparent"
              required
            >
              <option value="">Select a batch...</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </select>
          </div>

          {/* Program Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Program *
            </label>
            <select
              value={formData.program_id}
              onChange={(e) => setFormData({ ...formData, program_id: e.target.value })}
              disabled={!selectedBatch || programs.length === 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-900 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              required
            >
              <option value="">Select a program...</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name} ({program.class_type})
                </option>
              ))}
            </select>
            {selectedBatch && programs.length === 0 && (
              <p className="mt-1 text-sm text-amber-600">No programs found for this batch</p>
            )}
          </div>

          {/* Muallimah Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Muallimah *
            </label>
            <select
              value={formData.muallimah_id}
              onChange={(e) => setFormData({ ...formData, muallimah_id: e.target.value })}
              disabled={!selectedBatch || muallimahs.length === 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-900 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              required
            >
              <option value="">Select a muallimah...</option>
              {muallimahs.map((muallimah) => (
                <option key={muallimah.id} value={muallimah.id}>
                  {muallimah.full_name} {muallimah.email ? `(${muallimah.email})` : ''} {muallimah.preferred_juz ? `- Juz ${muallimah.preferred_juz}` : ''}
                </option>
              ))}
            </select>
            {selectedBatch && muallimahs.length === 0 && (
              <p className="mt-1 text-sm text-amber-600">No approved muallimahs found for this batch</p>
            )}
          </div>

          {/* Halaqah Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Halaqah Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Halaqah Juz 1 - Group A"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-900 focus:border-transparent"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-900 focus:border-transparent"
            />
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Day of Week */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Day *
              </label>
              <select
                value={formData.day_of_week}
                onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-900 focus:border-transparent"
                required
              >
                {DAYS.map((day, index) => (
                  <option key={index} value={index + 1}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Start Time *
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-900 focus:border-transparent"
                required
              />
            </div>

            {/* End Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                End Time *
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-900 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Zoom, Mosque Name, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-900 focus:border-transparent"
            />
          </div>

          {/* Max Students */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              Max Students
            </label>
            <input
              type="number"
              value={formData.max_students}
              onChange={(e) => setFormData({ ...formData, max_students: parseInt(e.target.value) || 10 })}
              min="1"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-900 focus:border-transparent"
            />
          </div>

          {/* Info */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> After creating the halaqah, you can assign students to it from the halaqah list.
            </p>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-900 text-white rounded-md hover:bg-green-800 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  Create Halaqah
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
