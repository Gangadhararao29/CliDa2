import { Component, OnInit, Renderer2 } from '@angular/core';
import { NotificationService } from './services/notification.service';

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
  ) {}

  ngOnInit() {
    this.setAppTheme();
    this.notificationService.initializeListeners();
  }

  private setAppTheme() {
    const preferColorMode = window.matchMedia('(prefers-color-scheme:dark)');
    const theme = localStorage.getItem('theme');
    if (theme != null && theme !== 'auto') {
      if (theme === 'dark') {
        this.renderer.addClass(document.body, 'dark');
      } else {
        this.renderer.removeClass(document.body, 'dark');
      }
    } else {
      localStorage.setItem('theme', 'auto');
      if (preferColorMode.matches) {
        this.renderer.addClass(document.body, 'dark');
      } else {
        this.renderer.removeClass(document.body, 'dark');
      }
    }
  }
}
