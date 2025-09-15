import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PopularRestaurante } from './popular-restaurante';

describe('PopularRestaurante', () => {
  let component: PopularRestaurante;
  let fixture: ComponentFixture<PopularRestaurante>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PopularRestaurante]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PopularRestaurante);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
