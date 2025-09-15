import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewsPlatilloList } from './reviews-platillo-list';

describe('ReviewsPlatilloList', () => {
  let component: ReviewsPlatilloList;
  let fixture: ComponentFixture<ReviewsPlatilloList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewsPlatilloList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReviewsPlatilloList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
