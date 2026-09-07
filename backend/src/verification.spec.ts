import { isVerifiedEnough } from './verification';

describe('isVerifiedEnough', () => {
  it('lets a government ID verified user apply to any job', () => {
    expect(isVerifiedEnough('GOVT_ID', 'GOVT_ID')).toBe(true);
    expect(isVerifiedEnough('GOVT_ID', 'EMAIL')).toBe(true);
    expect(isVerifiedEnough('GOVT_ID', 'NONE')).toBe(true);
  });

  it('blocks an email only user from a government ID job', () => {
    expect(isVerifiedEnough('EMAIL', 'GOVT_ID')).toBe(false);
  });

  it('blocks a brand new user from almost everything', () => {
    expect(isVerifiedEnough('NONE', 'GOVT_ID')).toBe(false);
    expect(isVerifiedEnough('NONE', 'EMAIL')).toBe(false);
  });

  it('lets anyone apply to a job that needs no verification', () => {
    expect(isVerifiedEnough('NONE', 'NONE')).toBe(true);
    expect(isVerifiedEnough('EMAIL', 'NONE')).toBe(true);
  });
});
