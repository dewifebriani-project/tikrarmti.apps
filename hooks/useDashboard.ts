'use client'

import useSWR from 'swr'
import { useCallback } from 'react'
import { getFetcher } from '@/lib/swr/fetchers'
import { User } from '@/types/database'

/**
 * Type for dashboard statistics
 */
export interface DashboardStats {
  totalHariTarget?: number;
  hariAktual?: number;
  persentaseProgress?: number;
  totalRegistrations?: number;
  activeBatches?: number;
  activePrograms?: number;
  pendingApprovals?: number;
  completedRegistrations?: number;
  totalUsers?: number;
  userGrowth?: {
    new: number;
    active: number;
    total: number;
  };
  recentActivity?: Array<{
    id: string;
    type: 'registration' | 'approval' | 'batch_update';
    description: string;
    timestamp: string;
    user?: {
      name: string;
      avatar?: string;
    };
  }>;
}

/**
 * Type for user progress data
 */
export interface UserProgress {
  totalDays: number;
  completedDays: number;
  percentage: number;
  currentStreak: number;
  longestStreak: number;
  lastActivity: string;
  milestones: Array<{
    id: string;
    title: string;
    description: string;
    completed: boolean;
    completedAt?: string;
    dueDate: string;
  }>;
  weeklyProgress: Array<{
    week: string;
    target: number;
    actual: number;
    percentage: number;
  }>;
}

/**
 * Type for learning journey data
 */
export interface LearningJourney {
  registrations: Array<{
    id: string;
    batchName: string;
    programName: string;
    status: 'pending' | 'approved' | 'active' | 'completed';
    startDate: string;
    endDate?: string;
    progress: number;
  }>;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    earnedAt: string;
  }>;
  certificates: Array<{
    id: string;
    title: string;
    programName: string;
    issuedAt: string;
    downloadUrl: string;
  }>;
}

/**
 * Hook for fetching dashboard statistics
 */
export function useDashboardStats() {
  const { data, error, isLoading, mutate } = useSWR<DashboardStats>(
    '/api/dashboard/stats',
    async (url: string) => {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard stats')
        }

        const result = await response.json()
        return result.data || result
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        return null
      }
    },
    {
      revalidateOnFocus: true,
      refreshInterval: 30000, // 30 seconds
      dedupingInterval: 60000, // 1 minute
      fallbackData: {
        totalHariTarget: 0,
        hariAktual: 0,
        persentaseProgress: 0,
        totalRegistrations: 0,
        activeBatches: 0,
        activePrograms: 0,
        pendingApprovals: 0,
        completedRegistrations: 0,
      },
    }
  )

  return {
    stats: data || {
      totalHariTarget: 0,
      hariAktual: 0,
      persentaseProgress: 0,
      totalRegistrations: 0,
      activeBatches: 0,
      activePrograms: 0,
      pendingApprovals: 0,
      completedRegistrations: 0,
    },
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

/**
 * Hook for fetching user dashboard statistics (non-admin users)
 */
export function useUserDashboardStats() {
  const { data, error, isLoading, mutate } = useSWR<DashboardStats>(
    '/api/dashboard/user-stats',
    getFetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 30000,
      dedupingInterval: 60000,
      fallbackData: {
        totalHariTarget: 0,
        hariAktual: 0,
        persentaseProgress: 0,
      },
    }
  )

  return {
    stats: data || {
      totalHariTarget: 0,
      hariAktual: 0,
      persentaseProgress: 0,
    },
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

/**
 * Hook for fetching user progress data
 */
export function useUserProgress() {
  const { data, error, isLoading, mutate } = useSWR<UserProgress>(
    '/api/dashboard/progress',
    async (url: string) => {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Failed to fetch user progress')
        }

        const result = await response.json()
        return result.data || result
      } catch (error) {
        console.error('Error fetching user progress:', error)
        return null
      }
    },
    {
      revalidateOnFocus: true,
      refreshInterval: 30000,
      dedupingInterval: 60000,
      fallbackData: {
        totalDays: 0,
        completedDays: 0,
        percentage: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastActivity: new Date().toISOString(),
        milestones: [],
        weeklyProgress: [],
      },
    }
  )

  return {
    progress: data || {
      totalDays: 0,
      completedDays: 0,
      percentage: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActivity: new Date().toISOString(),
      milestones: [],
      weeklyProgress: [],
    },
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

/**
 * Hook for fetching learning journey data
 */
export function useLearningJourney() {
  const { data, error, isLoading, mutate } = useSWR<LearningJourney>(
    '/api/dashboard/journey',
    getFetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 30000,
      dedupingInterval: 60000,
      fallbackData: {
        registrations: [],
        achievements: [],
        certificates: [],
      },
    }
  )

  return {
    journey: data || {
      registrations: [],
      achievements: [],
      certificates: [],
    },
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

/**
 * Hook for fetching recent activity
 */
export function useRecentActivity(limit = 10) {
  const { data, error, isLoading, mutate } = useSWR<
    DashboardStats['recentActivity']
  >(
    `/api/dashboard/activity?limit=${limit}`,
    getFetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 30000,
      dedupingInterval: 60000,
      fallbackData: [],
    }
  )

  return {
    activities: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

/**
 * Hook for fetching admin dashboard analytics
 */
export function useAdminAnalytics(dateRange?: { start: string; end: string }) {
  const queryString = dateRange
    ? `?start=${encodeURIComponent(dateRange.start)}&end=${encodeURIComponent(dateRange.end)}`
    : ''

  const { data, error, isLoading, mutate } = useSWR(
    `/api/dashboard/analytics${queryString}`,
    getFetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 30000,
      dedupingInterval: 60000,
    }
  )

  return {
    analytics: data || null,
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

/**
 * Hook for fetching quick stats cards data
 */
export function useQuickStats() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/dashboard/quick-stats',
    getFetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 30000,
      dedupingInterval: 60000,
      fallbackData: {
        users: { total: 0, active: 0, new: 0 },
        registrations: { total: 0, pending: 0, approved: 0 },
        batches: { total: 0, active: 0, upcoming: 0 },
        revenue: { total: 0, monthly: 0, growth: 0 },
      },
    }
  )

  return {
    quickStats: data || {
      users: { total: 0, active: 0, new: 0 },
      registrations: { total: 0, pending: 0, approved: 0 },
      batches: { total: 0, active: 0, upcoming: 0 },
      revenue: { total: 0, monthly: 0, growth: 0 },
    },
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

/**
 * Hook for personalized dashboard recommendations
 */
export function useDashboardRecommendations() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/dashboard/recommendations',
    getFetcher,
    {
      revalidateOnFocus: false, // Don't auto-refresh recommendations
      dedupingInterval: 600000, // 10 minutes cache
      refreshInterval: 0,
      fallbackData: {
        programs: [],
        actions: [],
        tips: [],
      },
    }
  )

  return {
    recommendations: data || {
      programs: [],
      actions: [],
      tips: [],
    },
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

/**
 * Hook for dashboard notifications
 */
export function useDashboardNotifications() {
  const { data, error, isLoading, mutate } = useSWR<any[]>(
    '/api/dashboard/notifications',
    async (url: string) => {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Failed to fetch notifications')
        }

        const result = await response.json()
        return result.data || result || []
      } catch (error) {
        console.error('Error fetching notifications:', error)
        return []
      }
    },
    {
      revalidateOnFocus: true,
      refreshInterval: 30000,
      dedupingInterval: 60000,
      fallbackData: [],
    }
  )

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/dashboard/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to mark notification as read')
      }

      // Revalidate notifications
      await mutate()
    } catch (error) {
      console.error('Mark notification as read error:', error)
      throw error
    }
  }, [mutate])

  return {
    notifications: data || [],
    isLoading,
    isError: !!error,
    error,
    mutate,
    markAsRead,
    unreadCount: data?.filter(n => !n.read).length || 0,
  }
}

/**
 * Hook for system health and performance metrics
 */
export function useSystemHealth() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/dashboard/health',
    getFetcher,
    {
      revalidateOnFocus: false, // Don't auto-refresh health
      dedupingInterval: 30000, // 30 seconds cache
      refreshInterval: 60000, // Refresh every minute
      fallbackData: {
        status: 'healthy',
        database: 'connected',
        storage: 'connected',
        responseTime: 0,
        uptime: 0,
      },
    }
  )

  return {
    health: data || {
      status: 'healthy',
      database: 'connected',
      storage: 'connected',
      responseTime: 0,
      uptime: 0,
    },
    isLoading,
    isError: !!error,
    error,
    mutate,
  }
}

export default useDashboardStats