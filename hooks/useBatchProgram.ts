'use client'

import { useMemo } from 'react';
import { useBatches } from './useBatches';
import { usePrograms } from './usePrograms';
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
    is_free?: boolean;
    price?: number;
    total_quota?: number;
    registered_count?: number;
    duration_weeks?: number;
  };
}

interface BatchWithStats extends Batch {
  registered_count?: number;
  programs_count?: number;
}

/**
 * Enhanced hook that combines batches and programs using SWR
 * Replaces the old manual fetch implementation
 */
export function useBatchProgram() {
  const { batches, isLoading: batchesLoading, error: batchesError } = useBatches({ status: 'open' });
  const { programs, isLoading: programsLoading, error: programsError } = usePrograms();

  // Combine loading states
  const loading = batchesLoading || programsLoading;

  // Combine errors
  const error = batchesError || programsError;

  // Transform programs to include batch information
  const programsWithBatch = useMemo(() => {
    if (!programs.length || !batches.length) return [];

    return programs.map(program => {
      const batch = batches.find(b => b.id === program.batch_id);
      return {
        ...program,
        batch: batch ? {
          id: batch.id,
          name: batch.name,
          description: batch.description,
          start_date: batch.start_date,
          end_date: batch.end_date,
          status: batch.status,
          registration_start_date: batch.registration_start_date,
          registration_end_date: batch.registration_end_date,
          is_free: batch.is_free,
          price: batch.price,
          total_quota: batch.total_quota,
          registered_count: batch.registered_count,
          duration_weeks: batch.duration_weeks,
        } : {
          id: '',
          name: 'Unknown Batch',
          start_date: '',
          end_date: '',
          status: 'unknown',
        }
      };
    }) as ProgramWithBatch[];
  }, [programs, batches]);

  // Calculate batch statistics
  const batchStats = useMemo(() => {
    return batches.map(batch => ({
      ...batch,
      registered_count: batch.registered_count || 0,
      programs_count: programs.filter(p => p.batch_id === batch.id).length,
    })) as BatchWithStats[];
  }, [batches, programs]);

  // Get active batch (status: 'open')
  const activeBatch = useMemo(() => {
    return batches.find(batch => batch.status === 'open') || null;
  }, [batches]);

  // Get programs for active batch
  const activeBatchPrograms = useMemo(() => {
    if (!activeBatch) return [];
    return programsWithBatch.filter(program => program.batch_id === activeBatch.id);
  }, [activeBatch, programsWithBatch]);

  // Check if there are any open batches
  const hasOpenBatches = useMemo(() => {
    return batches.some(batch => batch.status === 'open');
  }, [batches]);

  // Get registration status summary
  const registrationSummary = useMemo(() => {
    const totalRegistrations = programsWithBatch.reduce((sum, program) => {
      return sum + (program.batch.registered_count || 0);
    }, 0);

    const totalCapacity = programsWithBatch.reduce((sum, program) => {
      return sum + (program.batch.total_quota || 0);
    }, 0);

    return {
      totalRegistrations,
      totalCapacity,
      availableSpots: totalCapacity - totalRegistrations,
      utilizationRate: totalCapacity > 0 ? (totalRegistrations / totalCapacity) * 100 : 0,
    };
  }, [programsWithBatch]);

  return {
    // Replaced old state with SWR data
    batches: batchStats,
    programs: programsWithBatch,
    activeBatch,
    activeBatchPrograms,
    hasOpenBatches,

    // Statistics
    registrationSummary,

    // Loading and error states
    loading,
    error,

    // Computed properties
    isEmpty: !loading && !batches.length,
    hasPrograms: programsWithBatch.length > 0,
  };
}

export default useBatchProgram;