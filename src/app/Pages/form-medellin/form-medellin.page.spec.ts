import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormMedellinPage } from './form-medellin.page';

describe('FormMedellinPage', () => {
  let component: FormMedellinPage;
  let fixture: ComponentFixture<FormMedellinPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(FormMedellinPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
