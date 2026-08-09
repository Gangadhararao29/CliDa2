import { Injectable, signal } from '@angular/core';
import { localStorConsts, LocalStorageUtils } from '../shared/local-storage';

export interface LogEntry {
  timestamp: Date | string;
  level: 'error' | 'warn' | 'log';
  message: string;
  stack?: string;
}

@Injectable({ providedIn: 'root' })
export class ConsoleLogService {
  private readonly storageKey = localStorConsts.consoleLogs;
  private readonly maxEntries = 20;
  private logsSignal = signal<LogEntry[]>([]);
  readonly logs = this.logsSignal.asReadonly();

  constructor() {
    this.interceptConsole();
    this.interceptWindowErrors();

    const storedLogs = this.loadFromStorage();
    const initialLogs = storedLogs.length ? storedLogs : this.getDefaultLogs();
    this.logsSignal.set(initialLogs);
    this.persistLogs(initialLogs);
  }

  initialize() {
    console.log('[ConsoleLogService]', 'initializing console log service...');
  }

  add(entry: LogEntry) {
    const current = this.loadFromStorage();
    const updated = [...current, entry].slice(-this.maxEntries);
    this.logsSignal.set(updated);
    this.persistLogs(updated);
  }

  clear() {
    this.logsSignal.set([]);
    this.persistLogs([]);
  }

  private getDefaultLogs(): LogEntry[] {
    return [];
  }

  private loadFromStorage(): LogEntry[] {
    try {
      const storedLogs = LocalStorageUtils.getItem<LogEntry[]>(this.storageKey);
      if (!storedLogs || !Array.isArray(storedLogs)) {
        return [];
      }

      return storedLogs
        .filter((entry) => entry && typeof entry.message === 'string')
        .map((entry) => ({
          ...entry,
          timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
        })) as LogEntry[];
    } catch {
      return [];
    }
  }

  private persistLogs(logs: LogEntry[]) {
    try {
      LocalStorageUtils.setItem(
        this.storageKey,
        logs.map((entry) => ({
          ...entry,
          timestamp:
            entry.timestamp instanceof Date
              ? entry.timestamp.toISOString()
              : entry.timestamp,
        })),
      );
    } catch {
      // Ignore storage failures and keep the in-memory list as the source of truth.
    }
  }

  private interceptConsole() {
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args: any[]) => {
      // console.log('from error console', args);
      this.add({
        timestamp: new Date(),
        level: 'error',
        message: args.map((a) => this.stringify(a)).join(' '),
        stack: args.map((a) => a?.stack).join(''),
      });

      originalError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      // console.log('from warn console', args);

      this.add({
        timestamp: new Date(),
        level: 'warn',
        message: args.map((a) => this.stringify(a)).join('\n'),
      });

      originalWarn.apply(console, args);
    };
  }

  private interceptWindowErrors() {
    window.addEventListener('error', (event) => {
      this.add({
        timestamp: new Date(),
        level: 'error',
        message: event.message,
        stack: event.error?.stack,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.add({
        timestamp: new Date(),
        level: 'error',
        message: `Unhandled promise rejection: ${event.reason}`,
        stack: event.reason?.stack,
      });
    });
  }

  private stringify(val: any): string {
    if (val === null) return 'null';
    if (val === undefined) return 'undefined';
    if (typeof val === 'string') return val;
    if (val instanceof Error) {
      return val.message || val.toString();
    }
    if (typeof val === 'object') {
      try {
        return JSON.stringify(val);
      } catch {
        return String(val);
      }
    }
    return String(val);
  }
}
