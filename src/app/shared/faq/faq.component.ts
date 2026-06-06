import { Component, Input } from '@angular/core';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss'],
  standalone: false,
})
export class FaqComponent {
  @Input() theme: string = '';

  faqItems: FAQItem[] = [
    {
      id: 'getting-started',
      category: 'Getting Started',
      question: '🎯 How do I get started with CliDa?',
      answer: 'Start by adding clients from the Clients page. Create transactions (Credits/Debits) for each client, track their status, and use the Dashboard to view analytics and insights. Check the tips carousel for guided tours!',
    },
    {
      id: 'credits-debits',
      category: 'Getting Started',
      question: '📊 What are Credits and Debits?',
      answer: '<b>Credits</b> = money you provided to clients (loans, advances). <b>Debits</b> = money clients owe you (receivables). Track both types easily from your client list with automatic calculations and status updates.',
    },
    {
      id: 'colors',
      category: 'Getting Started',
      question: '🎨 What do the different colors mean?',
      answer: '🔴 <b>Red</b> = 2.5+ years old | 🟡 <b>Yellow</b> = 2+ years | 🔵 <b>Blue</b> = 1+ year | ⚫ <b>Gray</b> = <1 year. 🟢 <b>Green</b> = closed. Color coding helps you identify aging records instantly!',
    },
    {
      id: 'search-bar',
      category: 'Search & Organization',
      question: '🔍 How do I search for clients or transactions?',
      answer: 'Use the search bar to find clients by name, principal amount, interest rate, or year. Results update in real-time as you type. Search works across all active and closed transactions simultaneously!',
    },
    {
      id: 'advanced-filters',
      category: 'Search & Organization',
      question: '🔎 What are Advanced Search Filters?',
      answer: 'Click the funnel icon to filter by principal amount range and time period. Save reusable filter models to quickly apply the same criteria later. Combine filters for precise, powerful searching!',
    },
    {
      id: 'organize-lists',
      category: 'Search & Organization',
      question: '📋 How can I organize my client list?',
      answer: 'Sort clients by name, earnings, time period, or principal amount. Switch between Credits/Debits tabs to view transaction types separately. Use pagination to navigate large lists efficiently.',
    },
    {
      id: 'lease-swipe',
      category: 'Features',
      question: '👆 How do I edit or delete lease records?',
      answer: 'Swipe left on any lease record to reveal edit and delete options. Click the pencil icon to modify details, or trash icon to remove. Swipe actions make transactions fast and intuitive!',
    },
    {
      id: 'calculators',
      category: 'Tools',
      question: '🧮 What calculators are available?',
      answer: '<b>Simple Interest:</b> basic interest on principal. <b>Compound Interest:</b> with different compounding frequencies. <b>Lease Calculator:</b> estimate payments and totals. All calculators are offline and instant!',
    },
    {
      id: 'share-calculations',
      category: 'Tools',
      question: '📤 How do I share calculations?',
      answer: 'After calculating, share results via live link or copy to clipboard. Recipients can view your calculation breakdown, dates, rates, and totals. Perfect for client communication and documentation!',
    },
    {
      id: 'charts',
      category: 'Dashboard',
      question: '📈 What charts are available?',
      answer: '<b>Pie Chart:</b> credits vs debits breakdown. <b>Line Chart:</b> trends over time. <b>Bar Charts:</b> top clients and interest distribution. Toggle charts to focus on what matters to you!',
    },
    {
      id: 'dashboard-custom',
      category: 'Dashboard',
      question: '⚙️ How do I customize my dashboard?',
      answer: 'Click "Customize Dashboard" to toggle sections on/off: Stats, Graphs, Charts, Top Earners, Recent/Upcoming transactions, and more. Your dashboard adapts to your unique workflow and preferences!',
    },
    {
      id: 'notifications',
      category: 'Notifications',
      question: '🔔 How do Payment Reminders work?',
      answer: 'Set custom rules in Settings to remind you about aging transactions. Configure minimum age (1-3 years), alert timing (1-6 months before), and frequency (1-3 months apart). Stay on top of aging records!',
    },
    {
      id: 'manage-notifications',
      category: 'Notifications',
      question: '🔕 How do I manage notifications?',
      answer: 'Turn notifications on/off anytime in Settings. Mark reminders as read/unread, dismiss individual alerts, or clear all at once. Get control over when and how you receive payment reminders.',
    },
    {
      id: 'logs',
      category: 'Features',
      question: '📝 Where are Operation Logs?',
      answer: 'Operation Logs track all app actions: adding clients, editing, deletions, approvals, and backups. Access them from the About page to review a complete history and audit trail of changes.',
    },
    {
      id: 'offline',
      category: 'Features',
      question: '📱 Can I use the app offline?',
      answer: 'Yes! This is an offline-first app. All data stores locally on your device, so you can access and edit it anytime without internet. Cloud Backup requires internet, but core features work offline!',
    },
    {
      id: 'backup',
      category: 'Data Safety',
      question: '☁️ How does Auto Backup work?',
      answer: 'Enable Auto Backup in Account Settings to save data securely to cloud at your chosen interval (Daily/Weekly/Monthly). Protects clients, leases, logs, and settings. Sign in with Google to activate!',
    },
    {
      id: 'restore',
      category: 'Data Safety',
      question: '♻️ How do I restore data from cloud?',
      answer: 'Go to Account Settings and click "Restore from Cloud Backup." Choose Merge (combine data) or Overwrite (fresh start). On new devices, sign in with Google first, then restore. Easy recovery!',
    },
    {
      id: 'export-local',
      category: 'Data Safety',
      question: '💾 Can I export data locally?',
      answer: 'Yes! Export all data as JSON or Excel files from Account Settings under "Local Data Sync." Back up locally, share with teammates, or import later to restore or merge data easily.',
    },
    {
      id: 'data-loss',
      category: 'Data Safety',
      question: '⚠️ What if I clear browser/app data?',
      answer: 'Clearing device data deletes your local storage. Always enable Auto Backup or create local exports beforehand. Multiple backup options ensure your data is never lost, even if device storage is cleared!',
    },
    {
      id: 'data-maintenance',
      category: 'Data Management',
      question: '🧹 What is Data Maintenance?',
      answer: 'Data Maintenance tools let you fix errors, clean approved/closed transactions to free space, and perform factory resets. Use carefully to optimize storage and keep your database healthy and organized!',
    },
  ];

  getCategories(): string[] {
    return [...new Set(this.faqItems.map((item) => item.category))];
  }
}
