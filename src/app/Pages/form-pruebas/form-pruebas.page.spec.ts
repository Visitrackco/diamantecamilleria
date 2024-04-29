import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormPruebasPage } from './form-pruebas.page';

describe('FormPruebasPage', () => {
  let component: FormPruebasPage;
  let fixture: ComponentFixture<FormPruebasPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(FormPruebasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
