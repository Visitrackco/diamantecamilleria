import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DescansosPage } from './descansos.page';

describe('DescansosPage', () => {
  let component: DescansosPage;
  let fixture: ComponentFixture<DescansosPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(DescansosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
