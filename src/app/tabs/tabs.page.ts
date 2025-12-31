import { Component } from '@angular/core';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: false
})
export class TabsPage {

  constructor(public notificationService: NotificationService) { }

  get unreadCount() {
    return this.notificationService.getUnreadCount();
  }
}
