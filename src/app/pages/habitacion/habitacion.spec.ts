import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Habitacion } from './habitacion';

describe('Habitacion', () => {
  let component: Habitacion;
  let fixture: ComponentFixture<Habitacion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Habitacion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Habitacion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
