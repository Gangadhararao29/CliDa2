import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NotificationService, NotificationSettings, PaymentNotification } from './notification.service';
import { DataBaseService } from './data-base.service';
import { LocalStorageUtils, localStorConsts } from '../shared/local-storage';

describe('NotificationService', () => {
  let service: NotificationService;
  let mockRouter: any;
  let mockDataBaseService: any;

  beforeEach(() => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockDataBaseService = jasmine.createSpyObj('DataBaseService', ['getAllClientsDataWithKeys']);

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: Router, useValue: mockRouter },
        { provide: DataBaseService, useValue: mockDataBaseService },
      ],
    });

    service = TestBed.inject(NotificationService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('addMonths', () => {
    it('should correctly add months to a date without day overflow', () => {
      const start = new Date(2023, 0, 15); // Jan 15, 2023
      const result = service.addMonths(start, 6); // July 15, 2023
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(6); // July
      expect(result.getDate()).toBe(15);
    });

    it('should roll back to the last day of the month when day overflow occurs', () => {
      const start = new Date(2023, 0, 31); // Jan 31, 2023
      const result = service.addMonths(start, 1); // Feb 28, 2023 (non-leap year)
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(1); // Feb
      expect(result.getDate()).toBe(28);
    });

    it('should support leap years correctly', () => {
      const start = new Date(2024, 0, 31); // Jan 31, 2024
      const result = service.addMonths(start, 1); // Feb 29, 2024 (leap year)
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(1); // Feb
      expect(result.getDate()).toBe(29);
    });
  });

  describe('shouldTriggerReminder', () => {
    it('should return trigger false if settings are disabled', () => {
      const settings: NotificationSettings = {
        enabled: false,
        notifyBeforeMonths: 6,
        minimumAgeYears: 3,
        reminderIntervalMonths: 2,
      };
      service.saveSettings(settings);

      const startDate = new Date(2023, 0, 15);
      const checkDate = new Date(2025, 6, 15); // Exactly 30 months later

      const result = service.shouldTriggerReminder(startDate, checkDate);
      expect(result.trigger).toBe(false);
    });

    it('should trigger correctly on the exact milestone date', () => {
      const settings: NotificationSettings = {
        enabled: true,
        notifyBeforeMonths: 6,
        minimumAgeYears: 3,
        reminderIntervalMonths: 2,
      };
      service.saveSettings(settings);

      const startDate = new Date(2023, 0, 15);
      const checkDate = new Date(2025, 6, 15); // Jan 15, 2023 + 30 months = July 15, 2025

      const result = service.shouldTriggerReminder(startDate, checkDate);
      expect(result.trigger).toBe(true);
      expect(result.targetYear).toBe(3);
      expect(result.monthsLeft).toBe(6);
    });

    it('should trigger on end-of-month dates roll-back milestones', () => {
      const settings: NotificationSettings = {
        enabled: true,
        notifyBeforeMonths: 11,
        minimumAgeYears: 3,
        reminderIntervalMonths: 1,
      };
      service.saveSettings(settings);

      const startDate = new Date(2023, 0, 31);
      const checkDate = new Date(2025, 1, 28); // Jan 31, 2023 + 25 months = Feb 28, 2025

      const result = service.shouldTriggerReminder(startDate, checkDate);
      expect(result.trigger).toBe(true);
      expect(result.monthsLeft).toBe(11);
    });

    it('should not trigger if check date does not match any milestone', () => {
      const settings: NotificationSettings = {
        enabled: true,
        notifyBeforeMonths: 6,
        minimumAgeYears: 3,
        reminderIntervalMonths: 2,
      };
      service.saveSettings(settings);

      const startDate = new Date(2023, 0, 15);
      const checkDate = new Date(2025, 6, 16); // One day after milestone

      const result = service.shouldTriggerReminder(startDate, checkDate);
      expect(result.trigger).toBe(false);
    });
  });

  describe('shouldSuppressNotification', () => {
    it('should suppress notifications that are within the interval', () => {
      const settings: NotificationSettings = {
        enabled: true,
        notifyBeforeMonths: 6,
        minimumAgeYears: 3,
        reminderIntervalMonths: 2,
      };
      service.saveSettings(settings);

      const recordId = '12345';
      const existingNotification: PaymentNotification = {
        id: `reminder_${recordId}_someCheckDate`,
        key: 'clientKey',
        name: 'John Doe',
        principal: '10,000',
        startDate: new Date(2023, 0, 15),
        read: false,
        createdAt: new Date(2025, 6, 15),
        body: 'Reminder body',
      };

      LocalStorageUtils.setItem(localStorConsts.appNotifications, [existingNotification]);

      const checkDate = new Date(2025, 6, 30);
      const isSuppressed = (service as any).shouldSuppressNotification(recordId, checkDate);
      expect(isSuppressed).toBe(true);
    });

    it('should not suppress notifications that are outside/on the interval', () => {
      const settings: NotificationSettings = {
        enabled: true,
        notifyBeforeMonths: 6,
        minimumAgeYears: 3,
        reminderIntervalMonths: 2,
      };
      service.saveSettings(settings);

      const recordId = '12345';
      const existingNotification: PaymentNotification = {
        id: `reminder_${recordId}_someCheckDate`,
        key: 'clientKey',
        name: 'John Doe',
        principal: '10,000',
        startDate: new Date(2023, 0, 15),
        read: false,
        createdAt: new Date(2025, 6, 15),
        body: 'Reminder body',
      };

      LocalStorageUtils.setItem(localStorConsts.appNotifications, [existingNotification]);

      const checkDate = new Date(2025, 8, 15);
      const isSuppressed = (service as any).shouldSuppressNotification(recordId, checkDate);
      expect(isSuppressed).toBe(false);
    });
  });

  describe('saveNotification', () => {
    it('should not save duplicate notifications with the same ID', () => {
      const notification: PaymentNotification = {
        id: 'test_notification_id',
        key: 'clientKey',
        name: 'John Doe',
        principal: '10,000',
        startDate: new Date(2023, 0, 15),
        read: false,
        createdAt: new Date(),
        body: 'Reminder body',
      };

      (service as any).saveNotification(notification);
      expect(service.getAllNotifications().length).toBe(1);

      (service as any).saveNotification(notification);
      expect(service.getAllNotifications().length).toBe(1);
    });
  });
});
