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
      body: 'Search by client name, principal amount, interest rate, or year. Find exactly what you need instantly across all active and closed records!',
    },
    {
      img: 'funnel-outline',
      imgColor: 'primary',
      header: 'Advanced Search Filters',
      body: 'Click the funnel icon to filter by principal amount range and time period. Save custom search/sort configurations for quick access!',
    },
    {
      img: 'happy-outline',
      imgColor: 'success',
      header: 'Finished exploring the app?',
      body: 'Go to About → Factory reset app to clear all demo records, logs, and settings to start managing your own clients from scratch.',
    },
    {
      img: 'swap-horizontal-outline',
      imgColor: 'tertiary',
      header: 'Organize Your Lists',
      body: 'Sort clients in the database by Name or Year from the About page. Switch between Credits, Debits, and Leases tabs to keep transactions organized!',
    },
    {
      img: 'time-outline',
      imgColor: 'danger',
      header: 'Color-Coded Age Indicators',
      body: '🔴 Red (2.5+ yrs) | 🟡 Yellow (2+ yrs) | 🔵 Blue (1+ yr) | ⚫ Gray (<1 yr) | 🟢 Green (Closed). Instantly track transaction age!',
    },
    {
      img: 'layers-outline',
      header: 'Lease Clients Swipeable',
      body: 'Swipe left on lease records to edit details or delete quickly. Smooth swipe gestures make transaction management fast and simple!',
    },
    {
      img: 'calculator-outline',
      imgColor: 'success',
      header: 'Calculate & Share Results',
      body: 'Calculate simple or compound interest, then share results via live link or clipboard. Recipients can view the calculation breakdown instantly!',
    },
    {
      img: 'analytics-outline',
      imgColor: 'primary',
      header: 'Dashboard Customization',
      body: 'Toggle Stats, Graphs, Charts, Top Earners, and Recent Transactions on or off. Design the dashboard layout to fit your workflow!',
    },
    {
      img: 'pie-chart-outline',
      imgColor: 'success',
      header: 'Interactive Dashboard Charts',
      body: 'Visualize data with line trends, credits vs debits breakdown, top clients, and interest rate distribution in interactive charts!',
    },
    {
      img: 'notifications-outline',
      imgColor: 'warning',
      header: 'Smart Payment Reminders',
      body: 'Set custom aging alert rules: choose minimum transaction age (1-3 yrs), warning period (1-6 months before), and check frequency.',
    },
    {
      img: 'notifications-off-outline',
      imgColor: 'dark',
      header: 'Manage Notifications',
      body: 'Mark reminders as read/unread, dismiss individual alerts, or clear all at once from the dedicated notifications screen.',
    },
    {
      img: 'cloud-upload-outline',
      imgColor: 'warning',
      header: 'Auto Backup to Cloud',
      body: 'Sign in with Google and enable Auto Backup to automatically sync clients, leases, settings, and logs to the cloud on schedule.',
    },
    {
      img: 'download-outline',
      imgColor: 'primary',
      header: 'Restore Your Data',
      body: 'Restore from cloud backup anytime. Choose "Sync with local" to merge cloud data with local records, or "Replace All" to overwrite.',
    },
    {
      img: 'document-outline',
      header: 'Export Your Data',
      body: 'Export your database as JSON or Excel files from Account Settings. Back up locally or share records with teammates effortlessly!',
    },
    {
      img: 'settings-outline',
      imgColor: 'dark',
      header: 'Customize Settings',
      body: 'Adjust app theme, notifications settings, backup intervals, list sorting, and database parameters to personalize your workflow!',
    },
    {
      img: 'list-outline',
      imgColor: 'tertiary',
      header: 'About & Help',
      body: 'Find detailed guides, Frequently Asked Questions, check app updates, and view operation logs under the About page.',
    },
    {
      img: 'bulb-outline',
      imgColor: 'success',
      header: 'Explore Tips & Tricks',
      body: 'New to CliDa? Enable this tips carousel in Settings for helpful advice, and check the FAQ section for deeper guides and best practices!',
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
