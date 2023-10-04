import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MotivosFormPage } from './motivos-form.page';

describe('MotivosFormPage', () => {
  let component: MotivosFormPage;
  let fixture: ComponentFixture<MotivosFormPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(MotivosFormPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
