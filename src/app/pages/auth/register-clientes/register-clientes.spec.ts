import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterClientes } from './register-clientes';

describe('RegisterClientes', () => {
  let component: RegisterClientes;
  let fixture: ComponentFixture<RegisterClientes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterClientes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterClientes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
