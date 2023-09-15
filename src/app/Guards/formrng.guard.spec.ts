import { TestBed } from '@angular/core/testing';

import { FormrngGuard } from './formrng.guard';

describe('FormrngGuard', () => {
  let guard: FormrngGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(FormrngGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
