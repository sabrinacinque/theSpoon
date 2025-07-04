import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusinessDashboard } from './business-dashboard';

describe('BusinessDashboard', () => {
  let component: BusinessDashboard;
  let fixture: ComponentFixture<BusinessDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BusinessDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BusinessDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
