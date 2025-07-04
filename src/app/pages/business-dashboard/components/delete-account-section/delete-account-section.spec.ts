import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteAccountSection } from './delete-account-section';

describe('DeleteAccountSection', () => {
  let component: DeleteAccountSection;
  let fixture: ComponentFixture<DeleteAccountSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteAccountSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteAccountSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
