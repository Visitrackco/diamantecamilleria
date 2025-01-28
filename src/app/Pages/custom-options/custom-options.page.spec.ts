import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomOptionsPage } from './custom-options.page';

describe('CustomOptionsPage', () => {
  let component: CustomOptionsPage;
  let fixture: ComponentFixture<CustomOptionsPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(CustomOptionsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
