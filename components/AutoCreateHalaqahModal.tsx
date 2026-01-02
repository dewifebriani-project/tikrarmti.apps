'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle2, AlertCircle, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

interface AutoCreateHalaqahModalProps {
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
  batch?: { name: string };
}

interface MuallimahRegistration {
  id: string;
  user_id: string;
  full_name?: string;
  preferred_juz?: number;
  status: string;
  user?: {
    id: string;
    full_name?: string;
    email?: string;
  };
}

interface CreateResult {
  muallimah: string;
  halaqahCreated: number;
  success: boolean;
  error?: string;
}

export function AutoCreateHalaqahModal({ onClose, onSuccess }: AutoCreateHalaqahModalProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CreateResult[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [muallimahCount, setMuallimahCount] = useState(0);

  useEffect(() => {
    loadBatches();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      loadPrograms();
      loadMuallimahCount();
    }
  }, [selectedBatch]);

  const loadBatches = async () => {
    const { data, error } = await supabase
      .from('batches')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load batches');
    } else {
      setBatches(data || []);
      if (data && data.length > 0) {
        setSelectedBatch(data[0].id);
      }
    }
  };

  const loadPrograms = async () => {
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('batch_id', selectedBatch)
      .in('status', ['open', 'ongoing']);

    if (error) {
      toast.error('Failed to load programs');
    } else {
      setPrograms(data || []);
      // Select all programs by default
      setSelectedPrograms(data?.map((p: Program) => p.id) || []);
    }
  };

  const loadMuallimahCount = async () => {
    const { count, error } = await supabase
      .from('muallimah_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('batch_id', selectedBatch)
      .eq('status', 'approved');

    if (!error) {
      setMuallimahCount(count || 0);
    }
  };

  const handleAutoCreate = async () => {
    if (!selectedBatch || selectedPrograms.length === 0) {
      toast.error('Please select a batch and at least one program');
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      // Fetch approved muallimah registrations
      const { data: muallimahs, error: muallimahError } = await supabase
        .from('muallimah_registrations')
        .select(`
          id,
          user_id,
          full_name,
          preferred_juz,
          status,
          user:user_id(id, full_name, email)
        `)
        .eq('batch_id', selectedBatch)
        .eq('status', 'approved');

      if (muallimahError || !muallimahs) {
        toast.error('No approved muallimah found');
        setLoading(false);
        return;
      }

      const createResults: CreateResult[] = [];

      // Process each muallimah
      for (const muallimah of muallimahs) {
        try {
          const response = await fetch('/api/halaqah/auto-create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              muallimah_id: muallimah.id,
              program_ids: selectedPrograms,
            }),
          });

          const data = await response.json();

          if (response.ok) {
            createResults.push({
              muallimah: muallimah.full_name || muallimah.user?.full_name || muallimah.user?.email || 'Unknown',
              halaqahCreated: data.halaqah_created || 0,
              success: true,
            });
          } else {
            createResults.push({
              muallimah: muallimah.full_name || muallimah.user?.full_name || muallimah.user?.email || 'Unknown',
              halaqahCreated: 0,
              success: false,
              error: data.error || 'Unknown error',
            });
          }
        } catch (err) {
          createResults.push({
            muallimah: muallimah.full_name || muallimah.user?.full_name || muallimah.user?.email || 'Unknown',
            halaqahCreated: 0,
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }

      setResults(createResults);

      const successCount = createResults.filter(r => r.success).length;
      const totalHalaqah = createResults.reduce((sum, r) => sum + r.halaqahCreated, 0);

      if (successCount > 0) {
        toast.success(`Created ${totalHalaqah} halaqah for ${successCount} muallimah`);
        onSuccess();
      } else {
        toast.error('Failed to create any halaqah');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to auto-create halaqah');
    } finally {
      setLoading(false);
    }
  };

  const toggleProgram = (programId: string) => {
    setSelectedPrograms(prev =>
      prev.includes(programId)
        ? prev.filter(id => id !== programId)
        : [...prev, programId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Auto-Create Halaqah</h2>
            <p className="text-sm text-gray-600 mt-1">
              Batch create halaqah for all approved muallimah based on their schedules
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {results.length === 0 ? (
            <>
              {/* Batch Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Batch
                </label>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-900 focus:border-transparent"
                >
                  <option value="">Select a batch...</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Muallimah Count */}
              {selectedBatch && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-green-900" />
                    <div>
                      <p className="text-sm font-medium text-green-900">
                        {muallimahCount} Approved Muallimah
                      </p>
                      <p className="text-xs text-green-700">
                        Halaqah will be created based on their normalized schedules
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Program Selection */}
              {selectedBatch && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Programs
                  </label>
                  <div className="space-y-2">
                    {programs.map((program) => (
                      <label
                        key={program.id}
                        className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPrograms.includes(program.id)}
                          onChange={() => toggleProgram(program.id)}
                          className="w-4 h-4 text-green-900 border-gray-300 rounded focus:ring-green-900"
                        />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{program.name}</p>
                          <p className="text-xs text-gray-500">Type: {program.class_type}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> This will create halaqah for each muallimah's schedule from the
                  normalized muallimah_schedules table. Each schedule will create one halaqah instance.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Results */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Creation Results</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-md border ${
                        result.success
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {result.success ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{result.muallimah}</p>
                          {result.success ? (
                            <p className="text-sm text-green-700">
                              {result.halaqahCreated} halaqah created
                            </p>
                          ) : (
                            <p className="text-sm text-red-700">{result.error}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          {results.length === 0 ? (
            <>
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAutoCreate}
                disabled={loading || !selectedBatch || selectedPrograms.length === 0}
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
                    Auto-Create Halaqah
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-green-900 text-white rounded-md hover:bg-green-800 transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
