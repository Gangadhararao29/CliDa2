import { Component, OnInit, Renderer2 } from '@angular/core';
import { NotificationService } from './services/notification.service';
import { FirebaseService } from './services/firebase.service';
import { LocalStorageUtils, localStorConsts } from './shared/local-storage';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, take } from 'rxjs';

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
    private swUpdate: SwUpdate,
  ) {}

  ngOnInit() {
    this.setAppTheme();
    this.checkForSwUpdates();

    // Defer everything else so it doesn't block the first render
    setTimeout(() => {
      this.notificationService.initializeListeners();
      this.notificationService.initializeNotificationCheck();
      this.firebaseService.initializeAutoBackup();
    }, 2000);
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

  private checkForSwUpdates() {
    if (!this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates
      .pipe(
        filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'),
        take(1), // ← KEY FIX: only respond to the first event, ignore duplicates
      )
      .subscribe(() => this.showUpdateAlert());

    // Slight delay so the subscription above is fully set up
    // before the active check can emit
    setTimeout(() => this.swUpdate.checkForUpdate(), 100);
  }

  private showUpdateAlert() {
    let userMessage =
      'A new version of the app is ready. Refresh now to apply the latest updates and improvements?';

    if (confirm(userMessage)) {
      document.location.reload();
    }
  }
}
