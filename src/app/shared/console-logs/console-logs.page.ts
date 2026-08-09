import { Component, OnInit } from '@angular/core';
import {
  ConsoleLogService,
  LogEntry,
} from '../../services/console-log.service';
import { CommonService } from '../../services/common.service';

@Component({
  selector: 'app-console-logs',
  templateUrl: './console-logs.page.html',
  styleUrls: ['./console-logs.page.scss'],
  standalone: false,
})
export class ConsoleLogsPage implements OnInit {
  open = false;
  theme: string;
  expandedLogs = new Set<number>();

  constructor(
    public logService: ConsoleLogService,
    private commonService: CommonService,
  ) {}

  ngOnInit() {
    this.theme = this.commonService.getTheme();
    // console.log(this.logService.logs());
  }

  setOpen(state: boolean) {
    this.open = state;
  }

  badgeColor(level: LogEntry['level']): string {
    return {
      error: 'danger',
      warn: 'warning',
      log: 'medium',
    }[level];
  }

  get logs(): LogEntry[] {
    return [...this.logService.logs()].reverse();
  }

  isNewDateGroup(log: LogEntry, index: number): boolean {
    if (index === 0) return true;
    const prevLog = this.logs[index - 1];
    const currentDate = new Date(log.timestamp).toDateString();
    const prevDate = new Date(prevLog.timestamp).toDateString();
    return currentDate !== prevDate;
  }

  toggleExpand(index: number) {
    if (this.expandedLogs.has(index)) {
      this.expandedLogs.delete(index);
    } else {
      this.expandedLogs.add(index);
    }
  }

  isExpanded(index: number): boolean {
    return this.expandedLogs.has(index);
  }

  isExpandable(log: LogEntry): boolean {
    if (log.level === 'error') {
      return !!log.stack;
    }
    if (log.level === 'warn') {
      const parts = log.message.split('\n');
      return parts.length > 1;
    }
    return log.message.includes('\n');
  }

  getFirstLine(message: string, level?: string): string {
    if (!message) return '';
    // if (level === 'warn') {
    //   const parts = message.split('. ');
    //   if (parts.length > 0) {
    //     let first = parts[0];
    //     if (!first.endsWith('.')) {
    //       first += '.';
    //     }
    //     return first;
    //   }
    // }

    return message.split('\n')[0];
  }

  getRemainingLines(message: string, level?: string): string {
    if (!message) return '';
    // if (level === 'warn') {
    //   const parts = message.split('. ');
    //   if (parts.length > 1) {
    //     return parts
    //       .slice(1)
    //       .map((part) => part.trim())
    //       .filter((part) => part.length > 0)
    //       .map((part) => (part.endsWith('.') ? part : part + '.'))
    //       .join('\n');
    //   }
    //   return '';
    // }
    const lines = message.split('\n');
    return lines.slice(1).join('\n');
  }
}
