import { Component, OnInit, Renderer2 } from '@angular/core';
import { NotificationService } from './services/notification.service';
import { FirebaseService } from './services/firebase.service';
import { LocalStorageUtils, localStorConsts } from './shared/local-storage';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

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
    this.notificationService.initializeListeners();
    this.notificationService.initializeNotificationCheck();
    this.firebaseService.initializeAutoBackup();

    this.checkForSwUpdates();
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
    console.log(this.swUpdate, this.swUpdate.isEnabled);
    if (!this.swUpdate.isEnabled) return;

    // Listen for a new version being ready
    this.swUpdate.versionUpdates
      .pipe(
        filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'),
      )
      .subscribe(() => {
        // Option A: Auto-reload silently
        // document.location.reload();

        // Option B: Prompt the user (better UX)
        if (confirm('New version available. Load it?')) {
          document.location.reload();
        }
      });

    // Actively check for updates (don't rely on passive checks alone)
    this.swUpdate.checkForUpdate();
  }
}
