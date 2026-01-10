import { Component } from '@angular/core';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: false,
})
export class TabsPage {
  constructor(public notificationService: NotificationService) {}

  get unreadCount() {
    const settings = this.notificationService.getSettings();
    return settings.enabled ? this.notificationService.getUnreadCount() : 0;
  }
}
