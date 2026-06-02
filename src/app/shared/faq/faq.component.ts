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
      id: 'credits-debits',
      category: 'Getting Started',
      question: '📊 What are Credits and Debits?',
      answer: 'Credits represent money you provided to clients (loans, advances), while Debits represent money clients owe you.<br>You can easily track and manage these transaction types from your client list.',
    },
    {
      id: 'colors',
      category: 'Getting Started',
      question: '🎨 What do the different colors mean?',
      answer: 'Colors indicate the age and status of a transaction.<br>🟢 Green means the transaction is closed. For active ones:<br>🔴 <b>Red</b> warns it is over 2.5 years old<br>🟡 <b>Yellow</b> indicates over 2 years old<br>🔵 <b>Blue</b> shows over 1 year old<br>⚫ <b>Dark/Black</b> means it is less than a year old.',
    },
    {
      id: 'charts',
      category: 'Dashboard',
      question: '📈 What charts are available in the Dashboard?',
      answer: 'The Dashboard includes:<br>📊 <b>Pie Chart</b>: total credits vs debits breakdown.<br>📈 <b>Line Chart</b>: trends over time.<br>📋 <b>Bar Charts</b>: Top Clients (by amount) and Interest Distribution.',
    },
    {
      id: 'calculators',
      category: 'Tools',
      question: '🧮 What calculators are available?',
      answer: 'Three calculators are included:<br><b>1. Simple Interest</b>: for basic interest on principal.<br><b>2. Compound Interest</b>: with different compounding frequencies.<br><b>3. Lease Calculator</b>: to estimate lease payments and total cost.',
    },
    {
      id: 'notifications',
      category: 'Notifications',
      question: '🔔 How do Payment Reminders work?',
      answer: 'You can enable Payment Reminders in the Information page to get notified about long-running transactions.<br>You can configure the minimum transaction age (Trigger After), when to be notified (Notify Before), and how often to receive reminders.',
    },
    {
      id: 'logs',
      category: 'Features',
      question: '📝 Where can I see the Operation Logs?',
      answer: 'Operation Logs track all your actions in the app, such as adding clients, modifying data, deletions, and backups.<br>Access them from the Information page to review your complete history of changes.',
    },
    {
      id: 'backup',
      category: 'Data Safety',
      question: '☁️ How does Auto Backup work?',
      answer: 'When enabled, Auto Backup securely saves your data to the cloud at your chosen interval (Daily, Weekly, or Monthly). This protects your data from accidental loss.<br>Enable it by signing in with your Google account in the Information section.',
    },
    {
      id: 'restore',
      category: 'Data Safety',
      question: '♻️ How do I restore my data from the cloud?',
      answer: 'Use <b>Manual Cloud Sync</b> in the Information page to recover your data.<br>On a new device, sign in with your Google account first, select your preferred sync mode (Merge or Overwrite), and click Restore.',
    },
    {
      id: 'local-sync',
      category: 'Data Management',
      question: '📁 Can I export my data locally?',
      answer: 'Yes! Under "Local Data Sync" in the Information page, you can export your data securely to your device as a JSON or Excel file.<br>You can also import these files later to restore or merge data.',
    },
    {
      id: 'data-maintenance',
      category: 'Data Management',
      question: '🧹 What is Data Maintenance?',
      answer: 'Data Maintenance tools allow you to:<br>• Fix data errors<br>• Permanently clean approved/closed transactions to free up space<br>• Perform a factory reset to safely wipe all local application data.',
    },
    {
      id: 'offline',
      category: 'Features',
      question: '📱 Can I use the app offline?',
      answer: 'Absolutely! This is an offline-first app. Your data is stored locally on your device, meaning you can access and edit it without internet.<br><i>Note: Cloud Backup and Sync features do require an internet connection.</i>',
    },
    {
      id: 'data-loss',
      category: 'Data Safety',
      question: '⚠️ What happens if I clear my browser data?',
      answer: 'Clearing your browser/app data will delete your local storage.<br>This is why Auto Backup or Local Exports are crucial. Always ensure your data is backed up to the cloud or exported locally before clearing device data.',
    }
  ];

  getCategories(): string[] {
    return [...new Set(this.faqItems.map((item) => item.category))];
  }
}
