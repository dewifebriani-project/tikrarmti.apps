import { supabase } from './supabase-singleton';

interface SessionManager {
  checkSession(): Promise<boolean>;
  refreshSession(): Promise<boolean>;
  extendSession(): Promise<boolean>;
  getSessionInfo(): Promise<{ valid: boolean; expiresAt: Date | null; timeUntilExpiry: number }>;
}

export const sessionManager: SessionManager = {
  /**
   * Check if current session is valid
   */
  async checkSession(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        console.error('Session check failed:', error);
        return false;
      }

      // Check if session is expired
      const now = new Date();
      const expiresAt = new Date(session.expires_at! * 1000);

      return now < expiresAt;
    } catch (error) {
      console.error('Error checking session:', error);
      return false;
    }
  },

  /**
   * Refresh the current session
   */
  async refreshSession(): Promise<boolean> {
    try {
      console.log('Attempting to refresh session...');

      const { error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('Session refresh failed:', error);
        return false;
      }

      console.log('Session refreshed successfully');
      return true;
    } catch (error) {
      console.error('Error refreshing session:', error);
      return false;
    }
  },

  /**
   * Extend session duration to 30 days
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
      console.log('Session extended successfully:', result);
      return true;
    } catch (error) {
      console.error('Error extending session:', error);
      return false;
    }
  },

  /**
   * Get session information including expiration
   */
  async getSessionInfo(): Promise<{ valid: boolean; expiresAt: Date | null; timeUntilExpiry: number }> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        return { valid: false, expiresAt: null, timeUntilExpiry: 0 };
      }

      const now = new Date();
      const expiresAt = new Date(session.expires_at! * 1000);
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();

      return {
        valid: now < expiresAt,
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