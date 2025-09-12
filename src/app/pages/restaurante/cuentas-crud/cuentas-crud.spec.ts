import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CuentasCrud } from './cuentas-crud';

describe('CuentasCrud', () => {
  let component: CuentasCrud;
  let fixture: ComponentFixture<CuentasCrud>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CuentasCrud]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CuentasCrud);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
