import { useState, useEffect } from 'react';
import { Batch, Program } from '@/types/database';

interface ProgramWithBatch extends Program {
  batch: {
    id: string;
    name: string;
    description?: string;
    start_date: string;
    end_date: string;
    status: string;
    registration_start_date?: string;
    registration_end_date?: string;
  };
}

interface BatchWithStats extends Batch {
  registered_count?: number;
  programs_count?: number;
}

export function useBatchProgram() {
  const [batches, setBatches] = useState<BatchWithStats[]>([]);
  const [programs, setPrograms] = useState<ProgramWithBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBatches();
    fetchPrograms();
  }, []);

  const fetchBatches = async () => {
    try {
      const response = await fetch('/api/batch');
      if (!response.ok) {
        throw new Error('Failed to fetch batches');
      }
      const data = await response.json();
      setBatches(data || []);
    } catch (err) {
      console.error('Error fetching batches:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch batches');
    }
  };

  const fetchPrograms = async (batchId?: string) => {
    try {
      let url = '/api/program';
      if (batchId) {
        url += `?batch_id=${batchId}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch programs');
      }
      const data = await response.json();
      setPrograms(data || []);
    } catch (err) {
      console.error('Error fetching programs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch programs');
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    setLoading(true);
    fetchBatches();
    fetchPrograms();
  };

  return {
    batches,
    programs,
    loading,
    error,
    refetch,
    fetchPrograms
  };
}