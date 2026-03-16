import { Component, OnInit, Renderer2 } from '@angular/core';
import { NotificationService } from './services/notification.service';
import { FirebaseService } from './services/firebase.service';
import { LocalStorageUtils, localStorConsts } from './shared/local-storage';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  constructor(
    private renderer: Renderer2,
    private notificationService: NotificationService,
    private firebaseService: FirebaseService,
  ) {}

  ngOnInit() {
    this.setAppTheme();
    this.notificationService.initializeListeners();
    this.notificationService.initializeNotificationCheck();
    this.firebaseService.initializeAutoBackup();
  }

  private setAppTheme() {
    const preferColorMode = window.matchMedia('(prefers-color-scheme:dark)');
    const theme = LocalStorageUtils.getStringItem(localStorConsts.theme);
    if (theme != null && theme !== 'auto') {
      if (theme === 'dark') {
        this.renderer.addClass(document.body, 'dark');
      } else {
        this.renderer.removeClass(document.body, 'dark');
      }
    } else {
      LocalStorageUtils.setStringItem(localStorConsts.theme, 'auto');
      if (preferColorMode.matches) {
        this.renderer.addClass(document.body, 'dark');
      } else {
        this.renderer.removeClass(document.body, 'dark');
      }
    }
  }
}
