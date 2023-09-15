import { TestBed } from '@angular/core/testing';

import { FormmedGuard } from './formmed.guard';

describe('FormmedGuard', () => {
  let guard: FormmedGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(FormmedGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
