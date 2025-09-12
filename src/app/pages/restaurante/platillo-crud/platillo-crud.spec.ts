import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlatilloCrud } from './platillo-crud';

describe('PlatilloCrud', () => {
  let component: PlatilloCrud;
  let fixture: ComponentFixture<PlatilloCrud>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlatilloCrud]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlatilloCrud);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
