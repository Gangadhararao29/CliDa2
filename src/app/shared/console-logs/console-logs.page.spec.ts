import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConsoleLogsPage } from './console-logs.page';

describe('ConsoleLogsPage', () => {
  let component: ConsoleLogsPage;
  let fixture: ComponentFixture<ConsoleLogsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ConsoleLogsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
