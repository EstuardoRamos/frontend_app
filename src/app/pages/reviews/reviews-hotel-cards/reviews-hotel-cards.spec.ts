import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewsHotelCards } from './reviews-hotel-cards';

describe('ReviewsHotelCards', () => {
  let component: ReviewsHotelCards;
  let fixture: ComponentFixture<ReviewsHotelCards>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewsHotelCards]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReviewsHotelCards);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
