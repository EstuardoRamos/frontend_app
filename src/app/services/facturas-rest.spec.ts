import { TestBed } from '@angular/core/testing';

import { FacturasRest } from './facturas-rest';

describe('FacturasRest', () => {
  let service: FacturasRest;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FacturasRest);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
