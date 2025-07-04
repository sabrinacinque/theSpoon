import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RestaurantSection } from './restaurant-section';

describe('RestaurantSection', () => {
  let component: RestaurantSection;
  let fixture: ComponentFixture<RestaurantSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RestaurantSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RestaurantSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
