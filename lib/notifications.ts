// Simple notification system that can be extended with email service integration

export interface NotificationData {
  to: string;
  subject: string;
  body: string;
  type: 'user_created' | 'user_updated' | 'user_deleted' | 'user_activated' | 'user_deactivated';
  userId?: string;
  metadata?: Record<string, any>;
}

export class NotificationService {
  private static instance: NotificationService;
  private notifications: NotificationData[] = [];

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Send notification (currently just logs to console, can be extended to send emails)
  public async sendNotification(notification: NotificationData): Promise<boolean> {
    try {
      console.log('📧 Sending notification:', {
        to: notification.to,
        subject: notification.subject,
        body: notification.body,
        type: notification.type,
        timestamp: new Date().toISOString()
      });

      // Log notification for audit trail
      this.notifications.push({
        ...notification,
        metadata: {
          ...notification.metadata,
          sentAt: new Date().toISOString(),
          status: 'sent'
        }
      });

      // In a real implementation, this would integrate with:
      // - Email service (SendGrid, Mailgun, AWS SES, etc.)
      // - Firebase Cloud Functions for email delivery
      // - Transactional email templates

      // For now, we'll just simulate successful sending
      await this.simulateEmailDelivery(notification);

      return true;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }

  private async simulateEmailDelivery(notification: NotificationData): Promise<void> {
    // Simulate email delivery delay
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`✅ Email delivered to ${notification.to}: ${notification.subject}`);
        resolve();
      }, 500);
    });
  }

  // Get notification history
  public getNotifications(): NotificationData[] {
    return [...this.notifications];
  }

  // Clear notifications
  public clearNotifications(): void {
    this.notifications = [];
  }
}

// Predefined notification templates
export const NotificationTemplates = {
  userCreated: (userName: string, role: string): Omit<NotificationData, 'to' | 'type'> => ({
    subject: 'Selamat Datang di Sistem MTI',
    body: `Hai ${userName},\n\nSelamat datang di Sistem Manajemen Tahfidz MTI! Akun Antunna telah berhasil dibuat dengan role: ${role}.\n\nAntunna dapat segera login dan mulai menggunakan sistem.\n\nTerima kasih,\nTim Administrator MTI`,
    metadata: {
      action: 'welcome_email',
      category: 'onboarding'
    }
  }),

  userUpdated: (userName: string, updatedFields: string[]): Omit<NotificationData, 'to' | 'type'> => ({
    subject: 'Informasi Akun Diperbarui',
    body: `Hai ${userName},\n\nInformasi akun Antunna telah diperbarui. Perubahan meliputi: ${updatedFields.join(', ')}.\n\nJika Antunna tidak melakukan perubahan ini, segera hubungi administrator.\n\nTerima kasih,\nTim Administrator MTI`,
    metadata: {
      action: 'profile_update',
      category: 'security',
      updatedFields
    }
  }),

  userDeleted: (userName: string): Omit<NotificationData, 'to' | 'type'> => ({
    subject: 'Konfirmasi Penghapusan Akun',
    body: `Hai,\n\nAkun dengan nama ${userName} telah dihapus dari sistem oleh administrator.\n\nJika ini adalah kesalahan, segera hubungi administrator.\n\nTerima kasih,\nTim Administrator MTI`,
    metadata: {
      action: 'account_deletion',
      category: 'security'
    }
  }),

  userActivated: (userName: string): Omit<NotificationData, 'to' | 'type'> => ({
    subject: 'Akun Diaktifkan Kembali',
    body: `Hai ${userName},\n\nAkun Antunna telah diaktifkan kembali. Antunna sekarang dapat mengakses semua fitur sistem.\n\nTerima kasih,\nTim Administrator MTI`,
    metadata: {
      action: 'account_activation',
      category: 'account_management'
    }
  }),

  userDeactivated: (userName: string): Omit<NotificationData, 'to' | 'type'> => ({
    subject: 'Akun Dinonaktifkan',
    body: `Hai ${userName},\n\nAkun Antunna telah dinonaktifkan sementara oleh administrator.\n\nJika Antunna memiliki pertanyaan, segera hubungi administrator.\n\nTerima kasih,\nTim Administrator MTI`,
    metadata: {
      action: 'account_deactivation',
      category: 'account_management'
    }
  }),

  // Admin notifications
  adminUserCreated: (adminName: string, userName: string, role: string): Omit<NotificationData, 'to' | 'type'> => ({
    subject: 'User Baru Telah Dibuat',
    body: `Hai ${adminName},\n\nAntunna telah berhasil membuat user baru:\n\nNama: ${userName}\nRole: ${role}\nDibuat pada: ${new Date().toLocaleString('id-ID')}\n\nTerima kasih,\nSistem MTI`,
    metadata: {
      action: 'admin_notification',
      category: 'admin_action'
    }
  }),

  adminUserUpdated: (adminName: string, userName: string, updatedFields: string[]): Omit<NotificationData, 'to' | 'type'> => ({
    subject: 'User Diperbarui',
    body: `Hai ${adminName},\n\nAntunna telah memperbarui user:\n\nNama: ${userName}\nPerubahan: ${updatedFields.join(', ')}\nDiperbarui pada: ${new Date().toLocaleString('id-ID')}\n\nTerima kasih,\nSistem MTI`,
    metadata: {
      action: 'admin_notification',
      category: 'admin_action',
      updatedFields
    }
  }),

  adminUserDeleted: (adminName: string, userName: string): Omit<NotificationData, 'to' | 'type'> => ({
    subject: 'User Dihapus',
    body: `Hai ${adminName},\n\nAntunna telah menghapus user:\n\nNama: ${userName}\nDihapus pada: ${new Date().toLocaleString('id-ID')}\n\nTerima kasih,\nSistem MTI`,
    metadata: {
      action: 'admin_notification',
      category: 'admin_action'
    }
  })
};

// Notification helper functions
export const sendUserNotification = async (
  userEmail: string,
  type: NotificationData['type'],
  userName: string,
  additionalData?: any
): Promise<boolean> => {
  const notificationService = NotificationService.getInstance();

  let notificationTemplate: Omit<NotificationData, 'to' | 'type'>;

  switch (type) {
    case 'user_created':
      notificationTemplate = NotificationTemplates.userCreated(
        userName,
        additionalData?.role || 'user'
      );
      break;
    case 'user_updated':
      notificationTemplate = NotificationTemplates.userUpdated(
        userName,
        additionalData?.updatedFields || []
      );
      break;
    case 'user_deleted':
      notificationTemplate = NotificationTemplates.userDeleted(userName);
      break;
    case 'user_activated':
      notificationTemplate = NotificationTemplates.userActivated(userName);
      break;
    case 'user_deactivated':
      notificationTemplate = NotificationTemplates.userDeactivated(userName);
      break;
    default:
      throw new Error(`Unknown notification type: ${type}`);
  }

  const notification: NotificationData = {
    to: userEmail,
    type,
    userId: additionalData?.userId,
    ...notificationTemplate
  };

  return await notificationService.sendNotification(notification);
};

export const sendAdminNotification = async (
  adminEmail: string,
  action: 'created' | 'updated' | 'deleted',
  targetUserName: string,
  additionalData?: any
): Promise<boolean> => {
  const notificationService = NotificationService.getInstance();

  let notificationTemplate: Omit<NotificationData, 'to' | 'type'>;
  let type: NotificationData['type'];

  switch (action) {
    case 'created':
      notificationTemplate = NotificationTemplates.adminUserCreated(
        additionalData?.adminName || 'Administrator',
        targetUserName,
        additionalData?.role || 'user'
      );
      type = 'user_created';
      break;
    case 'updated':
      notificationTemplate = NotificationTemplates.adminUserUpdated(
        additionalData?.adminName || 'Administrator',
        targetUserName,
        additionalData?.updatedFields || []
      );
      type = 'user_updated';
      break;
    case 'deleted':
      notificationTemplate = NotificationTemplates.adminUserDeleted(
        additionalData?.adminName || 'Administrator',
        targetUserName
      );
      type = 'user_deleted';
      break;
    default:
      throw new Error(`Unknown admin action: ${action}`);
  }

  const notification: NotificationData = {
    to: adminEmail,
    type,
    ...notificationTemplate
  };

  return await notificationService.sendNotification(notification);
};