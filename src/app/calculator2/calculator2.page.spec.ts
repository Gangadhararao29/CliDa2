import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Calculator2Page } from './calculator2.page';

describe('Calculator2Page', () => {
  let component: Calculator2Page;
  let fixture: ComponentFixture<Calculator2Page>;

  beforeEach(() => {
    fixture = TestBed.createComponent(Calculator2Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
