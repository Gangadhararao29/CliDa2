import { Component, OnInit, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(private renderer: Renderer2) {}

  ngOnInit() {
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
