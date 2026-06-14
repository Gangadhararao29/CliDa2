import { Component, Input, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommonService } from '../../services/common.service';
import {
  NotificationService,
  NotificationSettings,
} from '../../services/notification.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
  standalone: false,
})
export class NotificationsComponent implements OnInit, OnDestroy {
  @Input() theme: string = '';
  @ViewChild('modal2') modal2: any;

  notificationSettings: NotificationSettings = {
    enabled: false,
    notifyBeforeMonths: 6,
    minimumAgeYears: 3,
    reminderIntervalMonths: 2,
  };
  notifications: any[] = [];
  isNotificationModalOpen = false;
  private notificationsSub: Subscription;

  constructor(
    private router: Router,
    private commonService: CommonService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit() {
    this.notificationSettings = this.notificationService.getSettings();
    this.notificationsSub = this.notificationService.notifications$.subscribe(
      (notes) => {
        this.notifications = notes;
      },
    );
  }

  onNotificationToggle() {
    if (this.notificationSettings.enabled) {
      this.notificationService.requestPermission(true).then((granted) => {
        if (!granted) {
          this.notificationSettings.enabled = false;
          this.commonService.presentToast(
            'Notification permission denied',
            'failedToastClass',
            'alert-outline',
          );
        }
        this.saveNotificationSettings();
      });
    } else {
      this.saveNotificationSettings();
    }
  }

  saveNotificationSettings() {
    this.notificationService.saveSettings(this.notificationSettings);

    if (this.notificationSettings.enabled) {
      // Clear existing notifications and reset check state to force catch-up
      this.notificationService.clearAllNotifications();

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      this.notificationService.markCheckComplete(yesterday);

      // Trigger new check immediately
      this.notificationService.initializeNotificationCheck();
    } else {
      // If disabled, just clear existing notifications
      this.notificationService.clearAllNotifications();
    }
  }

  openNotifications() {
    this.isNotificationModalOpen = true;
  }

  markAsRead(notification: any) {
    this.notificationService.markAsRead(notification.id);
    const note = this.notifications.find((n) => n.id === notification.id);
    if (note) note.read = true;
  }

  dismissNotification(notification: any) {
    this.notificationService.dismissNotification(notification.id);
    this.notifications = this.notifications.filter(
      (n) => n.id !== notification.id,
    );
  }

  clearAllNotifications() {
    this.notificationService.clearAllNotifications();
    this.notifications = [];
  }

  openNoteRecord(note: any) {
    this.isNotificationModalOpen = false;
    setTimeout(() => {
      this.router.navigate(['clients-list', 'client-details', note.key]);
    });
  }

  getFormattedDate(date: string | Date): string {
    const noteDate = new Date(date);
    const now = new Date();

    // Check if it's today
    if (
      noteDate.getFullYear() === now.getFullYear() &&
      noteDate.getMonth() === now.getMonth() &&
      noteDate.getDate() === now.getDate()
    ) {
      // For today, show relative time
      const diffMs = now.getTime() - noteDate.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffMins < 1) {
        return 'Just now';
      } else if (diffMins < 60) {
        return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
      } else {
        return `${diffHours} hr${diffHours !== 1 ? 's' : ''} ago`;
      }
    }

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (
      noteDate.getFullYear() === yesterday.getFullYear() &&
      noteDate.getMonth() === yesterday.getMonth() &&
      noteDate.getDate() === yesterday.getDate()
    ) {
      return 'Yesterday';
    }

    return noteDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
    });
  }

  ngOnDestroy() {
    this.isNotificationModalOpen = false;
    if (this.modal2) {
      this.modal2.dismiss();
    }
    if (this.notificationsSub) {
      this.notificationsSub.unsubscribe();
    }
  }
}
