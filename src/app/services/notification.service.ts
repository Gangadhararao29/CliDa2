import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export interface PaymentNotification {
    id: string;
    clientId: string;
    transactionId: string;
    transactionStartDate: Date;
    type: 'reminder';
    read: boolean;
    createdAt: Date;
}

export interface NotificationSettings {
    enabled: boolean;
    notifyBeforeMonths: number; // User selected buffer (1, 2, 3 months)
    minimumAgeYears: number; // User selected target (1, 2, 3 years)
    reminderIntervalWeeks: number; // User selected frequency (1, 2, 3, 4 weeks)
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private readonly NOTIFICATIONS_KEY = 'app_notifications';
    private readonly SETTINGS_KEY = 'notification_settings';
    private readonly LAST_CHECK_KEY = 'notification_last_check';
    private isNative = Capacitor.isNativePlatform();

    constructor(private router: Router) { }

    getSettings(): NotificationSettings {
        const defaultSettings: NotificationSettings = {
            enabled: false,
            notifyBeforeMonths: 2,
            minimumAgeYears: 2,
            reminderIntervalWeeks: 2
        };
        const stored = localStorage.getItem(this.SETTINGS_KEY);
        if (!stored) return defaultSettings;

        try {
            return { ...defaultSettings, ...JSON.parse(stored) };
        } catch (e) {
            return defaultSettings;
        }
    }

    saveSettings(settings: NotificationSettings) {
        localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
        this.resetCheck(); // Reset check so changes apply immediately
    }

    resetCheck() {
        localStorage.removeItem(this.LAST_CHECK_KEY);
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

        LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
            const data = notification.notification.extra;
            if (data && data.clientId) {
                this.router.navigate([`/clients-list/client-details/${data.clientId}`]);
            }
        });
    }

    shouldTriggerReminder(startDate: Date): { trigger: boolean, targetYear?: number, monthsLeft?: number } {
        const settings = this.getSettings();
        if (!settings.enabled) return { trigger: false };

        const now = new Date();
        const ageInMonths = this.getMonthsDifference(startDate, now);

        const minAgeYearsSelection = settings.minimumAgeYears;
        const notifyBefore = settings.notifyBeforeMonths;

        // Milestones to check
        const milestones = [1, 2, 3];

        // Find the "best" milestone:
        // We want the HIGHEST milestone that is >= selection AND where the current age
        // is at or past (Milestone - Buffer)
        let bestMilestone = -1;
        let bestMonthsLeft = 0;

        for (const year of milestones) {
            if (year < minAgeYearsSelection) continue;

            const targetMonths = year * 12;
            const startTriggerMonths = targetMonths - notifyBefore;

            if (ageInMonths >= startTriggerMonths) {
                bestMilestone = year;
                bestMonthsLeft = targetMonths - ageInMonths;
            }
        }

        if (bestMilestone === -1) return { trigger: false };

        return {
            trigger: true,
            targetYear: bestMilestone,
            monthsLeft: bestMonthsLeft
        };
    }

    // Check if we should run the notification check today
    shouldRunCheck(): boolean {
        const lastCheck = localStorage.getItem(this.LAST_CHECK_KEY);
        if (!lastCheck) return true;

        const lastDate = new Date(parseInt(lastCheck));
        const today = new Date();

        return lastDate.toDateString() !== today.toDateString();
    }

    markCheckComplete() {
        localStorage.setItem(this.LAST_CHECK_KEY, Date.now().toString());
    }

    private getMonthsDifference(startDate: Date, endDate: Date): number {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return (end.getFullYear() - start.getFullYear()) * 12 +
            (end.getMonth() - start.getMonth());
    }

    async schedulePaymentReminder(
        clientId: string,
        transactionId: string,
        clientName: string,
        amount: number,
        startDate: Date,
        targetYear: number,
        monthsLeft: number
    ) {
        const settings = this.getSettings();
        if (!settings.enabled) return;

        // Check if we notified recently (Smart Interval Logic)
        if (this.shouldSuppressNotification(transactionId)) return;

        const notification: PaymentNotification = {
            id: `reminder_${transactionId}_${Date.now()}`,
            clientId,
            transactionId,
            transactionStartDate: startDate,
            type: 'reminder',
            read: false,
            createdAt: new Date()
        };

        this.saveNotification(notification);

        // Construct Message
        let bodyText = '';
        if (monthsLeft > 0) {
            bodyText = `${clientName}: ₹${amount.toLocaleString('en-IN')} - Approaching ${targetYear}y in ${monthsLeft} months`;
        } else if (monthsLeft === 0) {
            bodyText = `${clientName}: ₹${amount.toLocaleString('en-IN')} - Reached ${targetYear}y milestone`;
        } else {
            bodyText = `${clientName}: ₹${amount.toLocaleString('en-IN')} - Crossed ${targetYear}y by ${Math.abs(monthsLeft)} months`;
        }

        if (this.isNative) {
            try {
                await LocalNotifications.schedule({
                    notifications: [{
                        id: Math.floor(Math.random() * 1000000),
                        title: `Payment Updates`,
                        body: bodyText,
                        schedule: { at: new Date() },
                        sound: 'default',
                        extra: {
                            clientId: clientId
                        }
                    }]
                });
            } catch (e) {
                console.error('Error scheduling notification', e);
            }
        } else {
            if ('Notification' in window && Notification.permission === 'granted') {
                const n = new Notification(`Payment Updates`, {
                    body: bodyText,
                    data: { clientId }
                });
                n.onclick = () => {
                    this.router.navigate([`/clients-list/client-details/${clientId}`]);
                };
            }
        }
    }

    private shouldSuppressNotification(transactionId: string): boolean {
        const notifications = this.getAllNotifications();
        const settings = this.getSettings();
        const intervalWeeks = settings.reminderIntervalWeeks || 2; // Default 2 weeks if undefined
        const intervalMs = intervalWeeks * 7 * 24 * 60 * 60 * 1000;

        // Find the latest notification for this transaction
        const latest = notifications.find(n => n.transactionId === transactionId);

        if (!latest) return false; // Never notified, so run it.

        const timeSinceLast = Date.now() - new Date(latest.createdAt).getTime();

        // If time since last notification is LESS than the interval, suppress it.
        return timeSinceLast < intervalMs;
    }

    private saveNotification(notification: PaymentNotification) {
        const notifications = this.getAllNotifications();
        notifications.unshift(notification);
        localStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(notifications));
    }

    getAllNotifications(): PaymentNotification[] {
        const data = localStorage.getItem(this.NOTIFICATIONS_KEY);
        return data ? JSON.parse(data) : [];
    }

    getUnreadCount(): number {
        return this.getAllNotifications().filter(n => !n.read).length;
    }

    markAsRead(id: string) {
        const notifications = this.getAllNotifications();
        const notification = notifications.find(n => n.id === id);
        if (notification) {
            notification.read = true;
            localStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(notifications));
        }
    }

    markAllAsRead() {
        const notifications = this.getAllNotifications();
        notifications.forEach(n => n.read = true);
        localStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(notifications));
    }

    dismissNotification(id: string) {
        const notifications = this.getAllNotifications().filter(n => n.id !== id);
        localStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(notifications));
    }

    clearAllNotifications() {
        localStorage.removeItem(this.NOTIFICATIONS_KEY);
    }
}
