import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewPlatillo } from './review-platillo';

describe('ReviewPlatillo', () => {
  let component: ReviewPlatillo;
  let fixture: ComponentFixture<ReviewPlatillo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewPlatillo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReviewPlatillo);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
