import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-tips-carousel',
  templateUrl: './tips-carousel.component.html',
  styleUrls: ['./tips-carousel.component.scss'],
  standalone: false,
})
export class TipsCarouselComponent implements OnInit, OnDestroy {
  @Input() user: any;
  @ViewChild('carouselTrack') carouselTrack!: ElementRef;

  activeTipIndex = 0;
  private carouselInterval: any;
  scrollDebounce: any;
  isAutoScrolling = false;
  isUserTouching = false; // ← NEW: tracks active touch

  tips = [
    {
      img: 'sparkles-outline',
      header: 'Welcome to CliDa',
      body: "Hi {user}! Manage clients, track leases, and organize finances all in one place. Let's get started!",
    },
    {
      img: 'search-outline',
      imgColor: 'success',
      header: 'Smart Search Bar',
      body: 'Search by client name, principal amount, interest rate, or year. Find exactly what you need instantly across all records!',
    },
    {
      img: 'funnel-outline',
      imgColor: 'primary',
      header: 'Advanced Search Filters',
      body: 'Click the funnel icon to filter by principal range and time period. Save reusable filter models to save time on repeated searches!',
    },
    {
      img: 'happy-outline',
      imgColor: 'success',
      header: 'Finished exploring the app?',
      body: 'Go to About → Factory Reset to clear demo data and start managing your own clients from scratch.',
    },
    {
      img: 'swap-horizontal-outline',
      imgColor: 'tertiary',
      header: 'Organize Your Lists',
      body: 'Sort clients by name, earnings, time period, or principal. Switch between Credits/Debits tabs to organize your way!',
    },
    {
      img: 'time-outline',
      imgColor: 'danger',
      header: 'Color-Coded Age Indicators',
      body: '🔴 Red = 2.5+y | 🟡 Yellow = 2+y | 🔵 Blue = 1+y | ⚫ Gray = <1y. Instantly spot aging transactions at a glance!',
    },
    {
      img: 'layers-outline',
      header: 'Lease Clients Swipeable',
      body: 'Swipe left on lease record to edit or delete quickly. Smooth actions for fast transaction management and updates!',
    },
    {
      img: 'calculator-outline',
      imgColor: 'success',
      header: 'Calculate & Share Results',
      body: 'Calculate simple or compound interest, then share results via live link. Recipients view your breakdown anytime!',
    },
    {
      img: 'analytics-outline',
      imgColor: 'primary',
      header: 'Dashboard Customization',
      body: 'Toggle Stats, Graphs, Charts, Top Earners, Summary, and more. Build your dashboard exactly the way you want it!',
    },
    {
      img: 'pie-chart-outline',
      imgColor: 'success',
      header: 'Interactive Dashboard Charts',
      body: 'View Line trends, Pie breakdown, Bar charts for top clients, and Interest distribution—all in one customizable view!',
    },
    {
      img: 'notifications-outline',
      imgColor: 'warning',
      header: 'Smart Payment Reminders',
      body: 'Set custom rules: remind at 1-3 years old, alert 1-6 months before, repeat every 1-3 months. Full control over reminders!',
    },
    {
      img: 'notifications-off-outline',
      imgColor: 'dark',
      header: 'Manage Notifications',
      body: 'Turn notifications on/off anytime. Mark reminders as read, dismiss individually, or clear all at once. Complete control!',
    },
    {
      img: 'cloud-upload-outline',
      imgColor: 'warning',
      header: 'Auto Backup to Cloud',
      body: 'Enable automatic backup to save clients, leases, logs, and settings safely. Never lose your data—set it and forget it!',
    },
    {
      img: 'download-outline',
      imgColor: 'primary',
      header: 'Restore Your Data',
      body: 'Restore from cloud backup anytime. Choose soft restore to merge data, or hard restore to overwrite fresh. Total flexibility!',
    },
    {
      img: 'document-outline',
      header: 'Export Your Data',
      body: 'Export clients, leases, and transactions as JSON or Excel. Back up locally or share data with teammates effortlessly!',
    },
    {
      img: 'settings-outline',
      imgColor: 'dark',
      header: 'Customize Settings',
      body: 'Adjust themes, notifications, backup frequency, list sorting and more. Personalize CliDa for your workflow!',
    },
    {
      img: 'list-outline',
      imgColor: 'tertiary',
      header: 'About & Help',
      body: 'Find tutorials, FAQ, contact support, and app info in the About section. All resources and help in one organized place!',
    },
    {
      img: 'bulb-outline',
      imgColor: 'success',
      header: 'Explore Tips & Tricks',
      body: 'New to CliDa? Enable tips carousel in Settings for daily guidance. Check FAQ for detailed guides and best practices!',
    },
  ];

  constructor() {}

  ngOnInit() {
    this.tips.forEach((tip) => {
      tip.body = this.replaceUserPlaceholder(tip.body);
      tip.imgColor = tip.imgColor || 'primary';
    });

    this.startCarouselAutoPlay();
  }

  ngOnDestroy() {
    this.clearCarouselInterval();
    if (this.scrollDebounce) {
      clearTimeout(this.scrollDebounce);
    }
  }

  // ─── Touch guards ────────────────────────────────────────────────────────────

  /** Called when the user puts a finger down — immediately kill auto-play. */
  onTouchStart() {
    this.isUserTouching = true;
    this.clearCarouselInterval(); // stop interval so it can't fire mid-swipe
    clearTimeout(this.scrollDebounce); // cancel any pending restart too
  }

  /**
   * Called when the finger lifts.
   * Wait a short moment for the snap animation to settle, then restart auto-play.
   */
  onTouchEnd() {
    // Update active index after snap settles
    this.scrollDebounce = setTimeout(() => {
      this.isUserTouching = false;
      this.syncIndexFromScroll();
      this.startCarouselAutoPlay();
    }, 400);
  }

  // ─── Auto-play ───────────────────────────────────────────────────────────────

  startCarouselAutoPlay() {
    this.clearCarouselInterval();
    this.carouselInterval = setInterval(() => {
      if (this.tips.length > 0) {
        this.activeTipIndex = (this.activeTipIndex + 1) % this.tips.length;
        this.scrollToActiveTip();
      }
    }, 5000);
  }

  clearCarouselInterval() {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
      this.carouselInterval = null;
    }
  }

  scrollToActiveTip() {
    if (this.carouselTrack?.nativeElement) {
      this.isAutoScrolling = true;
      const container = this.carouselTrack.nativeElement;
      container.scrollTo({
        left: this.activeTipIndex * container.offsetWidth,
        behavior: 'smooth',
      });
      setTimeout(() => {
        this.isAutoScrolling = false;
      }, 500);
    }
  }

  // ─── Scroll handler ──────────────────────────────────────────────────────────

  onCarouselScroll(event: any) {
    // Ignore scroll events triggered by programmatic scrollToActiveTip()
    if (this.isAutoScrolling) return;

    const container = event.target;
    if (container.offsetWidth) {
      const index = Math.round(container.scrollLeft / container.offsetWidth);
      if (this.activeTipIndex !== index) {
        this.activeTipIndex = index;
      }
    }

    // When the user is touching, onTouchEnd() owns the auto-play restart.
    // Do NOT schedule a debounced restart here — it would double-fire.
    if (this.isUserTouching) return;

    // Mouse/trackpad drag fallback (non-touch environments)
    clearTimeout(this.scrollDebounce);
    this.scrollDebounce = setTimeout(() => {
      this.startCarouselAutoPlay();
    }, 300);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  /** Reads the current scroll position and syncs activeTipIndex. */
  private syncIndexFromScroll() {
    if (this.carouselTrack?.nativeElement) {
      const container = this.carouselTrack.nativeElement;
      const index = Math.round(container.scrollLeft / container.offsetWidth);
      this.activeTipIndex = index;
    }
  }

  replaceUserPlaceholder(body: string): string {
    const userName = this.user ? this.user.displayName : 'User';
    return body.replace('{user}', userName);
  }
}
