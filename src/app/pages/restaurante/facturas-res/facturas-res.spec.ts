import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacturasRes } from './facturas-res';

describe('FacturasRes', () => {
  let component: FacturasRes;
  let fixture: ComponentFixture<FacturasRes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacturasRes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacturasRes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
