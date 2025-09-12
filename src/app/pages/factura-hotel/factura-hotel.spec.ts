import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacturaHotel } from './factura-hotel';

describe('FacturaHotel', () => {
  let component: FacturaHotel;
  let fixture: ComponentFixture<FacturaHotel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacturaHotel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacturaHotel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
