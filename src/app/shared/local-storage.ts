// Local Storage Keys
export const localStorConsts = {
  calcsHistory: 'calcsHistory',
  theme: 'theme',
  logs: 'logs',
  lastDataModified: 'lastDataModified',
  sortAndFilterParams: 'sortAndFilterParams',
  transactionPresets: 'transaction_presets',
  notificationSettings: 'notification_settings',
  appNotifications: 'app_notifications',
  notificationLastCheck: 'notification_last_check',
  dashPref: 'dashPref',
  isOldStyle: 'isOldStyle',
  tabSection: 'tabSection',
  // leaseClients: 'leaseClients',
  lastCloudSync: 'lastCloudSync',
  autoBackupSettings: 'autoBackupSettings',
  lastAutoBackup: 'lastAutoBackup',
} as const;

// Utility functions for localStorage
export class LocalStorageUtils {

  static getItem<T = any>(key: string): T | null {
    const item = localStorage.getItem(key);
    if (item === null) return null;
    try {
      return JSON.parse(item);
    } catch {
      return item as T;
    }
  }

  static setItem(key: string, value: any): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  static removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  static getStringItem(key: string): string | null {
    return localStorage.getItem(key);
  }

  static setStringItem(key: string, value: string): void {
    localStorage.setItem(key, value);
  }
}
