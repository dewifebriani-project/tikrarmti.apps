import { supabase } from './supabase-singleton';

interface SessionManager {
  checkSession(): Promise<boolean>;
  refreshSession(): Promise<boolean>;
  extendSession(): Promise<boolean>;
  getSessionInfo(): Promise<{ valid: boolean; expiresAt: Date | null; timeUntilExpiry: number }>;
  forceRefreshSession(): Promise<boolean>;
}

export const sessionManager: SessionManager = {
  /**
   * Check if current session is valid with multiple fallback methods
   */
  async checkSession(): Promise<boolean> {
    try {
      // Method 1: Direct session check
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.warn('Session check method 1 failed:', error);

        // Method 2: Try to get user directly
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            console.log('Session valid via user check method');
            return true;
          }
        } catch (userError) {
          console.warn('User check also failed:', userError);
        }

        return false;
      }

      if (!session) {
        console.warn('No session found');
        return false;
      }

      // Check if session is expired
      const now = new Date();
      const expiresAt = new Date(session.expires_at! * 1000);
      const isExpired = now >= expiresAt;

      if (isExpired) {
        console.warn('Session expired');
        return false;
      }

      // Check if session expires within 5 minutes (borderline case)
      const fiveMinutes = 5 * 60 * 1000;
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();

      if (timeUntilExpiry < fiveMinutes) {
        console.warn('Session expires soon, refresh needed');
        return false;
      }

      console.log('Session is valid');
      return true;

    } catch (error) {
      console.error('Critical error checking session:', error);
      return false;
    }
  },

  /**
   * Refresh the current session with retry mechanism
   */
  async refreshSession(): Promise<boolean> {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Refreshing session (attempt ${attempt}/${maxRetries})...`);

        // Clear any existing session data first
        if (attempt > 1) {
          console.log('Clearing session data before retry...');
          await supabase.auth.signOut({ scope: 'local' });
        }

        const { data, error } = await supabase.auth.refreshSession();

        if (error) {
          console.warn(`Session refresh attempt ${attempt} failed:`, error);

          if (attempt < maxRetries) {
            console.log(`Waiting ${retryDelay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            continue;
          }

          return false;
        }

        if (data?.session) {
          console.log('Session refreshed successfully');

          // Verify the refreshed session
          const isValid = await this.checkSession();
          if (isValid) {
            return true;
          } else {
            console.warn('Refreshed session failed validation');
          }
        }

      } catch (error) {
        console.error(`Critical error in refresh attempt ${attempt}:`, error);

        if (attempt < maxRetries) {
          console.log(`Waiting ${retryDelay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }

    console.error('All session refresh attempts failed');
    return false;
  },

  /**
   * Force refresh session with multiple strategies
   */
  async forceRefreshSession(): Promise<boolean> {
    try {
      console.log('Attempting force session refresh...');

      // Strategy 1: Normal refresh
      const normalRefresh = await this.refreshSession();
      if (normalRefresh) {
        return true;
      }

      console.log('Normal refresh failed, trying alternative strategies...');

      // Strategy 2: Get current session and reset it
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token && session?.refresh_token) {
        const { error: resetError } = await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token
        });

        if (!resetError) {
          console.log('Session reset successfully');
          return true;
        }
      }

      console.log('All force refresh strategies failed');
      return false;

    } catch (error) {
      console.error('Force refresh failed:', error);
      return false;
    }
  },

  /**
   * Extend session duration (best effort)
   */
  async extendSession(): Promise<boolean> {
    try {
      console.log('Attempting to extend session duration...');

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error('No session to extend:', sessionError);
        return false;
      }

      // Call the API to extend session
      const response = await fetch('/api/auth/extend-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to extend session:', errorData);
        return false;
      }

      const result = await response.json();
      console.log('Session extension completed:', result);
      return true;

    } catch (error) {
      console.error('Error extending session:', error);
      return false;
    }
  },

  /**
   * Get session information with comprehensive validation
   */
  async getSessionInfo(): Promise<{ valid: boolean; expiresAt: Date | null; timeUntilExpiry: number }> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        console.warn('No session available for info');
        return { valid: false, expiresAt: null, timeUntilExpiry: 0 };
      }

      const now = new Date();
      const expiresAt = new Date(session.expires_at! * 1000);
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();
      const isValid = now < expiresAt;

      console.log('Session info:', {
        valid: isValid,
        expiresAt: expiresAt.toISOString(),
        timeUntilExpiry: Math.round(timeUntilExpiry / (1000 * 60)) + ' minutes'
      });

      return {
        valid: isValid,
        expiresAt,
        timeUntilExpiry
      };

    } catch (error) {
      console.error('Error getting session info:', error);
      return { valid: false, expiresAt: null, timeUntilExpiry: 0 };
    }
  }
};

/**
 * Auto-extend session when user is active
 * Call this periodically to maintain session
 */
export const autoExtendSession = async (): Promise<void> => {
  try {
    const { valid, timeUntilExpiry } = await sessionManager.getSessionInfo();

    if (!valid) {
      console.log('Session is invalid, cannot extend');
      return;
    }

    // Extend if session expires in less than 7 days
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    if (timeUntilExpiry < sevenDays) {
      console.log('Session expires soon, extending...');
      const extended = await sessionManager.extendSession();

      if (extended) {
        console.log('Session successfully extended to 30 days');
      } else {
        console.log('Failed to extend session, trying refresh...');
        await sessionManager.refreshSession();
      }
    }
  } catch (error) {
    console.error('Error in auto-extend session:', error);
  }
};

/**
 * Periodic session checker for background maintenance
 */
export class SessionMaintenance {
  private intervalId: NodeJS.Timeout | null = null;

  start(intervalMinutes: number = 30): void {
    if (this.intervalId) {
      this.stop();
    }

    console.log(`Starting session maintenance every ${intervalMinutes} minutes`);

    this.intervalId = setInterval(async () => {
      try {
        await autoExtendSession();
      } catch (error) {
        console.error('Error in session maintenance:', error);
      }
    }, intervalMinutes * 60 * 1000);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Session maintenance stopped');
    }
  }
}

export const sessionMaintenance = new SessionMaintenance();