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
      answer:
        'To get started with CliDa, navigate to the Clients tab and begin by adding your first client using the "+" button. For each client, you can create transactions classified as either Credits or Debits, specifying the principal amount, interest rate, and start date. The application will automatically track the status of each record. Use the Dashboard to get high-level insights, view total outstanding balances, and check the interactive Tips Carousel for guided tours.',
    },
    {
      id: 'credits-debits',
      category: 'Getting Started',
      question: '📊 What are Credits and Debits?',
      answer:
        'In CliDa, transaction types are defined as follows:<br>• <b>Credits:</b> Loans or advances you provided to others (receivables/investments). These are represented as positive values.<br>• <b>Debits:</b> Money or funding you received from others (payables/borrowings). These are represented as negative values.<br>The app automatically calculates the accumulated interest for both transaction types, enabling you to manage what you owe and what is owed to you from a single interface.',
    },
    {
      id: 'colors',
      category: 'Getting Started',
      question: '🎨 What do the different colors mean?',
      answer:
        'CliDa uses visual color coding to indicate the age of active transactions:<br>• 🔴 <b>Red:</b> Represents aging transactions that are 2.5 years or older.<br>• 🟡 <b>Yellow:</b> Represents transactions that are between 2 and 2.5 years old.<br>• 🔵 <b>Blue:</b> Represents transactions that are between 1 and 2 years old.<br>• ⚫ <b>Gray:</b> Represents newer transactions that are less than 1 year old.<br>• 🟢 <b>Green:</b> Represents successfully paid/closed transactions. This categorization helps you instantly prioritize collections and follow-ups.',
    },
    {
      id: 'search-bar',
      category: 'Search & Organization',
      question: '🔍 How do I search for clients or transactions?',
      answer:
        'Use the search bar at the top of the Clients page to instantly search through your records. You can search by client name, principal amount, interest rate, or year. Results update in real-time as you type, matching both active and closed transactions simultaneously, making it easy to find historical records.',
    },
    {
      id: 'advanced-filters',
      category: 'Search & Organization',
      question: '🔎 What are Advanced Search Filters?',
      answer:
        'Click the funnel icon next to the search bar to access Advanced Search. You can filter transactions by defining a specific range for the principal amount and filtering by specific start or end dates. You can also save your filter criteria as custom models to quickly re-apply the same search parameters in the future.',
    },
    {
      id: 'organize-lists',
      category: 'Search & Organization',
      question: '📋 How can I organize my client list?',
      answer:
        'Organize and view your client list efficiently by sorting them based on alphabetical name order, interest earnings, time period, or principal amount. Switch between the Credits, Debits, and Leases tabs to view specific categories of records separately, and use the built-in pagination controls to easily navigate large lists.',
    },
    {
      id: 'lease-swipe',
      category: 'Features',
      question: '👆 How do I edit or delete lease records?',
      answer:
        'For lease records, swipe left on any row in the list to reveal action buttons. Tap the pencil icon to edit the lease details (such as acreage, transaction history, or notes) or tap the red trash icon to delete the record. If you are on a desktop or a non-touch screen device, you can click and drag the item to slide it.',
    },
    {
      id: 'logs',
      category: 'Features',
      question: '📝 Where are Operation Logs?',
      answer:
        'Operation Logs act as a complete audit trail for your app. Every action—including adding a client, editing a transaction, approving/closing a record, or performing a backup—is logged with a timestamp. You can access these logs on the About page to review historical changes and ensure data accountability.',
    },
    {
      id: 'offline',
      category: 'Features',
      question: '📱 Can I use the app offline?',
      answer:
        'Yes, CliDa is built with an offline-first architecture. All your clients, transactions, calculations, and settings are saved securely on your device\'s local database. You can add, edit, and search your data without an active internet connection. An internet connection is only needed when syncing data to Cloud Backup or restoring it.',
    },
    {
      id: 'calculators',
      category: 'Tools',
      question: '🧮 What calculators are available?',
      answer:
        'CliDa comes with built-in financial calculators:<br>• <b>Simple Interest:</b> Computes basic interest accumulated over a specific date range or duration.<br>• <b>Compound Interest:</b> Calculates interest compounded at custom intervals (e.g., monthly, quarterly, half-yearly, or annually).<br>• <b>Lease Calculator:</b> Computes payments, durations, and totals for agricultural or commercial land leases over multiple years based on acres and rate per acre.',
    },
    {
      id: 'share-calculations',
      category: 'Tools',
      question: '📤 How do I share calculations?',
      answer:
        'After computing interest in the calculator, you can share the breakdown directly. Click the Share button to copy the calculation details, dates, rates, and totals to your clipboard, or share a live link. If the recipient clicks the link, the calculator will automatically load with the exact inputs pre-filled.',
    },
    {
      id: 'charts',
      category: 'Dashboard',
      question: '📈 What charts are available?',
      answer:
        'The Dashboard provides visual analytics using multiple chart types:<br>• <b>Pie Chart:</b> Shows the visual breakdown of Credits vs. Debits.<br>• <b>Line Chart:</b> Illustrates interest and principal trends over time.<br>• <b>Bar Charts:</b> Display your top earning clients and interest rate distribution. You can tap on legends to show/hide specific datasets.',
    },
    {
      id: 'dashboard-custom',
      category: 'Dashboard',
      question: '⚙️ How do I customize my dashboard?',
      answer:
        'Tailor the dashboard to your workflow by clicking "Customize Dashboard". You can toggle individual widgets on or off, including Stats, Graphs, Charts, Top Earners, and Recent/Upcoming transactions, allowing you to focus on the information most relevant to you.',
    },
    {
      id: 'notifications',
      category: 'Notifications',
      question: '🔔 How do Payment Reminders work?',
      answer:
        'Payment reminders help you keep track of aging debts. Under Settings, you can configure automatic reminder rules by setting a minimum transaction age (e.g., remind only if a record is 1 to 3+ years old), choosing how many months before the due date you want to be alerted, and adjusting the frequency of recurring alerts.',
    },
    {
      id: 'manage-notifications',
      category: 'Notifications',
      question: '🔕 How do I manage notifications?',
      answer:
        'You can toggle payment alerts on or off in Settings. When enabled, a notification icon will appear when reminders are due. Click the icon to view, mark individual items as read, dismiss alerts, or clear all at once. Clicking a reminder navigates you directly to that transaction\'s details.',
    },
    {
      id: 'backup',
      category: 'Data Safety',
      question: '☁️ How does Auto Backup work?',
      answer:
        'Protect your data by signing in with your Google account in Account Settings. Once signed in, enable Auto Backup and select your preferred interval (Daily, Weekly, or Monthly). The app will automatically upload a secure copy of your database, settings, and logs to the cloud in the background whenever local changes are made.',
    },
    {
      id: 'restore',
      category: 'Data Safety',
      question: '♻️ How do I restore data from cloud?',
      answer:
        'To restore your data, go to Account Settings, sign in to your Google account, and click "Restore from Cloud Backup." You can choose:<br>• <b>Merge:</b> Combines the cloud copy with your current local database without deleting new local records.<br>• <b>Overwrite:</b> Replaces the entire local database with the cloud copy (useful when transferring to a new device).',
    },
    {
      id: 'export-local',
      category: 'Data Safety',
      question: '💾 Can I export data locally?',
      answer:
        'Yes, you can export your entire database for manual backups or offline sharing. Go to Account Settings under "Local Data Sync" and select either **JSON** format (recommended for importing back into CliDa) or **Excel** format (.xlsx) to view and edit your transactions in spreadsheet software.',
    },
    {
      id: 'data-loss',
      category: 'Data Safety',
      question: '⚠️ What if I clear browser/app data?',
      answer:
        'Because CliDa is an offline-first app, clearing your browser cache, site data, or uninstalling the app will delete the local database where your records are stored. To prevent accidental data loss, always enable Google Cloud Auto Backup or regularly export your database as a local file.',
    },
    {
      id: 'data-maintenance',
      category: 'Data Management',
      question: '🧹 What is Data Maintenance?',
      answer:
        'The Data Maintenance toolkit in Account Settings provides administrative controls for your database:<br>• <b>Database Audit/Repair:</b> Fixes corrupted structures and indexing issues.<br>• <b>Purge Closed Records:</b> Cleans up closed/paid transactions to free storage space.<br>• <b>Factory Reset:</b> Permanently deletes all local data, settings, and logs to start fresh.',
    },
  ];

  getCategories(): string[] {
    return [...new Set(this.faqItems.map((item) => item.category))];
  }
}
