import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubscriptionSection } from './subscription-section';

describe('SubscriptionSection', () => {
  let component: SubscriptionSection;
  let fixture: ComponentFixture<SubscriptionSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubscriptionSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubscriptionSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
