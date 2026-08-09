import { ErrorHandler, Injectable } from '@angular/core';
import { ConsoleLogService } from '../services/console-log.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private consoleLogService: ConsoleLogService) {}

  handleError(error: any) {
    // console.log('GlobalErrorHandler: An error occurred:', error);

    this.consoleLogService.add({
      timestamp: new Date(),
      level: 'error',
      message: error?.message || String(error),
      stack: error?.stack,
    });

    console.error(error);
  }
}
