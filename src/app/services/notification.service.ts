import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { from, mergeMap, BehaviorSubject } from 'rxjs';
import { DataBaseService } from './data-base.service';
import { LocalStorageUtils, localStorConsts } from '../shared/local-storage';

export interface PaymentNotification {
  id: string;
  key: string;
  name: string;
  principal: string;
  startDate: Date;
  read: boolean;
  createdAt: Date;
  body: string;
}

export interface NotificationSettings {
  enabled: boolean;
  notifyBeforeMonths: number; // User selected buffer (1, 2, 3 months)
  minimumAgeYears: number; // User selected target (1, 2, 3 years)
  reminderIntervalMonths: number; // User selected frequency (1, 2, 3, 4 weeks)
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly MAX_CONCURRENT_TASKS = 5;
  private isNative = Capacitor.isNativePlatform();

  private notificationsSubject = new BehaviorSubject<PaymentNotification[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  constructor(
    private router: Router,
    private dataBaseService: DataBaseService,
  ) {
    this.notificationsSubject.next(this.getAllNotifications());
  }

  defaults: NotificationSettings = {
    enabled: false,
    notifyBeforeMonths: 6,
    minimumAgeYears: 3,
    reminderIntervalMonths: 2,
  };

  getSettings(): NotificationSettings {
    try {
      const stored = LocalStorageUtils.getStringItem(localStorConsts.notificationSettings);
      return stored
        ? { ...this.defaults, ...JSON.parse(stored) }
        : this.defaults;
    } catch {
      return this.defaults;
    }
  }

  saveSettings(settings: NotificationSettings) {
    LocalStorageUtils.setItem(localStorConsts.notificationSettings, settings);
  }

  async requestPermission(requested?: boolean): Promise<boolean> {
    const settings = this.getSettings();
    if (!(settings.enabled || requested)) return false;

    if (this.isNative) {
      try {
        const result = await LocalNotifications.requestPermissions();
        return result.display === 'granted';
      } catch (e) {
        console.error('Error requesting permissions', e);
        return false;
      }
    } else {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
    }
    return false;
  }

  initializeListeners() {
    if (!this.isNative) return;

    LocalNotifications.addListener(
      'localNotificationActionPerformed',
      (notification) => {
        const data = notification.notification.extra;
        if (data && data.clientId) {
          this.router.navigate([
            `/clients-list/client-details/${data.clientId}`,
          ]);
        }
      },
    );
  }

  addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    const d = result.getDate();
    result.setMonth(result.getMonth() + months);
    if (result.getDate() !== d) {
      result.setDate(0);
    }
    result.setHours(0, 0, 0, 0);
    return result;
  }

  shouldTriggerReminder(
    startDate: Date,
    checkDate: Date,
  ): {
    trigger: boolean;
    targetYear?: number;
    monthsLeft?: number;
  } {
    const settings = this.getSettings();
    if (!settings.enabled) return { trigger: false };

    const checkMidnight = new Date(checkDate);
    checkMidnight.setHours(0, 0, 0, 0);

    const minimumMonthsRequired = settings.minimumAgeYears * 12;
    const notifyBeforeMonths = settings.notifyBeforeMonths;
    const reminderIntervalMonths = settings.reminderIntervalMonths;

    let beforeMonths = notifyBeforeMonths;
    while (beforeMonths >= 0) {
      const targetMonths = minimumMonthsRequired - beforeMonths;
      const milestoneDate = this.addMonths(startDate, targetMonths);

      if (checkMidnight.getTime() === milestoneDate.getTime()) {
        return {
          trigger: true,
          targetYear: settings.minimumAgeYears,
          monthsLeft: beforeMonths,
        };
      }
      beforeMonths -= reminderIntervalMonths;
    }
    return { trigger: false };
  }

  private getDifferenceInMonths(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Whole months difference
    let months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());

    // Day fraction (30-day month)
    const dayDiff = end.getDate() - start.getDate();
    const dayFraction = dayDiff / 30;

    return months + dayFraction;
  }

  private buildPaymentReminderBody(
    name: string,
    principal: string,
    targetYear: number,
    monthsLeft: number,
  ): string {
    if (monthsLeft > 0) {
      return `${name}: ₹${principal} | Approaching ${targetYear}y in ${monthsLeft} months`;
    }

    if (monthsLeft === 0) {
      return `${name}: ₹${principal} | Reached ${targetYear}y milestone`;
    }

    return `${name}: ₹${principal} | Crossed ${targetYear}y by ${Math.abs(
      monthsLeft,
    )} months`;
  }

  async schedulePaymentReminder(
    key: string,
    recordId: string,
    name: string,
    principal: number,
    startDate: Date,
    targetYear: number,
    monthsLeft: number,
    checkDate: Date,
  ) {
    const formattedPrincipal = principal.toLocaleString('en-IN');

    const body = this.buildPaymentReminderBody(
      name,
      formattedPrincipal,
      targetYear,
      monthsLeft,
    );

    const notification: PaymentNotification = {
      id: `reminder_${recordId}_${checkDate.toString()}`,
      key,
      name,
      principal: formattedPrincipal,
      startDate,
      read: false,
      createdAt: checkDate,
      body,
    };

    // Persist notification (fire-and-forget is fine)
    this.saveNotification(notification);

    // Native notifications
    if (this.isNative) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Number(recordId),
              title: 'Payment Reminder',
              body,
              schedule: { at: new Date() },
              sound: 'default',
              extra: { clientId: key },
            },
          ],
        });
      } catch (e) {
        console.error('Error scheduling notification', e);
      }
      return;
    }

    // Web notifications
    if ('Notification' in window && Notification.permission === 'granted') {
      const n = new Notification('Payment Reminder', {
        body,
        data: { clientId: key },
      });

      n.onclick = () => {
        this.router.navigate([`/clients-list/client-details/${key}`]);
      };
    }
  }

  private shouldSuppressNotification(
    transactionId: string,
    checkDate: Date,
  ): boolean {
    const notifications = this.getAllNotifications();
    const settings = this.getSettings();
    const intervalMonths = settings.reminderIntervalMonths || 2;

    // Find the latest notification for this transaction
    const latest = notifications.find(
      (n) => n.id.split('_')[1] === transactionId,
    );

    if (!latest) return false; // Never notified, so run it.

    const checkMidnight = new Date(checkDate);
    checkMidnight.setHours(0, 0, 0, 0);

    const latestMidnight = new Date(latest.createdAt);
    latestMidnight.setHours(0, 0, 0, 0);

    const diffMonths = this.getDifferenceInMonths(latestMidnight, checkMidnight);

    // Suppress if the difference is strictly less than the interval (with 0.1 month tolerance)
    return diffMonths < (intervalMonths - 0.1);
  }

  private saveNotification(notification: PaymentNotification) {
    const notifications = this.getAllNotifications();
    const exists = notifications.some((n) => n.id === notification.id);
    if (exists) return;

    notifications.unshift(notification);
    LocalStorageUtils.setItem(localStorConsts.appNotifications, notifications);
    this.notificationsSubject.next(notifications);
  }

  getAllNotifications(): PaymentNotification[] {
    return LocalStorageUtils.getItem(localStorConsts.appNotifications) || [];
  }

  getUnreadCount(): number {
    return this.getAllNotifications().filter((n) => !n.read).length;
  }

  markAsRead(id: string) {
    const notifications = this.getAllNotifications();
    const notification = notifications.find((n) => n.id === id);
    if (notification) {
      notification.read = true;
      LocalStorageUtils.setItem(
        localStorConsts.appNotifications,
        notifications,
      );
      this.notificationsSubject.next(notifications);
    }
  }

  markAllAsRead() {
    const notifications = this.getAllNotifications();
    notifications.forEach((n) => (n.read = true));
    LocalStorageUtils.setItem(localStorConsts.appNotifications, notifications);
    this.notificationsSubject.next(notifications);
  }

  dismissNotification(id: string) {
    const notifications = this.getAllNotifications().filter((n) => n.id !== id);
    LocalStorageUtils.setItem(localStorConsts.appNotifications, notifications);
    this.notificationsSubject.next(notifications);
  }

  clearAllNotifications() {
    LocalStorageUtils.removeItem(localStorConsts.appNotifications);
    this.notificationsSubject.next([]);
  }

  getNextCheckDate(): Date {
    const stored = LocalStorageUtils.getStringItem(localStorConsts.notificationLastCheck);

    if (!stored) {
      return new Date();
    }

    const lastDate = new Date(stored);
    lastDate.setDate(lastDate.getDate() + 1);

    return lastDate;
  }

  markCheckComplete(date?: Date) {
    LocalStorageUtils.setStringItem(localStorConsts.notificationLastCheck, date.toString());
  }

  initializeNotificationCheck(): void {
    console.log('[NotificationService] Initializing notification check...');
    const settings = this.getSettings();
    if (!settings.enabled) return;

    const nextCheckDate = this.getNextCheckDate();
    const today = new Date();
    nextCheckDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (today < nextCheckDate) return;

    this.dataBaseService
      .getAllClientsDataWithKeys()
      .then((data) =>
        this.processNotificationsBatch(nextCheckDate, today, data),
      );
  }

  private processNotificationsBatch(
    nextCheckDate: Date,
    today: Date,
    data: any[],
  ) {
    if (today < nextCheckDate) {
      return;
    }

    this.handleCheckForNotifications(nextCheckDate, data).subscribe({
      error: (err) => {
        console.error('Error in notification batch', err);
        this.markCheckComplete(nextCheckDate);
        nextCheckDate.setDate(nextCheckDate.getDate() + 1);
        this.processNotificationsBatch(nextCheckDate, today, data);
      },
      complete: () => {
        this.markCheckComplete(nextCheckDate);
        nextCheckDate.setDate(nextCheckDate.getDate() + 1);
        this.processNotificationsBatch(nextCheckDate, today, data);
      },
    });
  }

  private handleCheckForNotifications(checkDate: Date, data: any[]) {
    console.log(
      `[NotificationService] Checking for notifications on ${checkDate.toDateString()}`,
    );

    return from(data).pipe(
      mergeMap(
        (client) => this.processClientNotifications(client, checkDate),
        this.MAX_CONCURRENT_TASKS,
      ),
    );
  }

  private processClientNotifications(client: any, checkDate: Date) {
    return from(client.data.data).pipe(
      mergeMap(
        (record) => this.processRecord(client, record, checkDate),
        this.MAX_CONCURRENT_TASKS,
      ),
    );
  }

  private processRecord(client: any, record: any, checkDate: Date) {
    return from([record]).pipe(
      mergeMap(async (record) => {
        // Only notify for open transactions
        if (!record.closedOn) {
          const startDate = new Date(record.startDate);
          const shouldNotify = this.shouldTriggerReminder(startDate, checkDate);

          if (shouldNotify.trigger) {
            if (this.shouldSuppressNotification(record.id, checkDate)) {
              console.log(
                `[NotificationService] Notification suppressed for transaction ${record.id} on ${checkDate.toDateString()}`,
              );
              return;
            }

            await this.schedulePaymentReminder(
              client.key,
              record.id,
              client.data.name,
              record.principal,
              startDate,
              shouldNotify.targetYear,
              shouldNotify.monthsLeft,
              checkDate,
            );
          }
        }
      }),
    );
  }
}
